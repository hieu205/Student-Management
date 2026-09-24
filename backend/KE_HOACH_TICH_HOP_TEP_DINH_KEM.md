# Kế hoạch tích hợp tệp đính kèm trong tin nhắn

## 1. Mục tiêu và phạm vi

Cho phép người dùng gửi ảnh và tài liệu trong cuộc trò chuyện giữa hai admin, hỗ trợ tin nhắn chỉ có chữ, chỉ có tệp hoặc kết hợp cả hai. Người nhận xem ảnh, tải tài liệu và thấy lại tệp khi mở lịch sử chat.

Kế hoạch này đã được triển khai ở backend ngày 24/09/2026 theo kiến trúc tận dụng `ChatController`, `ChatService` và `ChatRepository` hiện có; chỉ tách `FileStorageService` để quản lý ổ đĩa. Frontend vẫn là phần việc tiếp theo.

Phạm vi ban đầu:

- Gửi nhiều tệp trong một tin nhắn.
- Hiển thị ảnh xem trước và thông tin tên, loại, kích thước tệp.
- Upload có tiến độ, xử lý lỗi và cho phép bỏ tệp trước khi gửi.
- Giữ tương thích với luồng gửi tin nhắn chữ hiện tại.
- Chưa triển khai video streaming, chỉnh sửa ảnh, upload chia khối hoặc tìm kiếm nội dung tài liệu.

## 2. Hiện trạng ban đầu của dự án

- Backend dùng ASP.NET Core `net10.0`, EF Core và PostgreSQL.
- `Hubs/ChatHub.cs`: nhận `SendMessage`, gọi service lưu rồi phát `ReceiveMessage` cho người gửi và người nhận; hub nằm tại `/hubs/chat`.
- `Services/ChatService.cs`: tạo/lấy phòng, lưu nội dung và ánh xạ DTO tin nhắn.
- `Data/Repositories/ChatRepository.cs`: lưu tin nhắn, cập nhật phòng và đọc lịch sử.
- `Models/ChatMessage.cs`: có nội dung chữ, chưa có quan hệ tệp đính kèm.
- `DTOs/request/SendMessageRequest.cs`: hiện có `ReceiverId`, `Content`.
- `DTOs/response/ChatMessageResponse.cs`: chưa trả danh sách tệp.
- `Controllers/ChatController.cs`: cung cấp API phòng, lịch sử và đánh dấu đã đọc; đã yêu cầu đăng nhập.
- `Data/AppDbContext.cs`: ánh xạ bảng chat theo tên snake_case; phòng có chỉ mục duy nhất theo cặp admin.
- Frontend cần cập nhật `frontend/src/app/core/models/chat.model.ts`, `frontend/src/app/core/services/chat.service.ts` và `frontend/src/app/features/chat/chat.component.ts`.

Điểm cần xử lý cùng tính năng: luồng lấy lịch sử hiện chưa truyền danh tính người gọi vào service để kiểm tra thành viên phòng. Cần bổ sung kiểm tra cho cả lịch sử, đánh dấu đã đọc và truy cập tệp; đăng nhập thành công chưa đủ để được truy cập mọi phòng.

## 3. Kiến trúc và luồng xử lý

Tải nội dung nhị phân qua HTTP multipart; SignalR chỉ truyền nội dung chữ và mã tệp. Không đưa byte tệp hoặc chuỗi Base64 vào sự kiện chat.

1. Người gửi chọn người nhận, chọn tệp; frontend kiểm tra sơ bộ loại và dung lượng.
2. Frontend gọi API upload kèm `receiverId` và các tệp.
3. Backend lấy người gửi từ JWT, kiểm tra người nhận, kiểm tra tệp, lưu vào kho riêng và tạo metadata trạng thái `Pending`.
4. API trả danh sách mã tệp đã upload.
5. Frontend gọi `SendMessage` với `receiverId`, `content`, `attachmentIds` và `clientMessageId`.
6. Service xác minh quyền sở hữu, người nhận, hạn dùng và trạng thái từng tệp; lưu tin nhắn và gắn tệp trong cùng transaction database.
7. Sau khi commit, hub phát `ReceiveMessage` chứa DTO đầy đủ cho hai bên.
8. Frontend hiển thị tin nhắn; ảnh/tài liệu được lấy qua endpoint có kiểm tra quyền.

Upload chưa tạo tin nhắn và chưa gửi thông báo tới người nhận. Tệp ở trạng thái `Pending` chỉ người upload được truy cập. Khi gửi thành công, tệp được chuyển sang `Attached`.

