namespace SmartPay.Models
{
    public class Job
    {
        public Guid Id { get; set; }                 
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Client { get; set; }
        public string? Contractor { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "USD";
        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public JobLocation? Location { get; set; }          
        public ICollection<Milestone> Milestones { get; set; } = new List<Milestone>();  
    }
}
