namespace SmartPay.Models.DTOS
{
    public class WalletDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public decimal Balance { get; set; }
        public string Currency { get; set; } = "USD";
        public string? Address { get; set; }
        public WalletType Type { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<TransactionDto> Transactions { get; set; } = new();
    }


    public class TransactionDto
    {
        public Guid Id { get; set; }
        public Guid? JobId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public TxType Type { get; set; }
        public TxStatus Status { get; set; }
        public string? Description { get; set; }
        public DateTime TimeStamp { get; set; }
        public string? ProcessorRef { get; set; }
    }
}