## 4. Thiết kế dữ liệu

Tạo model `ChatAttachment`, ánh xạ bảng `chat_attachment`:

| Trường | Kiểu đề xuất | Ý nghĩa |
| --- | --- | --- |
| Id | Guid / uuid | Mã tệp do server sinh |
| MessageId | long? / bigint nullable | Tin nhắn sở hữu; null khi chưa gửi |
| UploaderId | int | Admin upload, lấy từ JWT |
| ReceiverId | int | Người nhận dự kiến, cố định khi upload |
| OriginalFileName | string, tối đa 255 ký tự | Tên hiển thị đã làm sạch |
| StorageKey | string | Khóa lưu trữ nội bộ do server sinh |
| ContentType | string | MIME đã được server kiểm tra |
| SizeBytes | long | Kích thước thực tế |
| Kind | string | `Image` hoặc `File` |
| Status | string | `Pending`, `Attached`, `Deleting` |
| CreatedAt | DateTime UTC | Thời điểm upload |
| ExpiresAt | DateTime? UTC | Hạn của tệp Pending |

Yêu cầu ánh xạ:

- `ChatMessage` có collection `Attachments`; bổ sung `DbSet<ChatAttachment>`.
- Khóa ngoại tới tin nhắn và admin; thống nhất snake_case với schema hiện tại.
- Chỉ mục cho `MessageId`, `(Status, ExpiresAt)` và `UploaderId`; `StorageKey` duy nhất.
- Ràng buộc trạng thái: `Pending` chưa gắn tin nhắn; `Attached` phải có `MessageId`.
- Không xóa metadata bằng cascade rồi bỏ quên dữ liệu trong kho tệp; cần quy trình xóa có khả năng retry.
- Thêm `ClientMessageId` kiểu Guid nullable vào tin nhắn và unique index `(SenderId, ClientMessageId)` cho giá trị khác null để chống gửi trùng khi retry. Tin nhắn cũ không cần backfill mã này.
- `Content` tiếp tục dùng chuỗi; cho phép chuỗi rỗng nếu có ít nhất một tệp hợp lệ. Chuỗi trắng không được tính là nội dung.

Repo hiện có script SQL và chưa thấy thư mục migrations. Khi triển khai, thống nhất cách quản lý schema: ưu tiên script SQL có phiên bản theo quy trình hiện tại; nếu chuyển sang EF migrations thì thiết lập baseline cho database đang tồn tại trước. Không chạy tạo lại database để thêm tính năng.

## 5. Hợp đồng API đề xuất

### 5.1. Upload tệp

`POST /api/v1/chat/attachments`

- Yêu cầu Bearer JWT và `multipart/form-data`.
- Form gồm `receiverId` và `files` có thể lặp lại.
- Lấy `UploaderId` từ JWT; không nhận người gửi hoặc đường dẫn lưu từ client.
- Kiểm tra người nhận tồn tại, không phải chính người gửi và thuộc phạm vi được phép chat.
- Trả `201 Created` cùng danh sách metadata: `id`, `fileName`, `contentType`, `sizeBytes`, `kind`, `expiresAt`.
- Một lô upload áp dụng tất cả hoặc không có tệp nào được công bố thành công. Nếu lỗi giữa chừng, bù trừ xóa các tệp đã ghi; tác vụ dọn rác xử lý phần xóa thất bại.

### 5.2. Gửi tin nhắn qua SignalR

Mở rộng request, giữ nguyên tên phương thức `SendMessage`:

```json
{
  "receiverId": 12,
  "content": "Mình gửi ảnh và tài liệu.",
  "attachmentIds": ["7061d9ac-df98-45be-a40a-eb22f25ec6ce"],
  "clientMessageId": "831bc2bd-a702-4d6a-9df1-e8d947b13483"
}
```

