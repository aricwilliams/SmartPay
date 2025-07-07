using Microsoft.EntityFrameworkCore;
using SmartPay.Models.Security;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using OtpNet;

namespace SmartPay.Services
{
    public interface ISecurityService
    {
        Task LogSecurityEventAsync(SecurityEventType eventType, Guid? userId, string ipAddress, string userAgent, string details, SecurityRiskLevel riskLevel = SecurityRiskLevel.Low);
        Task<bool> IsRateLimitExceededAsync(string identifier, string endpoint, int maxRequests = 100, TimeSpan? window = null);
        Task<UserSession> CreateSessionAsync(Guid userId, string ipAddress, string userAgent, string deviceId);
        Task<bool> ValidateSessionAsync(string sessionToken);
        Task RevokeSessionAsync(string sessionToken, string reason);
        Task RevokeAllUserSessionsAsync(Guid userId, string reason);
        Task<bool> IsAccountLockedAsync(string email);
        Task<TwoFactorAuth> EnableTwoFactorAsync(Guid userId, string? recoveryEmail = null);
        Task<bool> ValidateTotpAsync(Guid userId, string token);
        Task<string[]> GenerateBackupCodesAsync();
        Task<bool> UseBackupCodeAsync(Guid userId, string code);
        string GenerateSecureToken(int length = 32);
        Task<bool> IsLocationSuspiciousAsync(string ipAddress, Guid userId);
        Task CleanupExpiredSessionsAsync();
        Task<SecurityReport> GenerateSecurityReportAsync(DateTime from, DateTime to);
    }

    public class SecurityService : ISecurityService
    {
        private readonly SmartPayDbContext _context;
        private readonly ILogger<SecurityService> _logger;
        private const int MAX_LOGIN_ATTEMPTS = 5;
        private static readonly TimeSpan LOCKOUT_DURATION = TimeSpan.FromMinutes(30);
        private static readonly TimeSpan RATE_LIMIT_WINDOW = TimeSpan.FromMinutes(1);

        public SecurityService(SmartPayDbContext context, ILogger<SecurityService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogSecurityEventAsync(SecurityEventType eventType, Guid? userId, string ipAddress, string userAgent, string details, SecurityRiskLevel riskLevel = SecurityRiskLevel.Low)
        {
            var securityEvent = new SecurityEvent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventType = eventType.ToString(),
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Details = details,
                Timestamp = DateTime.UtcNow,
                RiskLevel = riskLevel,
                Location = await GetLocationFromIpAsync(ipAddress)
            };

            _context.SecurityEvents.Add(securityEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Security Event: {EventType} for User {UserId} from IP {IpAddress} - Risk: {RiskLevel}", 
                eventType, userId, ipAddress, riskLevel);

            // Check for suspicious patterns
            await CheckForSuspiciousActivityAsync(ipAddress, userId);
        }

        public async Task<bool> IsRateLimitExceededAsync(string identifier, string endpoint, int maxRequests = 100, TimeSpan? window = null)
        {
            var windowDuration = window ?? RATE_LIMIT_WINDOW;
            var windowStart = DateTime.UtcNow.Subtract(windowDuration);
            var rateLimitId = $"{identifier}:{endpoint}";

            var rateLimit = await _context.ApiRateLimits.FindAsync(rateLimitId);
            
            if (rateLimit == null)
            {
                rateLimit = new ApiRateLimit
                {
                    Id = rateLimitId,
                    Identifier = identifier,
                    Endpoint = endpoint,
                    RequestCount = 1,
                    WindowStart = DateTime.UtcNow,
                    LastRequestAt = DateTime.UtcNow
                };
                _context.ApiRateLimits.Add(rateLimit);
                await _context.SaveChangesAsync();
                return false;
            }

            // Check if we need to reset the window
            if (rateLimit.WindowStart < windowStart)
            {
                rateLimit.RequestCount = 1;
                rateLimit.WindowStart = DateTime.UtcNow;
                rateLimit.IsBlocked = false;
                rateLimit.BlockedUntil = null;
            }
            else
            {
                rateLimit.RequestCount++;
            }

            rateLimit.LastRequestAt = DateTime.UtcNow;

            // Check if limit exceeded
            if (rateLimit.RequestCount > maxRequests)
            {
                rateLimit.IsBlocked = true;
                rateLimit.BlockedUntil = DateTime.UtcNow.Add(windowDuration);
                
                await LogSecurityEventAsync(SecurityEventType.ApiRateLimitExceeded, null, identifier, "", 
                    $"Rate limit exceeded for {endpoint}: {rateLimit.RequestCount}/{maxRequests}", SecurityRiskLevel.Medium);
            }

            await _context.SaveChangesAsync();
            return rateLimit.IsBlocked;
        }

