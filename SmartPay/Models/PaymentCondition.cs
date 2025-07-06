using System.ComponentModel.DataAnnotations;

namespace SmartPay.Models
{
    public class PaymentCondition
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid MilestoneId { get; set; }

        [Required]
        public ConditionType Type { get; set; }

        [Required]
        public ConditionOperator Operator { get; set; }

        [Required]
        public string Value { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Milestone Milestone { get; set; } = null!;
    }
    public enum ConditionType
    {
        Time,
        Location,
        Approval,
        IoT,
        Custom
    }

    public enum ConditionOperator
    {
        Equals,
        GreaterThan,
        LessThan,
        Contains
    }
}
