-- 1. Thêm 17 mã quyền vào bảng permission (Sử dụng ON CONFLICT DO NOTHING để tránh lỗi nếu đã có)
INSERT INTO permission (code, description) VALUES
('student:read', 'Xem danh sách Học sinh'),
('student:create', 'Thêm mới Học sinh'),
('student:update', 'Cập nhật Học sinh'),
('student:delete', 'Xóa Học sinh'),
('parent:read', 'Xem danh sách Phụ huynh'),
('parent:create', 'Thêm mới Phụ huynh'),
('parent:update', 'Cập nhật Phụ huynh'),
('parent:delete', 'Xóa Phụ huynh'),
('student_parent:assign', 'Gán phụ huynh cho học sinh'),
('student_parent:remove', 'Hủy gán phụ huynh'),
('admin:read', 'Xem danh sách Admin'),
('admin:create', 'Tạo Admin mới'),
('admin:update', 'Cập nhật thông tin Admin'),
('admin:delete', 'Xóa Admin'),
('role:read', 'Xem danh sách Nhóm quyền'),
('role:manage', 'Quản lý Nhóm quyền'),
('admin_permission:assign', 'Cấp quyền cho Admin')
ON CONFLICT (code) DO NOTHING;

-- 2. Gán toàn bộ quyền trong hệ thống cho tài khoản Admin có ID = 1
-- (Nếu tài khoản Admin tổng của bác có ID khác 1, vui lòng đổi số 1 ở câu lệnh SELECT bên dưới thành ID tương ứng)
INSERT INTO admin_permission (admin_id, permission_id)
SELECT 1, id FROM permission
ON CONFLICT (admin_id, permission_id) DO NOTHING;

