using SmartPay.Domain.Common;
using SmartPay.Domain.ValueObjects;

namespace SmartPay.Domain.Entities;

public class Merchant : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string BusinessType { get; private set; } = string.Empty;
    public KycStatus KycStatus { get; private set; }
    public bool IsActive { get; private set; }
    
    private readonly List<Wallet> _wallets = new();
    public IReadOnlyCollection<Wallet> Wallets => _wallets.AsReadOnly();
    
    private readonly List<Job> _jobs = new();
    public IReadOnlyCollection<Job> Jobs => _jobs.AsReadOnly();

    private Merchant() { } // EF Core

    public Merchant(string name, string email, string businessType)
    {
        Name = name;
        Email = email;
        BusinessType = businessType;
        KycStatus = KycStatus.Pending;
        IsActive = true;
    }

    public void UpdateKycStatus(KycStatus status)
    {
        KycStatus = status;
    }

    public void AddWallet(Wallet wallet)
    {
        _wallets.Add(wallet);
    }

    public Wallet GetWallet(string currency)
    {
        return _wallets.FirstOrDefault(w => w.Currency == currency) 
               ?? throw new InvalidOperationException($"No wallet found for currency {currency}");
    }
}

public enum KycStatus
{
    Pending,
    Approved,
    Rejected,
    RequiresReview
}