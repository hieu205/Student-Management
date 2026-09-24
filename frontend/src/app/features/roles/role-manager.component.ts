import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { Role, RoleRequest, Permission } from '../../core/models/role.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSION_GROUPS, PermissionGroup, PermissionItem } from '../../core/constants/permission.constants';

@Component({
  selector: 'app-role-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto flex flex-col gap-6">

      <div *ngIf="authService.hasPermission('role:read')" class="flex flex-col md:flex-row gap-6 w-full">
        <!-- Left Column: Role List -->
        <div class="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden h-[calc(100vh-8rem)]">
          <div class="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-bold text-gray-800 dark:text-slate-100">Danh sách Nhóm Quyền</h2>
              <button *ngIf="authService.hasPermission('role:manage')" (click)="openAddModal()" class="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Thêm mới
              </button>
            </div>
            <div class="mt-3 relative">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Tìm kiếm tên nhóm..."
                     class="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400">
              <svg class="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <!-- Loading skeleton -->
            <div *ngIf="isLoading()" class="space-y-3">
              <div *ngFor="let i of [1,2,3]" class="animate-pulse flex items-center p-3 gap-3 border border-gray-50 dark:border-slate-700/50 rounded-xl">
                <div class="flex-1 space-y-2 py-1">
                  <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>

            <!-- Role Items -->
            <ng-container *ngIf="!isLoading()">
              <div *ngFor="let role of filteredRoles()"
                   (click)="selectRole(role)"
                   class="group flex items-center p-3 gap-3 rounded-xl cursor-pointer transition-all duration-200 border"
                   [ngClass]="selectedRole()?.id === role.id ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate flex items-center gap-2">
                    {{ role.name }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                    {{ role.description || 'Không có mô tả' }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold rounded-full whitespace-nowrap">
                    {{ role.permissions.length || 0 }} quyền
                  </span>
                </div>
              </div>

              <!-- Empty state -->
              <div *ngIf="filteredRoles().length === 0" class="flex flex-col items-center justify-center h-32 text-center px-4">
                <svg class="w-8 h-8 text-gray-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                <p class="text-sm text-gray-500 dark:text-slate-400 font-medium">Không tìm thấy nhóm quyền nào</p>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Right Column: Role Details & Permissions -->
        <div class="w-full md:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[calc(100vh-8rem)]">
          <div *ngIf="!selectedRole() && !isEditing()" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 p-8 text-center">
            <svg class="w-16 h-16 mb-4 text-gray-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <p class="text-lg font-medium text-gray-600 dark:text-slate-300">Chọn một nhóm để xem chi tiết</p>
            <p class="text-sm mt-1">Hoặc bấm "Thêm mới" để tạo nhóm quyền mới</p>
          </div>

          <div *ngIf="selectedRole() || isEditing()" class="flex flex-col h-full overflow-hidden">
            <!-- Header -->
            <div class="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-start bg-white dark:bg-slate-800 shrink-0">
              <div class="flex-1" *ngIf="!isEditing()">
                <div class="flex items-center gap-3">
                  <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ selectedRole()?.name }}</h2>
                  <button *ngIf="authService.hasPermission('role:manage')" (click)="startEditing()" class="text-gray-400 hover:text-blue-600 transition-colors" title="Sửa tên/mô tả nhóm">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button *ngIf="authService.hasPermission('role:manage')" (click)="deleteRole(selectedRole()!)" class="text-gray-400 hover:text-red-600 transition-colors" title="Xóa nhóm">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
                <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">{{ selectedRole()?.description || 'Không có mô tả' }}</p>
              </div>

              <!-- Edit Form -->
              <div class="flex-1 w-full" *ngIf="isEditing()">
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tên Nhóm <span class="text-red-500">*</span></label>
                    <input type="text" [(ngModel)]="editForm.name" placeholder="VD: Quản trị viên chi nhánh"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-700 dark:text-white">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Mô tả</label>
                    <input type="text" [(ngModel)]="editForm.description" placeholder="Nhập mô tả ngắn gọn..."
                           class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-700 dark:text-white">
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end gap-2 shrink-0 ml-4">
                <div class="flex gap-2">
                  <button (click)="selectAll()" class="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded transition-colors">
                    Chọn tất cả
                  </button>
                  <button (click)="deselectAll()" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded transition-colors">
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>
            </div>

            <!-- Permissions List -->
            <div class="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50 dark:bg-slate-800/50">
              <div class="space-y-6">
                <div *ngFor="let group of groups" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <!-- Group Header -->
                  <div class="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
                    <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <h3 class="text-sm font-bold text-gray-800 dark:text-slate-200">{{ group.name }}</h3>
                  </div>
                  <!-- Group Items -->
                  <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label *ngFor="let item of group.items"
                           class="flex items-start p-3 rounded-lg border cursor-pointer transition-all duration-200"
                           [ngClass]="hasPermission(item.code) ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-600'">
                      <div class="flex-shrink-0 mt-0.5">
                        <input type="checkbox"
                               [checked]="hasPermission(item.code)"
                               (change)="togglePermission(item, $event)"
                               class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer">
                      </div>
                      <div class="ml-3">
                        <span class="block text-sm font-medium text-gray-900 dark:text-slate-200">{{ item.label }}</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div *ngIf="hasChanges() || isEditing()" class="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 shrink-0">
              <button (click)="cancelChanges()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                Hủy bỏ
              </button>
              <button (click)="saveChanges()"
                      [disabled]="isSaving()"
                      class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg *ngIf="isSaving()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Lưu Nhóm Quyền
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Role Modal -->
    <div *ngIf="showDeleteConfirm()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" (click)="closeDeleteConfirm()"></div>
      <div class="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div class="p-6 text-center">
          <div class="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/20 mb-4 mx-auto">
            <svg class="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Xóa Nhóm Quyền</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Bạn có chắc chắn muốn xóa nhóm quyền <span class="font-bold text-white">"{{ roleToDelete()?.name }}"</span> không? Hành động này không thể hoàn tác.
          </p>
        </div>
        <div class="px-6 pb-6 flex gap-3">
          <button (click)="closeDeleteConfirm()"
                  class="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">
            Hủy
          </button>
          <button (click)="confirmDeleteRole()" [disabled]="isDeleting()"
                  class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <svg *ngIf="isDeleting()" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Xóa
          </button>
        </div>
      </div>
    </div>
  `
})
export class RoleManagerComponent implements OnInit {
  public authService = inject(AuthService);
  private roleService = inject(RoleService);
  private toast = inject(ToastService);

  allRoles = signal<Role[]>([]);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showDeleteConfirm = signal<boolean>(false);
  roleToDelete = signal<Role | null>(null);
  isDeleting = signal<boolean>(false);

  searchQuery = '';
  selectedRole = signal<Role | null>(null);
  currentPermissions = signal<Set<string>>(new Set());
  originalPermissions = signal<Set<string>>(new Set());

  editForm = {
    name: '',
    description: ''
  };

  groups = PERMISSION_GROUPS;
  permissionDictionary: { [code: string]: number } = {};

  filteredRoles = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.allRoles().filter(r => r.name.toLowerCase().includes(q));
  });

  ngOnInit() {
    if (this.authService.hasPermission('role:read')) {
      this.loadRoles();
      this.loadPermissions();
    }
  }

  loadPermissions() {
    this.roleService.getAllPermissions().subscribe({
      next: (perms) => {
        perms.forEach(p => {
          this.permissionDictionary[p.code] = p.id;
        });
      },
      error: () => {
        this.toast.error('Không thể tải danh mục quyền từ máy chủ');
      }
    });
  }

  loadRoles() {
    if (!this.authService.hasPermission('role:read')) return;
    this.isLoading.set(true);
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.allRoles.set(data);
        this.isLoading.set(false);
        const selected = this.selectedRole();
        if (selected) {
          const fresh = data.find(r => r.id === selected.id);
          if (fresh) {
            this.selectRole(fresh);
          } else {
            this.selectedRole.set(null);
            this.isEditing.set(false);
          }
        }
      },
      error: () => {
        this.toast.error('Lỗi khi tải danh sách nhóm quyền');
        this.isLoading.set(false);
      }
    });
  }

  selectRole(role: Role) {
    this.selectedRole.set(role);
    this.isEditing.set(false);
    const permCodes = new Set(role.permissions?.map(p => p.code) || []);
    this.currentPermissions.set(new Set(permCodes));
    this.originalPermissions.set(new Set(permCodes));
  }

  openAddModal() {
    this.selectedRole.set(null);
    this.isEditing.set(true);
    this.editForm = { name: '', description: '' };
    this.currentPermissions.set(new Set());
    this.originalPermissions.set(new Set());
  }

  startEditing() {
    const role = this.selectedRole();
    if (!role) return;
    this.isEditing.set(true);
    this.editForm = {
      name: role.name,
      description: role.description || ''
    };
  }

  hasPermission(code: string): boolean {
    return this.currentPermissions().has(code);
  }

  togglePermission(item: PermissionItem, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const newSet = new Set(this.currentPermissions());
    if (isChecked) {
      newSet.add(item.code);
    } else {
      newSet.delete(item.code);
    }
    this.currentPermissions.set(newSet);
  }

  selectAll() {
    const newSet = new Set<string>();
    this.groups.forEach(g => {
      g.items.forEach(i => newSet.add(i.code));
    });
    this.currentPermissions.set(newSet);
  }

  deselectAll() {
    this.currentPermissions.set(new Set());
  }

  hasChanges(): boolean {
    if (this.isEditing()) return true;
    const current = this.currentPermissions();
    const original = this.originalPermissions();
    if (current.size !== original.size) return true;
    for (const item of current) {
      if (!original.has(item)) return true;
    }
    return false;
  }

  cancelChanges() {
    this.isEditing.set(false);
    if (this.selectedRole()) {
      this.currentPermissions.set(new Set(this.originalPermissions()));
    }
  }

  deleteRole(role: Role) {
    this.roleToDelete.set(role);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.roleToDelete.set(null);
  }

  confirmDeleteRole() {
    const role = this.roleToDelete();
    if (!role) return;

    this.isDeleting.set(true);
    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.toast.success('Xóa nhóm quyền thành công');
        this.allRoles.update(roles => roles.filter(r => r.id !== role.id));
        if (this.selectedRole()?.id === role.id) {
          this.selectedRole.set(null);
          this.isEditing.set(false);
          this.currentPermissions.set(new Set());
        }
        this.closeDeleteConfirm();
        this.isDeleting.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Có lỗi xảy ra khi xóa nhóm quyền');
        this.isDeleting.set(false);
      }
    });
  }

  saveChanges() {
    const roleId = this.selectedRole()?.id;
    const isNew = !roleId && this.isEditing();

    if (isNew && !this.editForm.name.trim()) {
      this.toast.error('Vui lòng nhập tên nhóm');
      return;
    }

    const currentCodes = Array.from(this.currentPermissions());
    const permissionIds = currentCodes
      .map(code => this.permissionDictionary[code])
      .filter(id => id !== undefined && id > 0);

    const payload: RoleRequest = {
      name: this.isEditing() ? this.editForm.name : this.selectedRole()!.name,
      description: this.isEditing() ? this.editForm.description : (this.selectedRole()!.description || ''),
      permissionIds: permissionIds
    };

    this.isSaving.set(true);

    if (isNew) {
      this.roleService.createRole(payload).subscribe({
        next: () => {
          this.toast.success('Thêm nhóm quyền thành công');
          this.isSaving.set(false);
          this.isEditing.set(false);
          this.loadRoles();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Lỗi khi thêm nhóm');
          this.isSaving.set(false);
        }
      });
    } else if (roleId) {
      this.roleService.updateRole(roleId, payload).subscribe({
        next: () => {
          this.toast.success('Cập nhật nhóm quyền thành công');
          this.isSaving.set(false);
          this.isEditing.set(false);
          this.loadRoles();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Lỗi khi cập nhật nhóm');
          this.isSaving.set(false);
        }
      });
    }
  }
}