- `attachmentIds` mặc định là mảng rỗng để client cũ vẫn gửi chữ được.
- `clientMessageId` có thể thiếu ở client cũ; frontend mới tạo mã một lần cho mỗi tin nhắn và giữ nguyên khi retry.
- Tệp phải thuộc người gửi, đúng người nhận, chưa hết hạn và chưa gắn vào tin nhắn khác; từ chối ID bị lặp.
- Kiểm tra số lượng và tổng dung lượng cả tin nhắn, kể cả khi các tệp được upload qua nhiều request.
- Việc chuyển `Pending` sang `Attached` phải có điều kiện/khóa trong transaction để hai yêu cầu đồng thời không dùng chung một tệp.
- Nếu cùng `clientMessageId` đã thành công, trả lại tin nhắn cũ; nếu payload khác, báo xung đột. Không tạo thêm bản ghi.
- Đề xuất hub trả DTO đã lưu làm xác nhận cho bên gửi; sự kiện `ReceiveMessage` vẫn được giữ. Frontend hợp nhất theo `id` để tránh hiển thị trùng.
- Lỗi nghiệp vụ trả mã lỗi ổn định qua cơ chế lỗi của hub, không trả stack trace. Các mã HTTP bên dưới chỉ áp dụng cho REST.

### 5.3. Response tin nhắn và lịch sử

Bổ sung `attachments` vào `ChatMessageResponse`; mỗi phần tử gồm `id`, `fileName`, `contentType`, `sizeBytes`, `kind`, `downloadUrl`, `previewUrl` nếu là ảnh.

- `downloadUrl` và `previewUrl` là đường dẫn API được bảo vệ, không phải URL công khai hay đường dẫn ổ đĩa.
- Tin nhắn chữ cũ trả `attachments: []`.
- API lịch sử trả cùng cấu trúc với sự kiện realtime; truy vấn lấy metadata theo trang, tránh N+1.
- Phân trang ổn định theo `CreatedAt` và `Id`; giới hạn `pageSize` ở server.
- Danh sách phòng có nhãn dự phòng cho tin nhắn không có chữ, ví dụ `[Ảnh]`, `[Tệp: bao-cao.pdf]` hoặc `[3 tệp đính kèm]`.

### 5.4. Xem, tải và hủy tệp

| Endpoint | Hành vi |
| --- | --- |
| `GET /api/v1/chat/attachments/{id}/download` | Stream tệp, dùng Content-Disposition attachment với tên đã làm sạch |
| `GET /api/v1/chat/attachments/{id}/preview` | Chỉ trả inline ảnh đã kiểm tra; không dùng để xem trực tiếp tài liệu/HTML |
| `DELETE /api/v1/chat/attachments/{id}` | Chỉ chủ upload được hủy tệp Pending; tệp đã gửi chưa hỗ trợ xóa riêng ở phiên bản đầu |

Với tệp đã gửi, xác minh người gọi là thành viên phòng của tin nhắn sở hữu. Với tệp Pending, chỉ người upload được đọc hoặc hủy. Kiểm tra quyền trước khi đọc storage. Có thể trả 404 cho cả tài nguyên không tồn tại và tài nguyên không được phép thấy để hạn chế lộ thông tin.

Frontend dùng HTTP có Bearer token để nhận Blob, tạo object URL khi xem ảnh/tải xuống và thu hồi URL sau khi dùng. Thẻ `img` dùng trực tiếp URL API không tự đính kèm Authorization header. Không đưa JWT vào query string của endpoint tệp.

Quy ước lỗi REST: `400` dữ liệu không hợp lệ, `401` chưa đăng nhập, `404` không tồn tại/không được thấy, `409` trạng thái xung đột, `413` quá dung lượng, `415` loại tệp không hỗ trợ, `429` vượt hạn mức. Giữ cấu trúc lỗi thống nhất với backend hiện tại.

## 6. Lưu trữ, giới hạn và bảo vệ dữ liệu

Các giá trị sau là mặc định đề xuất để bắt đầu, có thể điều chỉnh bằng cấu hình:

| Cấu hình | Giá trị đề xuất |
| --- | --- |
| Số tệp mỗi tin nhắn/lần upload | 5 |
| Dung lượng mỗi tệp | 10 MiB |
| Tổng dung lượng mỗi tin nhắn/lần upload | 25 MiB |
| Hạn tệp Pending | 24 giờ |
| Ảnh cho phép | JPEG, PNG, WebP |
| Tài liệu cho phép | PDF, TXT, DOCX, XLSX |

