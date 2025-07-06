using System.ComponentModel.DataAnnotations;

namespace SmartPay.Models
{
    public class Milestone
    {
        public Guid Id { get; set; }
        public Guid JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "pending";
        public DateTime? DueDate { get; set; }

        public Job Job { get; set; } = null!;
        public ICollection<PaymentCondition> Conditions { get; set; } = new List<PaymentCondition>();
        public ICollection<Evidence> Evidence { get; set; } = new List<Evidence>();

    }

    public class JobLocation
    {
        [Key] public Guid JobId { get; set; }
        public double Lat { get; set; }
        public double Lng { get; set; }
        public string? Address { get; set; }

        public Job Job { get; set; } = null!;
    }

}
