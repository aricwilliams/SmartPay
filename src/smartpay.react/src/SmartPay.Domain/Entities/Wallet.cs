using SmartPay.Domain.Common;
using SmartPay.Domain.Events;
using SmartPay.Domain.ValueObjects;

namespace SmartPay.Domain.Entities;

public class Wallet : BaseAuditableEntity
{
    public Guid MerchantId { get; private set; }
    public Money Balance { get; private set; } = null!;
    public string Currency { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public WalletType Type { get; private set; }
    public bool IsActive { get; private set; }
    
    private readonly List<Transaction> _transactions = new();
    public IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();

    private Wallet() { } // EF Core

    public Wallet(Guid merchantId, string currency, WalletType type)
    {
        MerchantId = merchantId;
        Currency = currency;
        Type = type;
        Balance = new Money(0, currency);
        Address = GenerateAddress(type, currency);
        IsActive = true;
        
        AddDomainEvent(new WalletCreatedEvent(this));
    }

    public void Credit(Money amount, string description, string? processorRef = null)
    {
        if (amount.Currency != Currency)
            throw new InvalidOperationException("Currency mismatch");
            
        Balance = Balance.Add(amount);
        
        var transaction = new Transaction(
            Id, 
            amount, 
            TransactionType.Credit, 
            description, 
            processorRef);
            
        _transactions.Add(transaction);
        
        AddDomainEvent(new WalletBalanceChangedEvent(Id, Balance));
    }

    public void Debit(Money amount, string description, string? processorRef = null)
    {
        if (amount.Currency != Currency)
            throw new InvalidOperationException("Currency mismatch");
            
        if (Balance.Amount < amount.Amount)
            throw new InvalidOperationException("Insufficient balance");
            
        Balance = Balance.Subtract(amount);
        
        var transaction = new Transaction(
            Id, 
            amount, 
            TransactionType.Debit, 
            description, 
            processorRef);
            
        _transactions.Add(transaction);
        
        AddDomainEvent(new WalletBalanceChangedEvent(Id, Balance));
    }

    private static string GenerateAddress(WalletType type, string currency)
    {
        return type switch
        {
            WalletType.Fiat => $"fiat-{Guid.NewGuid():N}",
            WalletType.Crypto => $"0x{Guid.NewGuid():N}",
            _ => throw new ArgumentException($"Unknown wallet type: {type}")
        };
    }
}

public enum WalletType
{
    Fiat,
    Crypto
}