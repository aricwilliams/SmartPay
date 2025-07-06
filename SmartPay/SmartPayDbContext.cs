using Microsoft.EntityFrameworkCore;
using SmartPay.Models;

public class SmartPayDbContext : DbContext
{
    public SmartPayDbContext(DbContextOptions<SmartPayDbContext> options)
        : base(options) { }

    public DbSet<Job> Jobs => Set<Job>();
   // public DbSet<JobLocation> JobLocations => Set<JobLocation>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Fluent rules here …
    }
}
