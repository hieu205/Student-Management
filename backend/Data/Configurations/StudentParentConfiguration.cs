using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

public class StudentParentConfiguration : IEntityTypeConfiguration<StudentParent>
{
    public void Configure(EntityTypeBuilder<StudentParent> builder)
    {
        builder.ToTable("student_parent");

        // Composite Key
        builder.HasKey(sp => new { sp.StudentId, sp.ParentId });

        builder.Property(sp => sp.StudentId).HasColumnName("student_id");
        builder.Property(sp => sp.ParentId).HasColumnName("parent_id");
        builder.Property(sp => sp.RelationshipType).HasColumnName("relationship_type").HasMaxLength(20).IsRequired();

        builder.HasOne(sp => sp.Student)
            .WithMany(s => s.StudentParents)
            .HasForeignKey(sp => sp.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sp => sp.Parent)
            .WithMany(p => p.StudentParents)
            .HasForeignKey(sp => sp.ParentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(sp => sp.ParentId).HasDatabaseName("idx_student_parent_parent_id");
    }
}