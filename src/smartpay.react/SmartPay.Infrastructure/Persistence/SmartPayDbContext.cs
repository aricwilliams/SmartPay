using Microsoft.EntityFrameworkCore;
using SmartPay.Domain.Entities;
using SmartPay.Infrastructure.Persistence.Configurations;

namespace SmartPay.Infrastructure.Persistence;

public class SmartPayDbContext : DbContext
{
    public SmartPayDbContext(DbContextOptions<SmartPayDbContext> options) : base(options)
    {
    }

    public DbSet<Merchant> Merchants { get; set; } = null!;
    public DbSet<Job> Jobs { get; set; } = null!;
    public DbSet<Milestone> Milestones { get; set; } = null!;
    public DbSet<Wallet> Wallets { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<Evidence> Evidence { get; set; } = null!;
    public DbSet<PaymentCondition> PaymentConditions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new MerchantConfiguration());
        modelBuilder.ApplyConfiguration(new JobConfiguration());
        modelBuilder.ApplyConfiguration(new MilestoneConfiguration());
        modelBuilder.ApplyConfiguration(new WalletConfiguration());
        modelBuilder.ApplyConfiguration(new TransactionConfiguration());
        modelBuilder.ApplyConfiguration(new EvidenceConfiguration());
        modelBuilder.ApplyConfiguration(new PaymentConditionConfiguration());
    }
}