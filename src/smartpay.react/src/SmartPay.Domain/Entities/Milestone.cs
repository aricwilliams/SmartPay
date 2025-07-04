using SmartPay.Domain.Common;
using SmartPay.Domain.Events;
using SmartPay.Domain.ValueObjects;

namespace SmartPay.Domain.Entities;

public class Milestone : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Money Amount { get; private set; } = null!;
    public DateTime DueDate { get; private set; }
    public MilestoneStatus Status { get; private set; }
    
    private readonly List<Evidence> _evidence = new();
    public IReadOnlyCollection<Evidence> Evidence => _evidence.AsReadOnly();
    
    private readonly List<PaymentCondition> _conditions = new();
    public IReadOnlyCollection<PaymentCondition> Conditions => _conditions.AsReadOnly();

    private Milestone() { } // EF Core

    public Milestone(string title, string description, Money amount, DateTime dueDate)
    {
        Title = title;
        Description = description;
        Amount = amount;
        DueDate = dueDate;
        Status = MilestoneStatus.Pending;
    }

    public void AddEvidence(EvidenceType type, string data, string description)
    {
        var evidence = new Evidence(type, data, description);
        _evidence.Add(evidence);
        
        AddDomainEvent(new EvidenceAddedEvent(Id, evidence));
    }

    public void AddCondition(PaymentCondition condition)
    {
        _conditions.Add(condition);
    }

    public void StartProgress()
    {
        if (Status != MilestoneStatus.Pending)
            throw new InvalidOperationException("Milestone can only be started from pending status");
            
        Status = MilestoneStatus.InProgress;
        AddDomainEvent(new MilestoneStatusChangedEvent(Id, MilestoneStatus.InProgress));
    }

    public void Complete()
    {
        if (Status != MilestoneStatus.InProgress)
            throw new InvalidOperationException("Milestone can only be completed from in-progress status");
            
        Status = MilestoneStatus.Completed;
        AddDomainEvent(new MilestoneCompletedEvent(this));
    }

    public void Release()
    {
        if (Status != MilestoneStatus.Completed)
            throw new InvalidOperationException("Payment can only be released for completed milestones");
            
        Status = MilestoneStatus.Released;
        AddDomainEvent(new PaymentReleasedEvent(this));
    }

    public bool AreConditionsSatisfied()
    {
        return _conditions.All(c => c.IsSatisfied());
    }
}

public enum MilestoneStatus
{
    Pending,
    InProgress,
    Completed,
    Released,
    Disputed
}