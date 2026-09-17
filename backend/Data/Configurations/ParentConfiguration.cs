using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

public class ParentConfiguration : IEntityTypeConfiguration<Parent>
{
    public void Configure(EntityTypeBuilder<Parent> builder)
    {
        builder.ToTable("parent");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.FullName).HasColumnName("full_name").HasMaxLength(100).IsRequired();

        builder.Property(p => p.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20).IsRequired();
        builder.HasIndex(p => p.PhoneNumber).IsUnique();

        builder.Property(p => p.Email).HasColumnName("email").HasMaxLength(100);
        builder.Property(p => p.Occupation).HasColumnName("occupation").HasMaxLength(100);
        builder.Property(p => p.Address).HasColumnName("address").HasMaxLength(255);
        builder.Property(p => p.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

        builder.HasIndex(p => p.FullName).HasDatabaseName("idx_parent_full_name");
    }
}