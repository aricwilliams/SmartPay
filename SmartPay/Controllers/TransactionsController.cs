using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartPay.Models;

namespace SmartPay.Controllers
{
    [ApiController]
    [Route("api/wallets/{walletId:guid}/transactions")]
    public class TransactionsController : ControllerBase
    {
        private readonly SmartPayDbContext _db;
        public TransactionsController(SmartPayDbContext db) => _db = db;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Transaction>>> Get(Guid walletId)
        {
            var tx = await _db.Transactions
                .Where(t => t.WalletId == walletId)
                .AsNoTracking()
                .ToListAsync();
            return Ok(tx);
        }

        [HttpPost]
        public async Task<ActionResult<Transaction>> Create(Guid walletId, [FromBody] CreateTxDto dto)
        {
            var tx = new Transaction
            {
                Id = Guid.NewGuid(),
                WalletId = walletId,
                JobId = dto.JobId,
                Amount = dto.Amount,
                Currency = dto.Currency,
                Type = dto.Type,
                Status = TxStatus.Pending,
                Description = dto.Description,
                TimeStamp = DateTime.UtcNow,
                ProcessorRef = dto.ProcessorRef
            };
            _db.Transactions.Add(tx);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { walletId }, tx);
        }
    }

    public record CreateTxDto(
        Guid? JobId,
        decimal Amount,
        string Currency,
        TxType Type,
        string? Description,
        string? ProcessorRef);

}
