using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPay.Domain.Entities;

namespace SmartPay.Infrastructure.Persistence.Configurations;

public class JobConfiguration : IEntityTypeConfiguration<Job>
{
    public void Configure(EntityTypeBuilder<Job> builder)
    {
        builder.HasKey(j => j.Id);
        
        builder.Property(j => j.Title)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(j => j.Description)
            .IsRequired()
            .HasMaxLength(2000);
            
        builder.Property(j => j.Status)
            .HasConversion<string>();
            
        builder.OwnsOne(j => j.TotalAmount, money =>
        {
            money.Property(m => m.Amount)
                .HasColumnName("TotalAmount")
                .HasPrecision(18, 2);
                
            money.Property(m => m.Currency)
                .HasColumnName("Currency")
                .HasMaxLength(3);
        });
        
        builder.OwnsOne(j => j.Location, location =>
        {
            location.Property(l => l.Latitude)
                .HasColumnName("Latitude");
                
            location.Property(l => l.Longitude)
                .HasColumnName("Longitude");
                
            location.Property(l => l.Address)
                .HasColumnName("Address")
                .HasMaxLength(500);
        });
        
        builder.HasMany(j => j.Milestones)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);
    }
}