- Tạo `IFileStorageService` với thao tác ghi stream, mở đọc và xóa; bản đầu dùng local storage ngoài `wwwroot`, thư mục có cấu hình riêng.
- Khóa lưu trữ dùng mã ngẫu nhiên; không ghép đường dẫn từ tên tệp người dùng, không cho thực thi nội dung upload.
- Khi chạy nhiều instance, dùng kho chung hoặc object storage thông qua cùng interface; không dựa vào ổ tạm của từng instance. Cần sao lưu metadata và tệp nhất quán.
- Kiểm tra extension, MIME và cấu trúc/chữ ký thực tế phù hợp từng định dạng. DOCX/XLSX cần kiểm tra cấu trúc gói Office; TXT kiểm tra encoding/nội dung. Không chỉ tin `Content-Type` của client.
- Chặn HTML, SVG, tệp thực thi và định dạng ngoài allowlist. Với ảnh, kiểm tra khả năng giải mã và giới hạn kích thước pixel để tránh ảnh giải nén quá lớn.
- Làm sạch tên hiển thị, giới hạn độ dài, loại bỏ đường dẫn/ký tự điều khiển; encode tên đúng khi tạo header tải xuống.
- Giới hạn dung lượng thực đọc, số tệp, tốc độ upload và quota theo người dùng. Đồng bộ giới hạn request ở ASP.NET Core và reverse proxy, có chừa phần multipart overhead.
- Stream dữ liệu khi khả thi, tránh đọc toàn bộ tệp lớn vào RAM; xử lý hủy request và xóa phần upload dở.
- Trả Content-Type do server xác định, `X-Content-Type-Options: nosniff` và chính sách cache riêng tư phù hợp.
- Trước khi mở rộng sang môi trường có người dùng không tin cậy, tích hợp quét mã độc; nếu quét bất đồng bộ, thêm trạng thái Quarantined/Rejected và chỉ cho gắn/tải tệp sau khi đạt kiểm tra.
- Không ghi token, nội dung tệp hoặc đường dẫn nội bộ nhạy cảm vào log.

## 7. Tính nhất quán và xử lý lỗi

- Database và storage không chung transaction: ghi tệp thành công nhưng lưu metadata thất bại phải xóa bù; nếu xóa thất bại, lưu dấu vết để dọn lại.
- Trong transaction gửi tin nhắn, lưu message, liên kết toàn bộ attachment và cập nhật `ChatRoom.UpdatedAt` cùng nhau. Một tệp không hợp lệ làm thất bại toàn bộ thao tác gửi.
- Xử lý xung đột tạo phòng bằng unique index cặp admin và đọc lại phòng đã được request khác tạo.
- Chỉ broadcast sau commit. Nếu broadcast thất bại, không xóa tin nhắn đã lưu; client tải lại lịch sử khi reconnect và retry với cùng `clientMessageId`.
- Bản đầu dùng lịch sử làm nguồn đối soát. Nếu cần đảm bảo phát sự kiện ngay cả khi process dừng sau commit, bổ sung transactional outbox ở giai đoạn tiếp theo.
- Tác vụ nền dọn Pending hết hạn theo lô: chuyển có điều kiện sang `Deleting`, xóa storage, rồi xóa metadata. Gửi tin nhắn không được nhận tệp `Deleting`; retry khi xóa lỗi để tránh tranh chấp với luồng gửi.
- Bổ sung đối soát tệp không có metadata theo tuổi tệp và khoảng chờ an toàn, tránh xóa upload đang chạy.

## 8. Danh sách thay đổi dự kiến

| File/thành phần | Công việc |
| --- | --- |
| `Models/ChatAttachment.cs` (mới) | Entity metadata tệp |
| `Models/ChatMessage.cs` | Quan hệ attachments và ClientMessageId |
| `Data/AppDbContext.cs` | Mapping, khóa ngoại, chỉ mục và ràng buộc |
| Script SQL có phiên bản / migration | Nâng cấp schema mà không mất dữ liệu chat cũ |
| `DTOs/request/SendMessageRequest.cs` | AttachmentIds và ClientMessageId |
| DTO upload, attachment response (mới) | Hợp đồng upload và metadata |
| `DTOs/response/ChatMessageResponse.cs` | Danh sách attachments |
| `Controllers/ChatController.cs` | Bổ sung upload, download, preview, hủy Pending trong tầng chat hiện có |
| `Services/ChatService.cs`, `Data/Repositories/ChatRepository.cs` | Bổ sung validation, metadata, quyền truy cập và vòng đời tệp trong tầng chat hiện có |
| `IFileStorageService`, `LocalFileStorageService` (mới) | Tách storage khỏi nghiệp vụ chat |
| `Services/ChatService.cs`, `Services/Interface/IChatService.cs` | Transaction gửi, chống trùng, kiểm tra thành viên và mapping DTO |
| `Data/Repositories/ChatRepository.cs`, interface tương ứng | Đọc attachments, điều phối lưu nhất quán và phân trang |
| `Controllers/ChatController.cs` | Truyền danh tính vào luồng đọc lịch sử/đánh dấu đã đọc |
| `Hubs/ChatHub.cs` | Request mở rộng, xác nhận gửi và lỗi có cấu trúc |
| Background service dọn tệp (mới) | Dọn upload bỏ dở/hết hạn và retry xóa |
| `Program.cs`, cấu hình | DI, options, giới hạn upload và tác vụ nền |
| Frontend chat model/service/component | Chọn tệp, upload, gửi ID, preview và tải tệp có xác thực |

