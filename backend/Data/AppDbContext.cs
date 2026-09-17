using System.Reflection;
using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace demo_dotnet.backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Parent> Parents => Set<Parent>();
    public DbSet<StudentParent> StudentParents => Set<StudentParent>();

    // Khai báo các DbSet mới cho phân quyền
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<AdminPermission> AdminPermissions => Set<AdminPermission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.Entity<Parent>(entity =>
        {
            entity.Property(p => p.CreatedAt)
                  .Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
        });

        // 1. Map tên bảng sang chữ thường theo đúng Schema PostgreSQL
        modelBuilder.Entity<Permission>().ToTable("permission");
        modelBuilder.Entity<Role>().ToTable("role");
        modelBuilder.Entity<RolePermission>().ToTable("role_permission");
        modelBuilder.Entity<AdminPermission>().ToTable("admin_permission");

        // 2. Map tên các cột khóa chính & ngoại sang kiểu snake_case (chữ thường có gạch dưới)
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.Property(p => p.Id).HasColumnName("id");
            entity.Property(p => p.Code).HasColumnName("code");
            entity.Property(p => p.Description).HasColumnName("description");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.Property(r => r.Id).HasColumnName("id");
            entity.Property(r => r.Name).HasColumnName("name");
            entity.Property(r => r.Description).HasColumnName("description");
        });

        // Composite Key & Map cột cho RolePermission
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });

            entity.Property(rp => rp.RoleId).HasColumnName("role_id");
            entity.Property(rp => rp.PermissionId).HasColumnName("permission_id");

            entity.HasOne(rp => rp.Role)
                  .WithMany(r => r.RolePermissions)
                  .HasForeignKey(rp => rp.RoleId);

            entity.HasOne(rp => rp.Permission)
                  .WithMany(p => p.RolePermissions)
                  .HasForeignKey(rp => rp.PermissionId);
        });

        // Composite Key & Map cột cho AdminPermission
        modelBuilder.Entity<AdminPermission>(entity =>
        {
            entity.HasKey(ap => new { ap.AdminId, ap.PermissionId });

            entity.Property(ap => ap.AdminId).HasColumnName("admin_id");
            entity.Property(ap => ap.PermissionId).HasColumnName("permission_id");

            entity.HasOne(ap => ap.Admin)
                  .WithMany(a => a.AdminPermissions)
                  .HasForeignKey(ap => ap.AdminId);

            entity.HasOne(ap => ap.Permission)
                  .WithMany(p => p.AdminPermissions)
                  .HasForeignKey(ap => ap.PermissionId);
        });
    }
}