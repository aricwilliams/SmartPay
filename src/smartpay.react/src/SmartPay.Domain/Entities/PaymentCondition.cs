using SmartPay.Domain.Common;

namespace SmartPay.Domain.Entities;

public class PaymentCondition : BaseEntity
{
    public ConditionType Type { get; private set; }
    public string Operator { get; private set; } = string.Empty;
    public string Value { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public bool IsMet { get; private set; }

    private PaymentCondition() { } // EF Core

    public PaymentCondition(ConditionType type, string @operator, string value, string description)
    {
        Type = type;
        Operator = @operator;
        Value = value;
        Description = description;
        IsMet = false;
    }

    public bool IsSatisfied()
    {
        return IsMet;
    }

    public void MarkAsSatisfied()
    {
        IsMet = true;
    }

    public bool Evaluate(object actualValue)
    {
        return Type switch
        {
            ConditionType.Time => EvaluateTimeCondition(actualValue),
            ConditionType.Location => EvaluateLocationCondition(actualValue),
            ConditionType.Approval => EvaluateApprovalCondition(actualValue),
            ConditionType.IoT => EvaluateIoTCondition(actualValue),
            ConditionType.Custom => EvaluateCustomCondition(actualValue),
            _ => false
        };
    }

    private bool EvaluateTimeCondition(object actualValue)
    {
        if (actualValue is not DateTime dateTime || !DateTime.TryParse(Value, out var targetDate))
            return false;

        return Operator switch
        {
            "equals" => dateTime.Date == targetDate.Date,
            "greater_than" => dateTime > targetDate,
            "less_than" => dateTime < targetDate,
            _ => false
        };
    }

    private bool EvaluateLocationCondition(object actualValue)
    {
        // Implementation for GPS/location-based conditions
        return false; // Placeholder
    }

    private bool EvaluateApprovalCondition(object actualValue)
    {
        return actualValue is bool approved && approved;
    }

    private bool EvaluateIoTCondition(object actualValue)
    {
        // Implementation for IoT device signals
        return false; // Placeholder
    }

    private bool EvaluateCustomCondition(object actualValue)
    {
        // Implementation for custom business rules
        return false; // Placeholder
    }
}

public enum ConditionType
{
    Time,
    Location,
    Approval,
    IoT,
    Custom
}