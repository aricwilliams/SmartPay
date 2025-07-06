using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartPay.Models;  
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


    }
}
