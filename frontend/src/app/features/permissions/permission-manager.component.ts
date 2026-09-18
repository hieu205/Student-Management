import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminResponse } from '../../core/services/admin.service';

interface PermissionModule {
  name: string;
  code: string;
  actions: { code: string; label: string }[];
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
          <h2 class="text-lg font-bold text-gray-800 dark:text-slate-100">Tài khoản Người dùng</h2>

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
                  <span *ngIf="user.permissions && user.permissions.length > 0" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">Có quyền</span>
                </h3>
                <p class="text-xs text-gray-500 dark:text-slate-400 truncate">{{ user.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Permission Matrix -->
      <div class="w-full md:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden h-auto md:h-[calc(100vh-8rem)]">

        <div *ngIf="!selectedUser()" class="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 dark:text-slate-500">
          <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <p class="text-lg">Chưa chọn tài khoản nào</p>
          <p class="text-sm mt-1">Vui lòng chọn hoặc tìm kiếm một tài khoản bên trái.</p>
        </div>

        <ng-container *ngIf="selectedUser()">
          <div class="p-6 border-b border-gray-100 dark:border-slate-700 flex items-start gap-4 bg-gray-50/50 dark:bg-slate-900/50">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {{ selectedUser()!.fullName.charAt(0) || 'U' }}
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-slate-100">{{ selectedUser()!.fullName }}</h2>
              <p class="text-gray-500 dark:text-slate-400 mt-1">Username: <span class="font-medium text-gray-700 dark:text-slate-300">{{ selectedUser()!.username }}</span></p>
              <p class="text-gray-500 dark:text-slate-400 text-sm">Email: {{ selectedUser()!.email || 'Trống' }}</p>
            </div>
          </div>

          <div class="p-6 flex-1 overflow-y-auto">
            <div class="flex justify-between items-end mb-4">
              <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100">Ma trận Phân quyền</h3>
              <button (click)="toggleAllPermissions()" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                Chọn tất cả / Bỏ chọn
              </button>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead class="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Nhóm chức năng
                    </th>
                    <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider" *ngFor="let action of commonActions">
                      {{ action.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  <tr *ngFor="let module of modules" class="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">
                      {{ module.name }}
                    </td>
                    <td *ngFor="let action of module.actions" class="px-4 py-4 whitespace-nowrap text-center">
                      <div class="flex justify-center items-center h-full">
                        <input type="checkbox"
                               [checked]="hasPermission(module.code, action.code)"
                               (change)="togglePermission(module.code, action.code)"
                               class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer">
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-900">
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
  `
})
export class PermissionManagerComponent implements OnInit {
  private adminService = inject(AdminService);

  allUsers = signal<AdminResponse[]>([]);
  searchQuery = signal<string>('');

  // Computed signal for filtering users based on search
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
  showSuccessMsg = signal(false);

  selectedUser = signal<AdminResponse | null>(null);
  currentPermissions = signal<Set<string>>(new Set());

  // Define the common actions for the table columns
  commonActions = [
    { code: 'read', label: 'Xem' },
    { code: 'create', label: 'Thêm' },
    { code: 'update', label: 'Sửa' },
    { code: 'delete', label: 'Xóa' }
  ];

  // Define the modules for the rows
  modules: PermissionModule[] = [
    { name: 'Quản lý Học sinh', code: 'student', actions: this.commonActions },
    { name: 'Quản lý Phụ huynh', code: 'parent', actions: this.commonActions },
    { name: 'Hệ thống (Phân quyền)', code: 'system', actions: this.commonActions }
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    // Tạm thời gọi API lấy Admins, sau này sẽ là API lấy tất cả Users
    this.adminService.getAllAdmins().subscribe({
      next: (data) => {
        // Mock thêm data để test Search nếu cần
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

  onSearchChange() {
    // Search is handled by the computed signal automatically
  }

  selectUser(user: AdminResponse) {
    this.selectedUser.set(user);
    this.currentPermissions.set(new Set(user.permissions || []));
    this.showSuccessMsg.set(false);
  }

  hasPermission(moduleCode: string, actionCode: string): boolean {
    const permString = `${moduleCode}:${actionCode}`;
    return this.currentPermissions().has(permString);
  }

  togglePermission(moduleCode: string, actionCode: string) {
    const permString = `${moduleCode}:${actionCode}`;
    const readString = `${moduleCode}:read`;
    const current = new Set(this.currentPermissions());
    
    if (current.has(permString)) {
      // Bỏ tick
      current.delete(permString);
      
      // Nếu bỏ tick quyền 'Xem' (read), tự động bỏ tick luôn các quyền 'Thêm', 'Sửa', 'Xóa'
      if (actionCode === 'read') {
        current.delete(`${moduleCode}:create`);
        current.delete(`${moduleCode}:update`);
        current.delete(`${moduleCode}:delete`);
      }
    } else {
      // Tick chọn
      current.add(permString);
      
      // Nếu tick chọn 'Thêm', 'Sửa' hoặc 'Xóa', tự động tick luôn quyền 'Xem' (read)
      if (actionCode === 'create' || actionCode === 'update' || actionCode === 'delete') {
        current.add(readString);
      }
    }
    
    this.currentPermissions.set(current);
    this.showSuccessMsg.set(false);
  }

  toggleAllPermissions() {
    const current = new Set(this.currentPermissions());
    let totalPermissions = 0;

    this.modules.forEach(m => totalPermissions += m.actions.length);

    if (current.size > 0) {
      // Clear all
      this.currentPermissions.set(new Set());
    } else {
      // Select all
      const all = new Set<string>();
      this.modules.forEach(m => {
        m.actions.forEach(a => {
          all.add(`${m.code}:${a.code}`);
        });
      });
      this.currentPermissions.set(all);
    }
  }

  savePermissions() {
    const user = this.selectedUser();
    if (!user) return;

    this.isSaving.set(true);
    const permsArray = Array.from(this.currentPermissions());

    this.adminService.updateAdminPermissions(user.id, permsArray).subscribe({
      next: () => {
        // Update local state
        user.permissions = permsArray;
        // Update in the allUsers array to refresh UI indicators
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
}
