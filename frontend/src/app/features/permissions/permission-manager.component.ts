import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminResponse } from '../../core/services/admin.service';

interface PermissionItem {
  code: string;
  label: string;
  implicitReads?: string[]; // Nếu tick quyền này, tự động tick các quyền read tương ứng
}

interface PermissionGroup {
  name: string;
  items: PermissionItem[];
}

@Component({
  selector: 'app-permission-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col md:flex-row gap-6">

      <!-- Left Column: User List & Search -->
      <div class="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden shrink-0 h-[calc(100vh-8rem)]">
        <div class="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-bold text-gray-800 dark:text-slate-100">Tài khoản Admin</h2>
            <button (click)="openAddModal()" class="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              Thêm mới
            </button>
          </div>

          <!-- Search Bar -->
          <div class="mt-3 relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()"
                   class="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out text-gray-900 dark:text-white"
                   placeholder="Tìm kiếm tên, email, username...">
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2">
          <div *ngIf="isLoading()" class="flex justify-center p-4">
            <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>

          <div *ngIf="!isLoading() && filteredUsers().length === 0" class="text-center py-6 text-gray-500 text-sm">
            Không tìm thấy tài khoản nào.
          </div>

          <div *ngFor="let user of filteredUsers()"
               (click)="selectUser(user)"
               class="p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 border"
               [ngClass]="selectedUser()?.id === user.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-700'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                {{ user.fullName.charAt(0) || 'U' }}
              </div>
              <div class="overflow-hidden flex-1">
                <h3 class="font-semibold text-gray-800 dark:text-slate-200 truncate flex items-center justify-between"
                    [ngClass]="{'text-blue-700 dark:text-blue-400': selectedUser()?.id === user.id}">
                  {{ user.fullName }}
                  <span *ngIf="user.permissions && user.permissions.length > 0" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{{ user.permissions.length }} quyền</span>
                </h3>
                <p class="text-xs text-gray-500 dark:text-slate-400 truncate">{{ user.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Checkbox Groups -->
      <div class="w-full md:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden h-auto md:h-[calc(100vh-8rem)]">

        <div *ngIf="!selectedUser()" class="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 dark:text-slate-500">
          <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <p class="text-lg">Chưa chọn tài khoản nào</p>
          <p class="text-sm mt-1">Vui lòng chọn hoặc tìm kiếm một tài khoản bên trái.</p>
        </div>

        <ng-container *ngIf="selectedUser()">
          <div class="p-6 border-b border-gray-100 dark:border-slate-700 flex items-start gap-4 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {{ selectedUser()!.fullName.charAt(0) || 'U' }}
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-800 dark:text-slate-100">{{ selectedUser()!.fullName }}</h2>
              <p class="text-gray-500 dark:text-slate-400 mt-1">Username: <span class="font-medium text-gray-700 dark:text-slate-300">{{ selectedUser()!.username }}</span></p>
            </div>
            <div class="text-right flex gap-2">
               <button (click)="selectAllPermissions()" class="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 dark:text-blue-400 font-medium transition-colors">
                Chọn tất cả
              </button>
              <button (click)="deselectAllPermissions()" class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 font-medium transition-colors">
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

          <div class="p-6 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-slate-900/30">
            <div class="space-y-6">

              <!-- Map through Permission Groups -->
              <div *ngFor="let group of groups" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">

                <!-- Group Header -->
                <div class="bg-gray-50 dark:bg-slate-800/80 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center">
                  <h4 class="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                    {{ group.name }}
                  </h4>
                </div>

                <!-- Group Items -->
                <div class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <label *ngFor="let item of group.items" class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer group/label transition-colors"
                         [ngClass]="{'bg-blue-50/50 dark:bg-blue-900/10': hasPermission(item.code)}">
                    <div class="flex items-center h-5 mt-1">
                      <input type="checkbox"
                             [checked]="hasPermission(item.code)"
                             (change)="togglePermission(item)"
                             class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer">
                    </div>
                    <div class="flex-1 text-sm mt-0.5">
                      <span class="font-medium text-gray-700 dark:text-slate-200 group-hover/label:text-blue-600 dark:group-hover/label:text-blue-400 transition-colors">{{ item.label }}</span>
                    </div>
                  </label>
                </div>

              </div>

            </div>
          </div>

          <div class="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 shrink-0">
            <button *ngIf="showSuccessMsg()" class="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 font-medium mr-2 animate-fade-in-up">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Đã lưu thành công!
            </button>
            <button (click)="savePermissions()" [disabled]="isSaving()"
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center">
              <svg *ngIf="isSaving()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Lưu phân quyền
            </button>
          </div>
        </ng-container>

      </div>
    </div>

    <!-- Add Admin Modal -->
    <div *ngIf="showAddModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div class="fixed inset-0 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity" (click)="closeAddModal()"></div>
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in-up border border-gray-100 dark:border-slate-700">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">Thêm Admin mới</h3>
          <button (click)="closeAddModal()" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form (ngSubmit)="submitAddAdmin()" #addForm="ngForm" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Họ và Tên <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="newAdmin.fullName" name="fullName" required class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tên đăng nhập (Username) <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="newAdmin.username" name="username" required class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" [(ngModel)]="newAdmin.email" name="email" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mật khẩu khởi tạo <span class="text-red-500">*</span></label>
            <input type="password" [(ngModel)]="newAdmin.password" name="password" required class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
          </div>

          <div class="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700 mt-6">
            <button type="button" (click)="closeAddModal()" class="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Hủy</button>
            <button type="submit" [disabled]="addForm.invalid || isAdding()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center">
              <svg *ngIf="isAdding()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PermissionManagerComponent implements OnInit {
  private adminService = inject(AdminService);

  allUsers = signal<AdminResponse[]>([]);
  searchQuery = signal<string>('');

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.allUsers();

    return this.allUsers().filter(u =>
      u.fullName.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query)
    );
  });

  isLoading = signal(false);
  isSaving = signal(false);
  isAdding = signal(false);
  showSuccessMsg = signal(false);
  showAddModal = signal(false);

  newAdmin = {
    fullName: '',
    username: '',
    email: '',
    password: ''
  };

  selectedUser = signal<AdminResponse | null>(null);
  currentPermissions = signal<Set<string>>(new Set());

  // Define Groups matching EXACTLY with BE database
  groups: PermissionGroup[] = [
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

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.adminService.getAllAdmins().subscribe({
      next: (data) => {
        const mockMoreUsers = [
          ...data,
          { id: 4, username: 'nguoidung1', fullName: 'Nguyễn Văn A', email: 'nva@gmail.com', createdAt: new Date().toISOString(), permissions: [] },
          { id: 5, username: 'nguoidung2', fullName: 'Trần Thị B', email: 'ttb@gmail.com', createdAt: new Date().toISOString(), permissions: [] }
        ];
        this.allUsers.set(mockMoreUsers);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange() {}

  selectUser(user: AdminResponse) {
    this.selectedUser.set(user);
    this.currentPermissions.set(new Set(user.permissions || []));
    this.showSuccessMsg.set(false);
  }

  hasPermission(code: string): boolean {
    return this.currentPermissions().has(code);
  }

  togglePermission(item: PermissionItem) {
    const current = new Set(this.currentPermissions());

    if (current.has(item.code)) {
      // Uncheck
      current.delete(item.code);

      // If unchecking a 'read' permission, auto-uncheck dependents
      if (item.code.endsWith(':read')) {
        this.groups.forEach(g => {
          g.items.forEach(i => {
            if (i.implicitReads?.includes(item.code)) {
              current.delete(i.code);
            }
          });
        });
      }
    } else {
      // Check
      current.add(item.code);

      // Auto-check dependencies
      if (item.implicitReads) {
        item.implicitReads.forEach(readCode => {
          current.add(readCode);
        });
      }
    }

    this.currentPermissions.set(current);
    this.showSuccessMsg.set(false);
  }

  selectAllPermissions() {
    const all = new Set<string>();
    this.groups.forEach(g => {
      g.items.forEach(i => all.add(i.code));
    });
    this.currentPermissions.set(all);
    this.showSuccessMsg.set(false);
  }

  deselectAllPermissions() {
    this.currentPermissions.set(new Set());
    this.showSuccessMsg.set(false);
  }

  savePermissions() {
    const user = this.selectedUser();
    if (!user) return;

    this.isSaving.set(true);
    const permsArray = Array.from(this.currentPermissions());

    this.adminService.updateAdminPermissions(user.id, permsArray).subscribe({
      next: () => {
        user.permissions = permsArray;
        const all = [...this.allUsers()];
        const index = all.findIndex(u => u.id === user.id);
        if (index !== -1) {
          all[index] = { ...user };
          this.allUsers.set(all);
        }

        this.isSaving.set(false);
        this.showSuccessMsg.set(true);
        setTimeout(() => this.showSuccessMsg.set(false), 3000);
      },
      error: () => {
        this.isSaving.set(false);
        alert('Có lỗi xảy ra khi lưu phân quyền.');
      }
    });
  }

  openAddModal() {
    this.newAdmin = { fullName: '', username: '', email: '', password: '' };
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  submitAddAdmin() {
    if (!this.newAdmin.fullName || !this.newAdmin.username || !this.newAdmin.password) return;

    this.isAdding.set(true);
    this.adminService.addAdmin(this.newAdmin).subscribe({
      next: (admin) => {
        const updatedUsers = [admin, ...this.allUsers()];
        this.allUsers.set(updatedUsers);
        this.isAdding.set(false);
        this.closeAddModal();
        this.selectUser(admin); // Tự động chọn user mới tạo
      },
      error: () => {
        this.isAdding.set(false);
        alert('Có lỗi xảy ra khi tạo tài khoản.');
      }
    });
  }
}
