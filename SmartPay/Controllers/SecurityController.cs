using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartPay.Models.Security;
using SmartPay.Services;
using OtpNet;

namespace SmartPay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SecurityController : ControllerBase
    {
        private readonly ISecurityService _securityService;
        private readonly SmartPayDbContext _context;

        public SecurityController(ISecurityService securityService, SmartPayDbContext context)
        {
            _securityService = securityService;
            _context = context;
        }

        [HttpPost("enable-2fa")]
        public async Task<ActionResult> EnableTwoFactor([FromBody] EnableTwoFactorRequest request)
        {
            var userId = GetCurrentUserId();
            var twoFactor = await _securityService.EnableTwoFactorAsync(userId, request.RecoveryEmail);
            
            var secretBytes = Base32Encoding.ToBytes(twoFactor.Secret);
            var totp = new Totp(secretBytes);
            var qrCodeUrl = $"otpauth://totp/SmartPay:{request.Email}?secret={twoFactor.Secret}&issuer=SmartPay";

            return Ok(new
            {
                secret = twoFactor.Secret,
                qrCodeUrl = qrCodeUrl,
                backupCodes = System.Text.Json.JsonSerializer.Deserialize<string[]>(twoFactor.BackupCodes),
                message = "Two-factor authentication enabled successfully"
            });
        }

        [HttpPost("verify-2fa")]
        public async Task<ActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorRequest request)
        {
            var userId = GetCurrentUserId();
            var isValid = await _securityService.ValidateTotpAsync(userId, request.Token);

            if (!isValid)
            {
                return BadRequest(new { message = "Invalid TOTP token" });
            }

            return Ok(new { message = "Two-factor authentication verified successfully" });
        }

        [HttpPost("use-backup-code")]
        public async Task<ActionResult> UseBackupCode([FromBody] UseBackupCodeRequest request)
        {
            var userId = GetCurrentUserId();
            var isValid = await _securityService.UseBackupCodeAsync(userId, request.Code);

            if (!isValid)
            {
                return BadRequest(new { message = "Invalid backup code" });
            }

            return Ok(new { message = "Backup code used successfully" });
        }

        [HttpGet("sessions")]
        public async Task<ActionResult> GetUserSessions()
        {
            var userId = GetCurrentUserId();
            var sessions = await _context.UserSessions
                .Where(s => s.UserId == userId && s.IsActive)
                .OrderByDescending(s => s.LastAccessedAt)
                .Select(s => new
                {
                    id = s.Id,
                    deviceId = s.DeviceId,
                    ipAddress = s.IpAddress,
                    userAgent = s.UserAgent,
                    createdAt = s.CreatedAt,
                    lastAccessedAt = s.LastAccessedAt,
                    isCurrent = s.SessionToken == GetCurrentSessionToken()
                })
                .ToListAsync();

            return Ok(sessions);
        }

        [HttpPost("revoke-session/{sessionId}")]
        public async Task<ActionResult> RevokeSession(Guid sessionId)
        {
            var userId = GetCurrentUserId();
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
            {
                return NotFound("Session not found");
            }

            await _securityService.RevokeSessionAsync(session.SessionToken, "User requested revocation");
            return Ok(new { message = "Session revoked successfully" });
        }

        [HttpPost("revoke-all-sessions")]
        public async Task<ActionResult> RevokeAllSessions()
        {
            var userId = GetCurrentUserId();
            await _securityService.RevokeAllUserSessionsAsync(userId, "User requested revocation of all sessions");
            return Ok(new { message = "All sessions revoked successfully" });
        }

        [HttpGet("security-events")]
        public async Task<ActionResult> GetSecurityEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = GetCurrentUserId();
            var events = await _context.SecurityEvents
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new
                {
                    id = e.Id,
                    eventType = e.EventType,
                    timestamp = e.Timestamp,
                    ipAddress = e.IpAddress,
                    location = e.Location,
                    riskLevel = e.RiskLevel.ToString(),
                    details = e.Details
                })
                .ToListAsync();

            return Ok(events);
        }

        [HttpGet("security-report")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetSecurityReport([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
            var toDate = to ?? DateTime.UtcNow;
            
            var report = await _securityService.GenerateSecurityReportAsync(fromDate, toDate);
            return Ok(report);
        }

        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Current password is incorrect" });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordLastChanged = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Revoke all other sessions
            await _securityService.RevokeAllUserSessionsAsync(userId, "Password changed");

            await _securityService.LogSecurityEventAsync(SecurityEventType.PasswordChange, userId, 
                GetClientIpAddress(), Request.Headers["User-Agent"], "Password changed successfully");

            return Ok(new { message = "Password changed successfully" });
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            return Guid.Parse(userIdClaim ?? throw new UnauthorizedAccessException());
        }

        private string GetCurrentSessionToken()
        {
            return Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        }

        private string GetClientIpAddress()
        {
            return Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? 
                   Request.Headers["X-Real-IP"].FirstOrDefault() ?? 
                   HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }

    public record EnableTwoFactorRequest(string Email, string? RecoveryEmail);
    public record VerifyTwoFactorRequest(string Token);
    public record UseBackupCodeRequest(string Code);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
}