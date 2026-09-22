export interface PermissionItem {
  code: string;
  label: string;
  implicitReads?: string[];
}

export interface PermissionGroup {
  name: string;
  items: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Quản lý Học sinh',
    items: [
      { code: 'student:read', label: 'Xem danh sách & chi tiết sinh viên' },
      { code: 'student:create', label: 'Thêm mới sinh viên', implicitReads: ['student:read'] },
      { code: 'student:update', label: 'Cập nhật thông tin sinh viên', implicitReads: ['student:read'] },
      { code: 'student:delete', label: 'Xóa sinh viên', implicitReads: ['student:read'] },
      { code: 'student_parent:assign', label: 'Gán phụ huynh cho sinh viên', implicitReads: ['student:read', 'parent:read'] },
      { code: 'student_parent:remove', label: 'Hủy liên kết sinh viên - phụ huynh', implicitReads: ['student:read', 'parent:read'] }
    ]
  },
  {
    name: 'Quản lý Phụ huynh',
    items: [
      { code: 'parent:read', label: 'Xem danh sách & chi tiết phụ huynh' },
      { code: 'parent:create', label: 'Thêm mới phụ huynh', implicitReads: ['parent:read'] },
      { code: 'parent:update', label: 'Cập nhật thông tin phụ huynh', implicitReads: ['parent:read'] },
      { code: 'parent:delete', label: 'Xóa phụ huynh', implicitReads: ['parent:read'] }
    ]
  },
  {
    name: 'Quản trị Hệ thống (Admin & Roles)',
    items: [
      { code: 'admin:read', label: 'Xem danh sách & chi tiết tài khoản Admin' },
      { code: 'admin:create', label: 'Tạo mới tài khoản Admin', implicitReads: ['admin:read'] },
      { code: 'admin:update', label: 'Cập nhật thông tin Admin', implicitReads: ['admin:read'] },
      { code: 'admin:delete', label: 'Xóa tài khoản Admin', implicitReads: ['admin:read'] },
      { code: 'role:read', label: 'Xem danh sách Vai trò & Quyền mẫu' },
      { code: 'role:manage', label: 'Tạo/sửa/xóa Role mẫu', implicitReads: ['role:read'] },
      { code: 'admin_permission:assign', label: 'Cấp/Tước quyền trực tiếp của Admin', implicitReads: ['admin:read'] }
    ]
  }
];

