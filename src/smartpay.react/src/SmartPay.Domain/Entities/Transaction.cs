using SmartPay.Domain.Common;
using SmartPay.Domain.ValueObjects;

namespace SmartPay.Domain.Entities;

public class Transaction : BaseEntity
{
    public Guid WalletId { get; private set; }
    public Guid? JobId { get; private set; }
    public Money Amount { get; private set; } = null!;
    public TransactionType Type { get; private set; }
    public TransactionStatus Status { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string? ProcessorReference { get; private set; }
    public DateTime Timestamp { get; private set; }

    private Transaction() { } // EF Core

    public Transaction(Guid walletId, Money amount, TransactionType type, string description, string? processorRef = null, Guid? jobId = null)
    {
        WalletId = walletId;
        JobId = jobId;
        Amount = amount;
        Type = type;
        Status = TransactionStatus.Completed;
        Description = description;
        ProcessorReference = processorRef;
        Timestamp = DateTime.UtcNow;
    }

    public void SetJobId(Guid jobId)
    {
        JobId = jobId;
    }

    public void UpdateStatus(TransactionStatus status)
    {
        Status = status;
    }
}

public enum TransactionType
{
    Credit,
    Debit,
    Escrow,
    Release,
    Refund,
    Fee
}

public enum TransactionStatus
{
    Pending,
    Completed,
    Failed,
    Cancelled
}