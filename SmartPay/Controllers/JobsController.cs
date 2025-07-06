using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartPay.Models;   // <-- where the Job entity lives
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

        // GET api/jobs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Job>>> GetJobs()
        {
            // Pull ONLY the table data (no includes).  
            // Add .Include(...) later if you add Locations / Milestones.
            var jobs = await _db.Jobs
                                .AsNoTracking()
                                .ToListAsync();

            return Ok(jobs);
        }
    }
}
