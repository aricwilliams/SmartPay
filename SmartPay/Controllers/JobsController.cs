using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartPay.Models;
using SmartPay.Models.DTOS;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartPay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly SmartPayDbContext _db;

        public JobsController(SmartPayDbContext db) => _db = db;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetJobs()
        {
            var jobs = await _db.Jobs
                .Include(j => j.Milestones)
                .Select(j => new
                {
                    id = j.Id,
                    title = j.Title,
                    description = j.Description,
                    client = j.Client,
                    contractor = j.Contractor,
                    totalAmount = j.TotalAmount,
                    currency = j.Currency,
                    status = j.Status,
                    createdAt = j.CreatedAt,
                    updatedAt = j.UpdatedAt,
                    milestones = j.Milestones.Select(m => new {
                        id = m.Id,
                        title = m.Title,
                        description = m.Description,
                        amount = m.Amount,
                        status = m.Status,
                        dueDate = m.DueDate,
                        conditions = new List<object>()
                    })
                })
                .ToListAsync();

            return Ok(jobs);
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateJob([FromBody] JobCreateDto dto)
        {
            // 1️⃣ Map DTO → Entity
            var job = new Job
            {
                Title = dto.Title,
                Description = dto.Description,
                Client = dto.Client,
                Contractor = dto.Contractor,
                TotalAmount = dto.TotalAmount,
                Currency = dto.Currency,
                Status = "Pending",
                Milestones = dto.Milestones.Select(m => new Milestone
                {
                    Title = m.Title,
                    Description = m.Description,
                    Amount = m.Amount,
                    DueDate = m.DueDate,
                    Status = "Pending"
                }).ToList()
            };

            // 2️⃣ Persist
            _db.Jobs.Add(job);
            await _db.SaveChangesAsync();

            // 3️⃣ Return 201 with canonical payload
            var result = new
            {
                id = job.Id,
                title = job.Title,
                description = job.Description,
                client = job.Client,
                contractor = job.Contractor,
                totalAmount = job.TotalAmount,
                currency = job.Currency,
                status = job.Status,
                createdAt = job.CreatedAt,
                updatedAt = job.UpdatedAt,
                milestones = job.Milestones.Select(m => new {
                    id = m.Id,
                    title = m.Title,
                    description = m.Description,
                    amount = m.Amount,
                    status = m.Status,
                    dueDate = m.DueDate
                })
            };

            return CreatedAtAction(nameof(GetJobById), new { id = job.Id }, result);
        }

        // helper GET /api/jobs/{id} (for CreatedAtAction to resolve)
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<object>> GetJobById(Guid id)
        {
            Console.WriteLine($"GetJobById called with ID: {id}");
            var j = await _db.Jobs
                .Include(x => x.Milestones)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (j is null)
            {
                Console.WriteLine($"Job not found: {id}");
                return NotFound($"Job with ID {id} not found");
            }

            Console.WriteLine($"Job found: {j.Title} with {j.Milestones.Count} milestones");

            return Ok(new
            {
                id = j.Id,
                title = j.Title,
                description = j.Description,
                client = j.Client,
                contractor = j.Contractor,
                totalAmount = j.TotalAmount,
                currency = j.Currency,
                status = j.Status,
                createdAt = j.CreatedAt,
                updatedAt = j.UpdatedAt,
                milestones = j.Milestones.Select(m => new {
                    id = m.Id,
                    title = m.Title,
                    description = m.Description,
                    amount = m.Amount,
                    status = m.Status,
                    dueDate = m.DueDate
                })
            });
        }

        [HttpPatch("{jobId:guid}/milestones/{milestoneId:guid}/complete")]
        public async Task<ActionResult<object>> CompleteMilestone(Guid jobId, Guid milestoneId)
        {
            Console.WriteLine($"Completing milestone: JobId={jobId}, MilestoneId={milestoneId}");

            var job = await _db.Jobs
                .Include(j => j.Milestones)
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null) return NotFound("Job not found");

            var milestone = job.Milestones.FirstOrDefault(m => m.Id == milestoneId);
            if (milestone == null) return NotFound("Milestone not found");

            // Allow completion from any status
            var previousStatus = milestone.Status;

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Mark milestone as completed
                milestone.Status = "Completed";
                _db.Milestones.Update(milestone);

                // Check if all milestones are completed to update job status
                var allMilestonesCompleted = job.Milestones.All(m => m.Status == "Completed" || m.Status == "Released");
                if (allMilestonesCompleted)
                {
                    job.Status = "Completed";
                    _db.Jobs.Update(job);
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                Console.WriteLine($"Milestone {milestoneId} status changed: {previousStatus} -> Completed");

                return Ok(new
                {
                    milestoneId = milestone.Id,
                    previousStatus = previousStatus,
                    newStatus = milestone.Status,
                    jobStatus = job.Status,
                    message = $"Milestone status changed from {previousStatus} to Completed"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Error completing milestone: {ex.Message}");
                return StatusCode(500, "Failed to complete milestone");
            }
        }

        [HttpPost("{jobId:guid}/milestones/{milestoneId:guid}/release-payment")]
        public async Task<ActionResult<object>> ReleasePayment(Guid jobId, Guid milestoneId)
        {
            Console.WriteLine($"Releasing payment: JobId={jobId}, MilestoneId={milestoneId}");

            var job = await _db.Jobs
                .Include(j => j.Milestones)
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null) return NotFound("Job not found");

            var milestone = job.Milestones.FirstOrDefault(m => m.Id == milestoneId);
            if (milestone == null) return NotFound("Milestone not found");

            // Allow payment release from any status (auto-complete if needed)
            var previousStatus = milestone.Status;

            // If milestone is not completed, mark it as completed first
            if (milestone.Status != "Completed" && milestone.Status != "Released")
            {
                Console.WriteLine($"Auto-completing milestone {milestoneId} before payment release");
                milestone.Status = "Completed";
            }

            // Skip if already released
            if (milestone.Status == "Released")
            {
                return BadRequest("Payment has already been released for this milestone");
            }

            // Find contractor wallet (for demo, we'll use a default contractor user)
            var contractorUserId = Guid.Parse("6B69AEFB-D65C-447B-BE78-98C1FC4E5C0B"); // Demo contractor
            var contractorWallet = await _db.Wallets
                .FirstOrDefaultAsync(w => w.UserId == contractorUserId && w.Currency == job.Currency);

            if (contractorWallet == null)
            {
                // Create contractor wallet if it doesn't exist
                contractorWallet = new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = contractorUserId,
                    Balance = 0,
                    Currency = job.Currency,
                    Address = $"contractor_{Guid.NewGuid():N}".Substring(0, 12),
                    Type = WalletType.Fiat,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Wallets.Add(contractorWallet);
                await _db.SaveChangesAsync();
                Console.WriteLine($"Created contractor wallet: {contractorWallet.Id}");
            }

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Update milestone status to Released
                milestone.Status = "Released";
                _db.Milestones.Update(milestone);

                // Credit contractor wallet
                var originalBalance = contractorWallet.Balance;
                contractorWallet.Balance += milestone.Amount;
                _db.Wallets.Update(contractorWallet);

                // Create transaction record
                var paymentTransaction = new Transaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = contractorWallet.Id,
                    JobId = jobId,
                    Amount = milestone.Amount,
                    Currency = job.Currency,
                    Type = TxType.Release,
                    Status = TxStatus.Completed,
                    Description = $"Payment for milestone: {milestone.Title}",
                    TimeStamp = DateTime.UtcNow,
                    ProcessorRef = $"release_{Guid.NewGuid():N}".Substring(0, 12)
                };

                _db.Transactions.Add(paymentTransaction);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                Console.WriteLine($"Payment released: ${milestone.Amount} to wallet {contractorWallet.Id}. Status: {previousStatus} -> Released");
                Console.WriteLine($"Wallet balance: {originalBalance} -> {contractorWallet.Balance}");

                return Ok(new
                {
                    milestoneId = milestone.Id,
                    previousStatus = previousStatus,
                    amount = milestone.Amount,
                    currency = job.Currency,
                    walletId = contractorWallet.Id,
                    transactionId = paymentTransaction.Id,
                    newWalletBalance = contractorWallet.Balance,
                    jobStatus = job.Status,
                    message = $"Payment released successfully. Milestone status: {previousStatus} -> Released"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Error releasing payment: {ex.Message}");
                return StatusCode(500, "Failed to release payment");
            }
        }

    }
}
