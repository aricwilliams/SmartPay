using Microsoft.EntityFrameworkCore;
using SmartPay.Models;
using SmartPay.Models.Security;
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
    public DbSet<User> Users => Set<User>();
    public DbSet<SecurityEvent> SecurityEvents => Set<SecurityEvent>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<TwoFactorAuth> TwoFactorAuth => Set<TwoFactorAuth>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();
    public DbSet<ApiRateLimit> ApiRateLimits => Set<ApiRateLimit>();

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

        // Security entity configurations
        b.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        b.Entity<SecurityEvent>()
            .HasIndex(s => new { s.UserId, s.Timestamp });

        b.Entity<SecurityEvent>()
            .HasIndex(s => new { s.IpAddress, s.Timestamp });

        b.Entity<UserSession>()
            .HasIndex(s => s.SessionToken)
            .IsUnique();

        b.Entity<UserSession>()
            .HasIndex(s => new { s.UserId, s.IsActive });

        b.Entity<TwoFactorAuth>()
            .HasIndex(tf => tf.UserId)
            .IsUnique();

        b.Entity<LoginAttempt>()
            .HasIndex(la => new { la.Email, la.AttemptedAt });

        b.Entity<ApiRateLimit>()
            .HasIndex(rl => new { rl.Identifier, rl.Endpoint });
    }
}