        public async Task<UserSession> CreateSessionAsync(Guid userId, string ipAddress, string userAgent, string deviceId)
        {
            var session = new UserSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                SessionToken = GenerateSecureToken(),
                RefreshToken = GenerateSecureToken(),
                IpAddress = ipAddress,
                UserAgent = userAgent,
                DeviceId = deviceId,
                CreatedAt = DateTime.UtcNow,
                LastAccessedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsActive = true
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();

            await LogSecurityEventAsync(SecurityEventType.Login, userId, ipAddress, userAgent, 
                $"New session created from device {deviceId}");

            return session;
        }

        public async Task<bool> ValidateSessionAsync(string sessionToken)
        {
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive && !s.IsRevoked);

            if (session == null || session.ExpiresAt < DateTime.UtcNow)
            {
                return false;
            }

            // Update last accessed
            session.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task RevokeSessionAsync(string sessionToken, string reason)
        {
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.SessionToken == sessionToken);

            if (session != null)
            {
                session.IsRevoked = true;
                session.RevokedReason = reason;
                session.IsActive = false;
                await _context.SaveChangesAsync();

                await LogSecurityEventAsync(SecurityEventType.SessionRevoked, session.UserId, session.IpAddress, 
                    session.UserAgent, $"Session revoked: {reason}");
            }
        }

        public async Task RevokeAllUserSessionsAsync(Guid userId, string reason)
        {
            var sessions = await _context.UserSessions
                .Where(s => s.UserId == userId && s.IsActive)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.IsRevoked = true;
                session.RevokedReason = reason;
                session.IsActive = false;
            }

            await _context.SaveChangesAsync();

