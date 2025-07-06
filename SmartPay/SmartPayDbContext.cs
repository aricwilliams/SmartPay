using Microsoft.EntityFrameworkCore;
using SmartPay.Models;
using System.Reflection.Emit;

public class SmartPayDbContext : DbContext
{
    public SmartPayDbContext(DbContextOptions<SmartPayDbContext> options)
        : base(options) { }

    public DbSet<Job> Jobs => Set<Job>();
    // public DbSet<JobLocation> JobLocations => Set<JobLocation>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<JobLocation> JobLocations => Set<JobLocation>();
    public DbSet<PaymentCondition> PaymentConditions => Set<PaymentCondition>();
    public DbSet<Evidence> Evidence => Set<Evidence>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Job>()
            .HasOne(j => j.Location)
            .WithOne(l => l.Job)
            .HasForeignKey<JobLocation>(l => l.JobId);

        b.Entity<Job>()
            .HasMany(j => j.Milestones)
            .WithOne(m => m.Job)
            .HasForeignKey(m => m.JobId);

       

        b.Entity<Milestone>()
            .HasMany(m => m.Conditions)
            .WithOne(c => c.Milestone)
            .HasForeignKey(c => c.MilestoneId);

        b.Entity<Milestone>()
            .HasMany(m => m.Evidence)
            .WithOne(e => e.Milestone)
            .HasForeignKey(e => e.MilestoneId);
        b.Entity<Wallet>()
        .HasMany(w => w.Transactions)
        .WithOne(t => t.Wallet)
        .HasForeignKey(t => t.WalletId);


        // 🎯 Explicit enum-to-int conversion for WalletType
        b.Entity<Wallet>()
            .Property(w => w.Type)
            .HasConversion<int>();

        // 🎯 Optional: Transaction enum conversions too
        b.Entity<Transaction>()
            .Property(t => t.Type)
        .HasConversion<int>();

        b.Entity<Transaction>()
            .Property(t => t.Status)
            .HasConversion<int>();
    }
}
