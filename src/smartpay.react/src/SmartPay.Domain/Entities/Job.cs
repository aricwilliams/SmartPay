using SmartPay.Domain.Common;
using SmartPay.Domain.Events;
using SmartPay.Domain.ValueObjects;

namespace SmartPay.Domain.Entities;

public class Job : BaseAuditableEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Guid ClientId { get; private set; }
    public Guid ContractorId { get; private set; }
    public Money TotalAmount { get; private set; } = null!;
    public JobStatus Status { get; private set; }
    public Location? Location { get; private set; }
    
    private readonly List<Milestone> _milestones = new();
    public IReadOnlyCollection<Milestone> Milestones => _milestones.AsReadOnly();

    private Job() { } // EF Core

    public Job(string title, string description, Guid clientId, Guid contractorId, Money totalAmount)
    {
        Title = title;
        Description = description;
        ClientId = clientId;
        ContractorId = contractorId;
        TotalAmount = totalAmount;
        Status = JobStatus.Pending;
        
        AddDomainEvent(new JobCreatedEvent(this));
    }

    public void AddMilestone(string title, string description, Money amount, DateTime dueDate)
    {
        var milestone = new Milestone(title, description, amount, dueDate);
        _milestones.Add(milestone);
    }

    public void SetLocation(double latitude, double longitude, string address)
    {
        Location = new Location(latitude, longitude, address);
    }

    public void StartJob()
    {
        if (Status != JobStatus.Pending)
            throw new InvalidOperationException("Job can only be started from pending status");
            
        Status = JobStatus.Active;
        AddDomainEvent(new JobStatusChangedEvent(Id, JobStatus.Active));
    }

    public void CompleteJob()
    {
        if (!_milestones.All(m => m.Status == MilestoneStatus.Completed))
            throw new InvalidOperationException("All milestones must be completed before job completion");
            
        Status = JobStatus.Completed;
        AddDomainEvent(new JobCompletedEvent(this));
    }

    public Milestone GetMilestone(Guid milestoneId)
    {
        return _milestones.FirstOrDefault(m => m.Id == milestoneId)
               ?? throw new InvalidOperationException($"Milestone {milestoneId} not found");
    }
}

public enum JobStatus
{
    Pending,
    Active,
    Completed,
    Disputed,
    Cancelled
}