            await LogSecurityEventAsync(SecurityEventType.SessionRevoked, userId, "", "", 
                $"All sessions revoked: {reason}", SecurityRiskLevel.Medium);
        }

        public async Task<bool> IsAccountLockedAsync(string email)
        {
            var cutoffTime = DateTime.UtcNow.Subtract(LOCKOUT_DURATION);
            var recentFailedAttempts = await _context.LoginAttempts
                .Where(a => a.Email == email && !a.IsSuccessful && a.AttemptedAt > cutoffTime)
                .CountAsync();

            return recentFailedAttempts >= MAX_LOGIN_ATTEMPTS;
        }

        public async Task<TwoFactorAuth> EnableTwoFactorAsync(Guid userId, string? recoveryEmail = null)
        {
            var secret = Base32Encoding.ToString(KeyGeneration.GenerateRandomKey(20));
            var backupCodes = await GenerateBackupCodesAsync();

            var twoFactor = new TwoFactorAuth
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Secret = secret,
                BackupCodes = JsonSerializer.Serialize(backupCodes),
                IsEnabled = true,
                RecoveryEmail = recoveryEmail,
                CreatedAt = DateTime.UtcNow
            };

            _context.TwoFactorAuth.Add(twoFactor);
            await _context.SaveChangesAsync();

            await LogSecurityEventAsync(SecurityEventType.TwoFactorEnabled, userId, "", "", 
                "Two-factor authentication enabled", SecurityRiskLevel.Low);

            return twoFactor;
        }

        public async Task<bool> ValidateTotpAsync(Guid userId, string token)
        {
            var twoFactor = await _context.TwoFactorAuth
                .FirstOrDefaultAsync(tf => tf.UserId == userId && tf.IsEnabled);

            if (twoFactor == null) return false;

            var secretBytes = Base32Encoding.ToBytes(twoFactor.Secret);
            var totp = new Totp(secretBytes);
            var isValid = totp.VerifyTotp(token, out _, VerificationWindow.RfcSpecifiedNetworkDelay);

            if (isValid)
            {
                twoFactor.LastUsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await LogSecurityEventAsync(SecurityEventType.TwoFactorUsed, userId, "", "", 
                    "TOTP validation successful");
            }

            return isValid;
        }

        public async Task<string[]> GenerateBackupCodesAsync()
        {
            var codes = new string[10];
            for (int i = 0; i < 10; i++)
            {
                codes[i] = GenerateSecureToken(8).ToUpper();
            }
            return codes;
        }

        public async Task<bool> UseBackupCodeAsync(Guid userId, string code)
        {
            var twoFactor = await _context.TwoFactorAuth
                .FirstOrDefaultAsync(tf => tf.UserId == userId && tf.IsEnabled);

            if (twoFactor == null) return false;

            var backupCodes = JsonSerializer.Deserialize<string[]>(twoFactor.BackupCodes) ?? new string[0];
            
            if (backupCodes.Contains(code.ToUpper()))
            {
                // Remove used backup code
                var updatedCodes = backupCodes.Where(c => c != code.ToUpper()).ToArray();
                twoFactor.BackupCodes = JsonSerializer.Serialize(updatedCodes);
                await _context.SaveChangesAsync();

                await LogSecurityEventAsync(SecurityEventType.TwoFactorUsed, userId, "", "", 
                    "Backup code used successfully", SecurityRiskLevel.Medium);

                return true;
            }

            return false;
        }

        public string GenerateSecureToken(int length = 32)
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[length];
            rng.GetBytes(bytes);
            return Convert.ToHexString(bytes).ToLower();
        }

        public async Task<bool> IsLocationSuspiciousAsync(string ipAddress, Guid userId)
        {
            // Simple implementation - check if user has logged in from this location before
            var recentLogins = await _context.SecurityEvents
                .Where(e => e.UserId == userId && e.EventType == SecurityEventType.Login.ToString())
                .OrderByDescending(e => e.Timestamp)
                .Take(10)
                .ToListAsync();

            var currentLocation = await GetLocationFromIpAsync(ipAddress);
            
            // If no recent logins from similar location, mark as suspicious
            return !recentLogins.Any(l => l.Location == currentLocation);
        }

        public async Task CleanupExpiredSessionsAsync()
        {
            var expiredSessions = await _context.UserSessions
                .Where(s => s.ExpiresAt < DateTime.UtcNow || s.IsRevoked)
                .ToListAsync();

            _context.UserSessions.RemoveRange(expiredSessions);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {Count} expired sessions", expiredSessions.Count);
        }

        public async Task<SecurityReport> GenerateSecurityReportAsync(DateTime from, DateTime to)
        {
            var events = await _context.SecurityEvents
                .Where(e => e.Timestamp >= from && e.Timestamp <= to)
                .ToListAsync();

            var report = new SecurityReport
            {
                Period = $"{from:yyyy-MM-dd} to {to:yyyy-MM-dd}",
                TotalEvents = events.Count,
                LoginAttempts = events.Count(e => e.EventType == SecurityEventType.Login.ToString()),
                FailedLogins = events.Count(e => e.EventType == SecurityEventType.FailedLogin.ToString()),
                SuspiciousActivities = events.Count(e => e.RiskLevel >= SecurityRiskLevel.Medium),
                UniqueIpAddresses = events.Select(e => e.IpAddress).Distinct().Count(),
                TopRiskEvents = events.Where(e => e.RiskLevel == SecurityRiskLevel.High || e.RiskLevel == SecurityRiskLevel.Critical)
                    .OrderByDescending(e => e.Timestamp).Take(10).ToList()
            };

            return report;
        }

        private async Task<string> GetLocationFromIpAsync(string ipAddress)
        {
            // Simplified implementation - in production, use a GeoIP service
            if (ipAddress.StartsWith("192.168.") || ipAddress.StartsWith("10.") || ipAddress == "127.0.0.1")
                return "Local Network";
            
            // Mock location based on IP hash
            var hash = ipAddress.GetHashCode();
            var locations = new[] { "New York, US", "London, UK", "Tokyo, JP", "Sydney, AU", "Toronto, CA" };
            return locations[Math.Abs(hash) % locations.Length];
        }

        private async Task CheckForSuspiciousActivityAsync(string ipAddress, Guid? userId)
        {
            var recentEvents = await _context.SecurityEvents
                .Where(e => e.IpAddress == ipAddress && e.Timestamp > DateTime.UtcNow.AddMinutes(-10))
                .CountAsync();

            if (recentEvents > 20)
            {
                await LogSecurityEventAsync(SecurityEventType.SuspiciousActivity, userId, ipAddress, "", 
                    $"High activity from IP: {recentEvents} events in 10 minutes", SecurityRiskLevel.High);
            }
        }
    }

    public class SecurityReport
    {
        public string Period { get; set; } = string.Empty;
        public int TotalEvents { get; set; }
        public int LoginAttempts { get; set; }
        public int FailedLogins { get; set; }
        public int SuspiciousActivities { get; set; }
        public int UniqueIpAddresses { get; set; }
        public List<SecurityEvent> TopRiskEvents { get; set; } = new();
    }
}