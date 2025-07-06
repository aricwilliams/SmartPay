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
            var j = await _db.Jobs
                .Include(x => x.Milestones)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (j is null) return NotFound();

            return Ok(new
            {
                id = j.Id,
                title = j.Title,
                // … mirror the shape above …
            });
        }


    }
}
