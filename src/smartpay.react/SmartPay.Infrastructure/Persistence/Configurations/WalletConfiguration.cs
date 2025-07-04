using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPay.Domain.Entities;

namespace SmartPay.Infrastructure.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(w => w.Id);
        
        builder.Property(w => w.Currency)
            .IsRequired()
            .HasMaxLength(10);
            
        builder.Property(w => w.Address)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(w => w.Type)
            .HasConversion<string>();
            
        builder.OwnsOne(w => w.Balance, money =>
        {
            money.Property(m => m.Amount)
                .HasColumnName("Balance")
                .HasPrecision(18, 8);
                
            money.Property(m => m.Currency)
                .HasColumnName("BalanceCurrency")
                .HasMaxLength(3);
        });
        
        builder.HasMany(w => w.Transactions)
            .WithOne()
            .HasForeignKey(t => t.WalletId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(w => new { w.MerchantId, w.Currency })
            .IsUnique();
    }
}