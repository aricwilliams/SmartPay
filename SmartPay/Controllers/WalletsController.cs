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
            Console.WriteLine($"GetWallet called for ID: {walletId}");
            var wallet = await _db.Wallets
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.Id == walletId);

            if (wallet == null)
            {
                Console.WriteLine($"Wallet not found: {walletId}");
                return NotFound();
            }

            Console.WriteLine($"Wallet found: Balance={wallet.Balance}, Transactions={wallet.Transactions.Count}");

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

            Console.WriteLine($"Returning wallet with {result.Transactions.Count} transactions");
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
            Console.WriteLine($"SendFunds called: WalletId={walletId}, Amount={dto.Amount}, ToAddress={dto.ToAddress}");

            var sourceWallet = await _db.Wallets.FindAsync(walletId);
            if (sourceWallet == null) return NotFound("Source wallet not found");

            Console.WriteLine($"Source wallet found: Balance={sourceWallet.Balance}, Currency={sourceWallet.Currency}");

            if (sourceWallet.Balance < dto.Amount)
                return BadRequest("Insufficient balance");

            // For demo purposes, let's create a destination wallet if it doesn't exist
            var destinationWallet = await _db.Wallets
                .FirstOrDefaultAsync(w => w.Address == dto.ToAddress && w.Currency == dto.Currency);

            if (destinationWallet == null)
            {
                Console.WriteLine("Destination wallet not found, creating demo wallet");
                // Create a demo destination wallet for testing
                destinationWallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(), // Demo user
                    Balance = 0,
                    Currency = dto.Currency,
                    Address = dto.ToAddress,
                    Type = WalletType.Fiat,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Wallets.Add(destinationWallet);
                await _db.SaveChangesAsync();
                Console.WriteLine($"Created destination wallet: {destinationWallet.Id}");
            }

            Console.WriteLine($"Destination wallet: Balance={destinationWallet.Balance}");
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Debit source wallet
                var originalSourceBalance = sourceWallet.Balance;
                sourceWallet.Balance -= dto.Amount;
                _db.Wallets.Update(sourceWallet);
                Console.WriteLine($"Source wallet balance: {originalSourceBalance} -> {sourceWallet.Balance}");

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
                var originalDestBalance = destinationWallet.Balance;
                destinationWallet.Balance += dto.Amount;
                _db.Wallets.Update(destinationWallet);
                Console.WriteLine($"Dest wallet balance: {originalDestBalance} -> {destinationWallet.Balance}");

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

                Console.WriteLine("Transaction committed successfully");

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
                Console.WriteLine("Transaction failed, rolling back");
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
            _db.Wallets.Update(wallet);

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
