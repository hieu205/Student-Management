using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("student");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");

        builder.Property(s => s.Mhs).HasColumnName("mhs").HasMaxLength(20).IsRequired();
        builder.HasIndex(s => s.Mhs).IsUnique();

        builder.Property(s => s.FullName).HasColumnName("full_name").HasMaxLength(100).IsRequired();
        builder.Property(s => s.DateOfBirth).HasColumnName("date_of_birth");
        builder.Property(s => s.Gender).HasColumnName("gender").HasMaxLength(10);
        builder.Property(s => s.ClassName).HasColumnName("class_name").HasMaxLength(20);
        builder.Property(s => s.Address).HasColumnName("address").HasMaxLength(255);
        builder.Property(s => s.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

        builder.HasIndex(s => s.FullName).HasDatabaseName("idx_student_full_name");
        builder.HasIndex(s => s.ClassName).HasDatabaseName("idx_student_class_name");
    }
}