using System.ComponentModel.DataAnnotations;

namespace SmartPay.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required] 
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        public UserRole Role { get; set; }
        
        public bool IsActive { get; set; } = true;
        public bool IsEmailVerified { get; set; } = false;
        public bool IsTwoFactorEnabled { get; set; } = false;
        public bool IsLocked { get; set; } = false;
        
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime? PasswordLastChanged { get; set; }
        public DateTime? LockedUntil { get; set; }
        
        public string? ProfilePictureUrl { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Department { get; set; }
        
        // Navigation properties
        public ICollection<Wallet> Wallets { get; set; } = new List<Wallet>();
    }

    public enum UserRole
    {
        Admin = 1,
        Manager = 2,
        Client = 3,
        Contractor = 4
    }
}