using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartPay.Models;
using SmartPay.Models.DTOS;
using Microsoft.AspNetCore.Authorization;

namespace SmartPay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WalletsController : ControllerBase
    {
        private readonly SmartPayDbContext _db;
        public WalletsController(SmartPayDbContext db) => _db = db;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WalletDto>>> GetWallets(Guid userId)
        {
            var wallets = await _db.Wallets
                .Where(w => w.UserId == userId)
                .Include(w => w.Transactions)
                .AsNoTracking()
                .ToListAsync();

            var result = wallets.Select(w => new WalletDto
            {
                Id = w.Id,
                UserId = w.UserId,
                Balance = w.Balance,
                Currency = w.Currency,
                Address = w.Address,
                Type = w.Type,
                CreatedAt = w.CreatedAt,
                Transactions = w.Transactions.Select(t => new TransactionDto
                {
                    Id = t.Id,
                    JobId = t.JobId,
                    Amount = t.Amount,
                    Currency = t.Currency,
                    Type = t.Type,
                    Status = t.Status,
                    Description = t.Description,
                    TimeStamp = t.TimeStamp,
                    ProcessorRef = t.ProcessorRef
                }).ToList()
            });

            return Ok(result);
        }

        [HttpGet("{walletId:guid}")]
        public async Task<ActionResult<WalletDto>> GetWallet(Guid walletId)
        {
            var wallet = await _db.Wallets
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.Id == walletId);

            if (wallet == null) return NotFound();

            var result = new WalletDto
            {
                Id = wallet.Id,
                UserId = wallet.UserId,
                Balance = wallet.Balance,
                Currency = wallet.Currency,
                Address = wallet.Address,
                Type = wallet.Type,
                CreatedAt = wallet.CreatedAt,
                Transactions = wallet.Transactions.Select(t => new TransactionDto
                {
                    Id = t.Id,
                    JobId = t.JobId,
                    Amount = t.Amount,
                    Currency = t.Currency,
                    Type = t.Type,
                    Status = t.Status,
                    Description = t.Description,
                    TimeStamp = t.TimeStamp,
                    ProcessorRef = t.ProcessorRef
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Wallet>> CreateWallet([FromBody] CreateWalletDto dto)
        {
            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                Balance = 0,
                Currency = dto.Currency,
                Address = dto.Type == WalletType.Crypto
                    ? $"0x{Guid.NewGuid():N}".Substring(0, 16)
                    : $"bank_{Guid.NewGuid():N}".Substring(0, 12),
                Type = dto.Type,
                CreatedAt = DateTime.UtcNow
            };

            _db.Wallets.Add(wallet);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWallets), new { userId = wallet.UserId }, wallet);
        }

        [HttpPost("{walletId:guid}/send")]
        public async Task<ActionResult<TransactionDto>> SendFunds(Guid walletId, [FromBody] SendFundsDto dto)
        {
            var sourceWallet = await _db.Wallets.FindAsync(walletId);
            if (sourceWallet == null) return NotFound("Source wallet not found");

            if (sourceWallet.Balance < dto.Amount)
                return BadRequest("Insufficient balance");

            var destinationWallet = await _db.Wallets
                .FirstOrDefaultAsync(w => w.Address == dto.ToAddress && w.Currency == dto.Currency);
            
            if (destinationWallet == null)
                return BadRequest("Destination wallet not found");

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Debit source wallet
                sourceWallet.Balance -= dto.Amount;
                var debitTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = dto.Amount,
                    Currency = dto.Currency,
                    Type = TxType.Withdrawal,
                    Status = TxStatus.Completed,
                    Description = $"Sent to {dto.ToAddress}",
                    TimeStamp = DateTime.UtcNow,
                    ProcessorRef = $"send_{Guid.NewGuid():N}".Substring(0, 12)
                };

                // Credit destination wallet
                destinationWallet.Balance += dto.Amount;
                var creditTx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = destinationWallet.Id,
                    Amount = dto.Amount,
                    Currency = dto.Currency,
                    Type = TxType.Deposit,
                    Status = TxStatus.Completed,
                    Description = $"Received from {sourceWallet.Address}",
                    TimeStamp = DateTime.UtcNow,
                    ProcessorRef = debitTx.ProcessorRef
                };

                _db.Transactions.AddRange(debitTx, creditTx);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                var result = new TransactionDto
                {
                    Id = debitTx.Id,
                    Amount = debitTx.Amount,
                    Currency = debitTx.Currency,
                    Type = debitTx.Type,
                    Status = debitTx.Status,
                    Description = debitTx.Description,
                    TimeStamp = debitTx.TimeStamp,
                    ProcessorRef = debitTx.ProcessorRef
                };

                return Ok(result);
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Transaction failed");
            }
        }

        [HttpPost("{walletId:guid}/receive")]
        public async Task<ActionResult<TransactionDto>> ReceiveFunds(Guid walletId, [FromBody] ReceiveFundsDto dto)
        {
            var wallet = await _db.Wallets.FindAsync(walletId);
            if (wallet == null) return NotFound("Wallet not found");

            // Simulate receiving funds (in real app, this would be triggered by payment processor webhook)
            wallet.Balance += dto.Amount;
            
            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                WalletId = walletId,
                Amount = dto.Amount,
                Currency = dto.Currency,
                Type = TxType.Deposit,
                Status = TxStatus.Completed,
                Description = dto.Description ?? "Received funds",
                TimeStamp = DateTime.UtcNow,
                ProcessorRef = dto.ProcessorRef ?? $"recv_{Guid.NewGuid():N}".Substring(0, 12)
            };

            _db.Transactions.Add(transaction);
            await _db.SaveChangesAsync();

            var result = new TransactionDto
            {
                Id = transaction.Id,
                Amount = transaction.Amount,
                Currency = transaction.Currency,
                Type = transaction.Type,
                Status = transaction.Status,
                Description = transaction.Description,
                TimeStamp = transaction.TimeStamp,
                ProcessorRef = transaction.ProcessorRef
            };

            return Ok(result);
        }
    }

    public record CreateWalletDto(Guid UserId, WalletType Type, string Currency);
    public record SendFundsDto(decimal Amount, string Currency, string ToAddress);
    public record ReceiveFundsDto(decimal Amount, string Currency, string? Description = null, string? ProcessorRef = null);

}
