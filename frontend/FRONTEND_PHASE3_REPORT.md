# Báo cáo Tiến độ Nâng cấp Giao diện (Phase 3)

Tài liệu này tổng hợp lại toàn bộ các yêu cầu cải tiến Giao diện & Trải nghiệm Người dùng (UI/UX) mà bạn đã đưa ra, cùng với tiến độ thực hiện tính đến thời điểm hiện tại.

## 🎯 1. Danh sách Yêu cầu của bạn (User Requests)

Bạn nhận định giao diện cũ "hơi basic quá" và đặt ra các tiêu chuẩn bắt buộc sau đây cho một sản phẩm Frontend chuyên nghiệp:

- **Trang Đăng nhập (Login):**
  - Thêm ảnh nền (Background) để làm nổi bật chủ đề giáo dục.
  - Tối ưu Validate cho các trường Tài khoản / Mật khẩu.
  - Bổ sung Checkbox "Ghi nhớ mật khẩu".
  - Thêm nút "Đăng nhập với Google".
  - Thêm nút "Quên mật khẩu" hiển thị dạng Popup/Modal trượt lên đè lên trang Login (yêu cầu xác thực Email -> gửi mã OTP).
- **Trang chủ (Dashboard):**
  - Tích hợp thêm các Template hiển thị: Biểu đồ (Charts), Thời gian thực (Clock), Timeline lịch trình, Bản đồ...
  - Thay đổi tính năng thẻ Card: Khi click vào các thẻ Tổng số Học sinh/Phụ huynh sẽ xổ ra một danh sách (List dropdown) ngay tại chỗ thay vì chuyển trang.
- **Trang danh sách Học sinh:**
  - Tối ưu không gian: Gộp chung các thao tác (Sửa, Xóa, Chi tiết) thành 1 nút Action menu xổ xuống.
  - Bổ sung tính năng Sắp xếp (Sorting) trực tiếp khi nhấn vào tiêu đề cột (Mã HS, Họ tên, Lớp...).
  - Tối ưu Tìm kiếm: Vì đang dùng Mock Data (dữ liệu tải sẵn ở Frontend) nên phải bỏ hiệu ứng Loading chờ đợi, lọc dữ liệu ngay lập tức và ốp thêm CSS Animation cho mượt mà.

---

## ✅ 2. Những gì đã hoàn thành (Đạt 66%)

Chúng ta đã chia quá trình thực thi thành các Plan nhỏ và hiện tại đã hoàn thành xuất sắc 2 Plan đầu tiên:

### Plan 3.1: Hoàn thiện Phân hệ Đăng nhập
- **(Đã làm)** Dựng lại toàn bộ layout Login với ảnh nền sắc nét và lớp phủ kính mờ (glassmorphism) hiện đại.
- **(Đã làm)** Validation phản hồi ngay lập tức khi người dùng gõ sai (hiển thị viền đỏ và text cảnh báo).
- **(Đã làm)** Thêm đầy đủ Checkbox ghi nhớ và Nút đăng nhập Google.
- **(Đã làm)** **ĐIỂM NHẤN:** Chức năng Quên mật khẩu được thiết kế với hiệu ứng trượt màn hình siêu mượt gồm 3 bước giả lập: Nhập Email -> Fake thời gian chờ lấy OTP -> Form đổi mật khẩu mới.

### Plan 3.2: Tái cấu trúc Dashboard
- **(Đã làm)** Hoàn tất cài đặt thư viện `chart.js` và `ng2-charts` mà không làm hỏng cấu trúc dự án.
- **(Đã làm)** Vẽ 2 biểu đồ trực quan: Bar Chart (Thống kê theo Khối) và Doughnut Chart (Tỷ lệ Nam/Nữ).
- **(Đã làm)** Thêm widget Đồng hồ thời gian thực và Cây thư mục (Timeline) sự kiện.
- **(Đã làm)** **ĐIỂM NHẤN:** Các thẻ Card màu sắc đã có thể click vào để thả xuống một danh sách "Học sinh/Phụ huynh mới thêm" với hiệu ứng fade-in.

---

## ⏳ 3. Những gì chuẩn bị làm (Đang chờ lệnh)

**Plan 3.3 (Cuối cùng): Nâng cấp Trang Quản lý Học sinh**
- [ ] Refactor cột Thao tác thành nút 3 chấm (`⋮`).
- [ ] Gắn thuật toán Sorting (Sắp xếp A-Z, Z-A) vào Header của bảng.
- [ ] Gỡ vòng lặp `delay()` trong Service để chức năng tìm kiếm có tốc độ phản hồi 0ms.
- [ ] Tích hợp CSS Transition để hàng ngũ trong bảng co giãn uyển chuyển.

*(Tài liệu này sẽ được bổ sung tiếp sau khi hoàn thành Plan 3.3 và dùng làm Handover bàn giao API cho nhóm Backend).*
