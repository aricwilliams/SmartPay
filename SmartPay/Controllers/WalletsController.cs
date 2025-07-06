using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartPay.Models;
using SmartPay.Models.DTOS;

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
    }

    public record CreateWalletDto(Guid UserId, WalletType Type, string Currency);

}
