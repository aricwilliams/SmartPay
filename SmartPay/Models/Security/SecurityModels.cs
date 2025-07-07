using System.ComponentModel.DataAnnotations;

namespace SmartPay.Models.Security
{
    public class SecurityEvent
    {
        [Key]
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string EventType { get; set; } = string.Empty; // Login, Logout, FailedLogin, PasswordChange, etc.
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public SecurityRiskLevel RiskLevel { get; set; }
        public string Location { get; set; } = string.Empty; // GeoIP location
        public bool IsBlocked { get; set; }
    }

    public class UserSession
    {
        [Key]
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string SessionToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastAccessedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsActive { get; set; }
        public bool IsRevoked { get; set; }
        public string? RevokedReason { get; set; }
    }

    public class TwoFactorAuth
    {
        [Key]
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Secret { get; set; } = string.Empty; // TOTP secret
        public string BackupCodes { get; set; } = string.Empty; // JSON array of backup codes
        public bool IsEnabled { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public string? RecoveryEmail { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LoginAttempt
    {
        [Key]
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public bool IsSuccessful { get; set; }
        public string? FailureReason { get; set; }
        public DateTime AttemptedAt { get; set; }
        public string UserAgent { get; set; } = string.Empty;
    }

    public class ApiRateLimit
    {
        [Key]
        public string Id { get; set; } = string.Empty; // Composite of IP + Endpoint or User + Endpoint
        public string Identifier { get; set; } = string.Empty; // IP address or User ID
        public string Endpoint { get; set; } = string.Empty;
        public int RequestCount { get; set; }
        public DateTime WindowStart { get; set; }
        public DateTime LastRequestAt { get; set; }
        public bool IsBlocked { get; set; }
        public DateTime? BlockedUntil { get; set; }
    }

    public enum SecurityRiskLevel
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum SecurityEventType
    {
        Login,
        Logout,
        FailedLogin,
        PasswordChange,
        PasswordReset,
        TwoFactorEnabled,
        TwoFactorDisabled,
        TwoFactorUsed,
        SessionRevoked,
        SuspiciousActivity,
        AccountLocked,
        AccountUnlocked,
        PermissionChanged,
        DataAccess,
        DataModification,
        ApiRateLimitExceeded
    }
}