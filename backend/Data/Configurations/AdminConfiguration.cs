using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

public class AdminConfiguration : IEntityTypeConfiguration<Admin>
{
    public void Configure(EntityTypeBuilder<Admin> builder)
    {
        builder.ToTable("admin");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.Username).HasColumnName("username").HasMaxLength(50).IsRequired();
        builder.HasIndex(a => a.Username).IsUnique();

        builder.Property(a => a.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
        builder.Property(a => a.FullName).HasColumnName("full_name").HasMaxLength(100).IsRequired();
        builder.Property(a => a.Email).HasColumnName("email").HasMaxLength(100);
        builder.Property(a => a.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

        builder.Property(a => a.PasswordResetToken).HasColumnName("password_reset_token").HasMaxLength(255);
        builder.Property(a => a.ResetTokenExpires).HasColumnName("reset_token_expires");
    }
}