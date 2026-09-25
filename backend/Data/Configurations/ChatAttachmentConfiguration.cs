using backend.Models;
using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace demo_dotnet.backend.Data.Configurations;

public class ChatAttachmentConfiguration : IEntityTypeConfiguration<ChatAttachment>
{
    public void Configure(EntityTypeBuilder<ChatAttachment> entity)
    {
        entity.ToTable("chat_attachment", table => table.HasCheckConstraint("ck_chat_attachment_state",
            "(status = 'Pending' AND message_id IS NULL AND expires_at IS NOT NULL) OR " +
            "(status = 'Attached' AND message_id IS NOT NULL AND expires_at IS NULL) OR " +
            "(status = 'Deleting' AND message_id IS NULL)"));
        entity.HasKey(a => a.Id);
        entity.Property(a => a.Id).HasColumnName("id");
        entity.Property(a => a.MessageId).HasColumnName("message_id");
        entity.Property(a => a.UploaderId).HasColumnName("uploader_id");
        entity.Property(a => a.ReceiverId).HasColumnName("receiver_id");
        entity.Property(a => a.OriginalFileName).HasColumnName("original_file_name").HasMaxLength(255);
        entity.Property(a => a.StorageKey).HasColumnName("storage_key").HasMaxLength(32);
        entity.Property(a => a.ContentType).HasColumnName("content_type").HasMaxLength(150);
        entity.Property(a => a.SizeBytes).HasColumnName("size_bytes");
        entity.Property(a => a.Kind).HasColumnName("kind").HasMaxLength(10);
        entity.Property(a => a.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(10);
        entity.Property(a => a.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp without time zone");
        entity.Property(a => a.ExpiresAt).HasColumnName("expires_at").HasColumnType("timestamp without time zone");
        entity.HasIndex(a => a.StorageKey).IsUnique();
        entity.HasIndex(a => a.MessageId);
        entity.HasIndex(a => a.UploaderId);
        entity.HasIndex(a => new { a.Status, a.ExpiresAt });
        entity.HasOne(a => a.Message).WithMany(m => m.Attachments).HasForeignKey(a => a.MessageId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Admin>().WithMany().HasForeignKey(a => a.UploaderId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Admin>().WithMany().HasForeignKey(a => a.ReceiverId).OnDelete(DeleteBehavior.Restrict);
    }
}
