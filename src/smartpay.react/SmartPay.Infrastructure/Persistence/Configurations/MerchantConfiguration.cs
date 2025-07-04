using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPay.Domain.Entities;

namespace SmartPay.Infrastructure.Persistence.Configurations;

public class MerchantConfiguration : IEntityTypeConfiguration<Merchant>
{
    public void Configure(EntityTypeBuilder<Merchant> builder)
    {
        builder.HasKey(m => m.Id);
        
        builder.Property(m => m.Name)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(m => m.Email)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(m => m.BusinessType)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(m => m.KycStatus)
            .HasConversion<string>();
            
        builder.HasIndex(m => m.Email)
            .IsUnique();
            
        builder.HasMany(m => m.Wallets)
            .WithOne()
            .HasForeignKey(w => w.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}