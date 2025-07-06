namespace SmartPay.Models
{
    // Wallet.cs
    public class Wallet
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public decimal Balance { get; set; }
        public string Currency { get; set; } = "USD";
        public string? Address { get; set; }
        public WalletType Type { get; set; } = WalletType.Fiat;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }

    public enum WalletType { Fiat, Crypto }

    public class Transaction
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public Guid? JobId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public TxType Type { get; set; }
        public TxStatus Status { get; set; }
        public string? Description { get; set; }
        public DateTime TimeStamp { get; set; }
        public string? ProcessorRef { get; set; }

        public Wallet Wallet { get; set; } = null!;
    }

    public enum TxType { Escrow, Release, Deposit, Withdrawal, Refund }
    public enum TxStatus { Pending, Completed, Failed }

}
