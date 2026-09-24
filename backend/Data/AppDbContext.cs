using System.Reflection;
using backend.Models;
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

      // Khai báo các DbSet cho phân quyền
      public DbSet<Permission> Permissions => Set<Permission>();
      public DbSet<Role> Roles => Set<Role>();
      public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
      public DbSet<AdminPermission> AdminPermissions => Set<AdminPermission>();

      // Khai báo các DbSet cho tính năng Chat
      public DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
      public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
      public DbSet<ChatAttachment> ChatAttachments => Set<ChatAttachment>();

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
            modelBuilder.Entity<ChatRoom>().ToTable("chat_room");
            modelBuilder.Entity<ChatMessage>().ToTable("chat_message");

            // 2. Map tên các cột khóa chính & ngoại sang kiểu snake_case
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

            // Cấu hình Bảng ChatRoom
            modelBuilder.Entity<ChatRoom>(entity =>
            {
                  entity.Property(cr => cr.Id).HasColumnName("id");
                  entity.Property(cr => cr.Admin1Id).HasColumnName("admin1_id");
                  entity.Property(cr => cr.Admin2Id).HasColumnName("admin2_id");
                  entity.Property(cr => cr.CreatedAt).HasColumnName("created_at");
                  entity.Property(cr => cr.UpdatedAt).HasColumnName("updated_at");

                  // Đảm bảo chỉ tồn tại 1 phòng chat giữa cặp 2 Admin
                  entity.HasIndex(cr => new { cr.Admin1Id, cr.Admin2Id }).IsUnique();

                  entity.HasOne(cr => cr.Admin1)
                    .WithMany()
                    .HasForeignKey(cr => cr.Admin1Id)
                    .OnDelete(DeleteBehavior.Restrict);

                  entity.HasOne(cr => cr.Admin2)
                    .WithMany()
                    .HasForeignKey(cr => cr.Admin2Id)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Cấu hình Bảng ChatMessage
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                  entity.Property(cm => cm.Id).HasColumnName("id");
                  entity.Property(cm => cm.RoomId).HasColumnName("room_id");
                  entity.Property(cm => cm.SenderId).HasColumnName("sender_id");
                  entity.Property(cm => cm.ReceiverId).HasColumnName("receiver_id");
                  entity.Property(cm => cm.Content).HasColumnName("content");
                  entity.Property(cm => cm.ClientMessageId).HasColumnName("client_message_id");
                  entity.HasIndex(cm => new { cm.SenderId, cm.ClientMessageId }).IsUnique()
                        .HasFilter("client_message_id IS NOT NULL");
                  entity.Property(cm => cm.IsRead).HasColumnName("is_read");
                  entity.Property(cm => cm.IsDeleted).HasColumnName("is_deleted");
                  entity.Property(cm => cm.DeletedAt).HasColumnName("deleted_at");
                  entity.Property(cm => cm.CreatedAt).HasColumnName("created_at");

                  entity.HasOne(cm => cm.Room)
                    .WithMany(r => r.Messages)
                    .HasForeignKey(cm => cm.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                  entity.HasOne(cm => cm.Sender)
                    .WithMany()
                    .HasForeignKey(cm => cm.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                  entity.HasOne(cm => cm.Receiver)
                    .WithMany()
                    .HasForeignKey(cm => cm.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
      }
}
