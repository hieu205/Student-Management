# Cấu hình tệp đính kèm chat

## Chuẩn bị database

Sao lưu database, sau đó chạy script nâng cấp một lần. Script có thể chạy lại an toàn và không tự tạo hoặc xóa database:

```powershell
psql -h localhost -U postgres -d db -v ON_ERROR_STOP=1 -f backend/Data/Scripts/20260924_chat_attachments.sql
```

Backend không tự chạy migration khi khởi động.

Nếu gặp lỗi `28P01: password authentication failed`, connection string hiện tại không khớp tài khoản PostgreSQL. Nên lưu connection string cục bộ bằng .NET User Secrets, tránh commit mật khẩu thật:

```powershell
dotnet user-secrets set --project backend "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=db;Username=postgres;Password=<MAT_KHAU_POSTGRES>"
dotnet run --project backend
```

Hoặc đặt bằng biến môi trường cho terminal hiện tại:

```powershell
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=db;Username=postgres;Password=<MAT_KHAU_POSTGRES>"
dotnet run --project backend
```

Background cleanup dùng chính `DefaultConnection`; nếu cấu hình này sai thì API database cũng sẽ lỗi. Service cleanup ghi lỗi và thử lại sau một giờ.

## Luồng API

Upload tệp bằng Bearer JWT và `multipart/form-data`:

```text
POST /api/v1/chat/attachments
receiverId=2
files=<một hoặc nhiều tệp>
```

Response trả các `id`. Gửi các mã này qua SignalR `SendMessage`:

```json
{
  "receiverId": 2,
  "content": "Mình gửi tài liệu",
  "attachmentIds": ["00000000-0000-0000-0000-000000000000"],
  "clientMessageId": "00000000-0000-0000-0000-000000000000"
}
```

Các endpoint còn lại:

- `GET /api/v1/chat/attachments/{id}/download`
- `GET /api/v1/chat/attachments/{id}/preview` (chỉ ảnh)
- `DELETE /api/v1/chat/attachments/{id}` (chỉ tệp Pending của người upload)

File được lưu mặc định ở `backend/App_Data/ChatAttachments` và thư mục này bị loại khỏi Git. Có thể đổi bằng `ChatAttachments:StoragePath` hoặc biến môi trường `ChatAttachments__StoragePath`. Khi chạy nhiều backend instance, cấu hình tất cả instance dùng chung một storage.

Giới hạn mặc định: 5 tệp, 10 MiB mỗi tệp, 25 MiB mỗi tin nhắn, Pending hết hạn sau 24 giờ. Định dạng hỗ trợ: JPEG, PNG, WebP, PDF, TXT UTF-8, DOCX và XLSX không chứa macro.