Khi tạo interface mới, thống nhất namespace theo phần được sửa vì repo hiện có cả thư mục `Interface` và namespace `Interfaces`.

## 9. Thứ tự triển khai

1. **Chốt hợp đồng:** định dạng được phép, dung lượng, quota, storage, cấu trúc lỗi và chính sách hết hạn.
2. **Schema và quyền truy cập:** thêm bảng/quan hệ/index, cập nhật kiểm tra thành viên phòng; kiểm tra dữ liệu cũ vẫn đọc được.
3. **Upload và storage:** triển khai stream, validation, metadata Pending, download/preview có quyền và hủy upload.
4. **Tích hợp chat:** mở rộng DTO, transaction gắn tệp, chống gửi trùng, cập nhật lịch sử và preview tin nhắn cuối.
5. **Tích hợp frontend:** chọn nhiều tệp, tiến độ, lỗi từng lần upload, bỏ tệp, tin nhắn chỉ có tệp và Blob preview/download. Khi đổi người nhận phải bỏ danh sách tệp chờ của cuộc trò chuyện cũ.
6. **Hoàn thiện vòng đời:** dọn tệp, xử lý lỗi storage/DB, reconnect và quan sát dung lượng/lỗi.
7. **Kiểm thử và phát hành:** áp dụng schema trước, backend tương thích client cũ tiếp theo, frontend sau cùng; bật tính năng qua cấu hình khi hoàn tất nghiệm thu.

Nếu cần rollback, tắt upload mới và quay lại giao diện cũ; giữ metadata/storage và khả năng đọc tệp đã gửi, không drop bảng hoặc xóa tệp tự động.

## 10. Kiểm thử và tiêu chí hoàn thành

- [ ] Gửi chữ như cũ vẫn hoạt động; request cũ không có attachmentIds vẫn được chấp nhận.
- [ ] Gửi một ảnh, một tài liệu, nhiều tệp và tin nhắn có cả chữ lẫn tệp thành công.
- [ ] Chặn tin nhắn rỗng không có tệp; chặn tệp rỗng, loại giả mạo, ảnh lỗi, quá dung lượng/số lượng.
- [ ] Kiểm tra cả tổng dung lượng tin nhắn khi ghép tệp từ nhiều lần upload.
- [ ] Hai bên nhận metadata đúng qua realtime; lịch sử sau tải lại vẫn hiển thị và tải được tệp.
- [ ] Người thứ ba không xem lịch sử phòng hoặc tải/preview tệp bằng cách đoán ID.
- [ ] Không gắn được tệp của người khác, sai người nhận, hết hạn hoặc đã gắn vào tin nhắn khác.
- [ ] Hai thao tác gửi đồng thời không dùng lại cùng một tệp; retry cùng clientMessageId không tạo tin nhắn trùng.
- [ ] Download giữ đúng nội dung và tên tiếng Việt; ảnh được tải có xác thực và object URL được thu hồi.
- [ ] Lỗi DB/storage hoặc upload bị hủy không để lại tệp rác vĩnh viễn; tác vụ dọn không xóa tệp đã gửi.
- [ ] Mất kết nối sau commit được phục hồi bằng lịch sử; frontend không hiển thị trùng khi vừa nhận xác nhận vừa nhận sự kiện.
- [ ] Migration/script được kiểm tra trên bản sao dữ liệu, giữ nguyên tin nhắn cũ và hỗ trợ tắt tính năng khi có sự cố.

Ưu tiên unit test cho validation/quyền, integration test trên PostgreSQL cho transaction và tranh chấp, cùng kiểm thử hai tài khoản qua SignalR và một tài khoản không thuộc phòng. Hoàn thành khi luồng gửi–nhận–xem lịch sử–tải tệp hoạt động xuyên suốt và các kiểm tra quyền, giới hạn, dọn tệp đều đạt.
