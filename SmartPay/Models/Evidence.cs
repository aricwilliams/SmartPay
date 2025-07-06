using System.ComponentModel.DataAnnotations;

namespace SmartPay.Models
{
    public class Evidence
    {

        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid MilestoneId { get; set; }

        [Required]
        public EvidenceType Type { get; set; }

        [Required]
        public string Url { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime Timestamp { get; set; }

        public Milestone Milestone { get; set; } = null!;
    }

    public enum EvidenceType
    {
        Photo,
        Document,
        Gps,
        Signature
    }
}
