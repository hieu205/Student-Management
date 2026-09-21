import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminResponse } from '../../core/services/admin.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AuthService } from '../../core/auth/auth.service';

interface PermissionItem {
  code: string;
  label: string;
  implicitReads?: string[];
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
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">

      <!-- Left Column: User List -->
      <div class="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden h-[calc(100vh-8rem)]">
        <div class="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-bold text-gray-800 dark:text-slate-100">Tài khoản Admin</h2>
            <button *ngIf="authService.hasPermission('admin:create')" (click)="openAddModal()" class="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              Thêm mới
            </button>
          </div>
          <div class="mt-3 relative">
            <input type="text" [(ngModel)]="searchQuery" (input)="onSearchChange()" placeholder="Tìm kiếm theo tên, email..."
                   class="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400">
            <svg class="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          <!-- Loading skeleton -->
          <div *ngIf="isLoading()" class="space-y-3">
            <div *ngFor="let i of [1,2,3,4]" class="animate-pulse flex items-center p-3 gap-3 border border-gray-50 dark:border-slate-700/50 rounded-xl">
              <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0"></div>
              <div class="flex-1 space-y-2 py-1">
                <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div *ngIf="!isLoading() && filteredUsers().length === 0" class="text-center py-10 px-4">
            <div class="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <p class="text-gray-500 dark:text-slate-400 text-sm">Không tìm thấy tài khoản nào</p>
          </div>

          <!-- User list -->
          <div *ngFor="let user of filteredUsers()"
               (click)="selectUser(user)"
               class="p-4 border border-gray-100 dark:border-slate-700 rounded-xl cursor-pointer transition-all hover:shadow-sm"
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
              <h2 class="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-3">
                {{ selectedUser()!.fullName }}
                <button *ngIf="authService.hasPermission('admin:update')" (click)="openEditModal()" class="text-gray-400 hover:text-orange-500 transition-colors" title="Sửa thông tin">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button *ngIf="authService.hasPermission('admin:delete') && !isSelectedUserSuperAdmin && !isViewingSelf"
                        (click)="openDeleteConfirm()" class="text-gray-400 hover:text-red-500 transition-colors" title="Xóa tài khoản">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </h2>
              <p class="text-gray-500 dark:text-slate-400 mt-1">Username: <span class="font-medium text-gray-700 dark:text-slate-300">{{ selectedUser()!.username }}</span></p>
            </div>
            <div *ngIf="authService.hasPermission('admin_permission:assign')" class="text-right flex gap-2">
               <button (click)="selectAllPermissions()" class="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 dark:text-blue-400 font-medium transition-colors">
                Chọn tất cả
              </button>
              <button (click)="deselectAllPermissions()" class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 font-medium transition-colors">
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

          <!-- Permissions Checkboxes -->
          <div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-50/30 dark:bg-slate-900/30">
            <div *ngFor="let group of groups">
              <h3 class="font-bold text-gray-800 dark:text-slate-200 mb-4 pb-2 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2 text-lg">
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                {{ group.name }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div *ngFor="let item of group.items" class="flex items-start bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700"
                     [ngClass]="{'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-600': hasPermission(item.code)}">
                  <div class="flex items-center h-5">
                    <input type="checkbox"
                           [id]="item.code"
                           [checked]="hasPermission(item.code)"
                           (change)="togglePermission(item)"
                           [disabled]="!authService.hasPermission('admin_permission:assign')"
                           class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                           [class.cursor-pointer]="authService.hasPermission('admin_permission:assign')"
                           [class.cursor-not-allowed]="!authService.hasPermission('admin_permission:assign')">
                  </div>
                  <div class="ml-3 text-sm flex-1">
                    <label [for]="item.code" class="font-medium text-gray-800 dark:text-slate-200 cursor-pointer block select-none">
                      {{ item.label }}
                    </label>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-1 font-mono">{{ item.code }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="authService.hasPermission('admin_permission:assign')" class="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 shrink-0">
            <button (click)="savePermissions()" [disabled]="isSaving()"
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center">
              <svg *ngIf="isSaving()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Lưu thay đổi
            </button>
          </div>
        </ng-container>
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

      <!-- Edit Admin Modal -->
      <div *ngIf="showEditModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div class="fixed inset-0 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity" (click)="closeEditModal()"></div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in-up border border-gray-100 dark:border-slate-700">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Sửa thông tin Admin</h3>
            <button (click)="closeEditModal()" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form (ngSubmit)="submitEditAdmin()" #editForm="ngForm" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Họ và Tên <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="editAdminData.fullName" name="fullName" required class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" [(ngModel)]="editAdminData.email" name="email" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
            </div>
            <div class="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700 mt-6">
              <button type="button" (click)="closeEditModal()" class="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Hủy</button>
              <button type="submit" [disabled]="editForm.invalid || isEditing()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center">
                <svg *ngIf="isEditing()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div *ngIf="showDeleteConfirm()" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div class="fixed inset-0 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity" (click)="closeDeleteConfirm()"></div>
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-fade-in-up border border-gray-100 dark:border-slate-700 p-6 text-center">
          <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Xóa tài khoản</h3>
          <p class="text-gray-500 dark:text-slate-400 mb-6">Bạn có chắc chắn muốn xóa tài khoản <strong>{{ selectedUser()?.fullName }}</strong> không? Hành động này không thể hoàn tác.</p>
          <div class="flex justify-center gap-3">
            <button type="button" (click)="closeDeleteConfirm()" class="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors w-full">Hủy</button>
            <button type="button" (click)="submitDeleteAdmin()" [disabled]="isDeleting()" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center w-full">
              <svg *ngIf="isDeleting()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Xóa ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PermissionManagerComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

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
        this.allUsers.set(data);
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
  }

  hasPermission(code: string): boolean {
    return this.currentPermissions().has(code);
  }

  // Tổng số quyền có trong hệ thống (đếm từ groups)
  get totalPermissionCount(): number {
    return this.groups.reduce((sum, g) => sum + g.items.length, 0);
  }

  // Admin đang xem có phải Admin tổng không (có đủ tất cả quyền)
  get isSelectedUserSuperAdmin(): boolean {
    const user = this.selectedUser();
    if (!user) return false;
    return (user.permissions?.length ?? 0) >= this.totalPermissionCount;
  }

  // Đang xem chính mình không
  get isViewingSelf(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return this.selectedUser()?.id === currentUser?.id;
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
  }

  selectAllPermissions() {
    const all = new Set<string>();
    this.groups.forEach(g => {
      g.items.forEach(i => all.add(i.code));
    });
    this.currentPermissions.set(all);
  }

  deselectAllPermissions() {
    this.currentPermissions.set(new Set());
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
        this.toastService.success('Đã lưu phân quyền thành công!');
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.error('Có lỗi xảy ra khi lưu phân quyền.');
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
          this.toastService.success('Đã tạo tài khoản thành công!');
        },
        error: (err) => {
          this.isAdding.set(false);
          this.toastService.error(err.error?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
        }
    });
  }

  // --- Edit Admin Logics ---
  showEditModal = signal(false);
  isEditing = signal(false);
  editAdminData = { fullName: '', email: '' };

  openEditModal() {
    const user = this.selectedUser();
    if (!user) return;
    this.editAdminData = { fullName: user.fullName, email: user.email || '' };
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  submitEditAdmin() {
    const user = this.selectedUser();
    if (!user || !this.editAdminData.fullName) return;

    this.isEditing.set(true);
    this.adminService.updateAdmin(user.id, this.editAdminData).subscribe({
      next: (updatedAdmin) => {
        // Update list
        const all = [...this.allUsers()];
        const index = all.findIndex(u => u.id === user.id);
        if (index !== -1) {
          // Keep permissions from old object because backend might not return them
          updatedAdmin.permissions = user.permissions;
          all[index] = updatedAdmin;
          this.allUsers.set(all);
          this.selectedUser.set(updatedAdmin);
        }

        this.isEditing.set(false);
        this.closeEditModal();
        this.toastService.success('Cập nhật thông tin Admin thành công!');
      },
      error: (err) => {
        this.isEditing.set(false);
        this.toastService.error(err.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
      }
    });
  }

  // --- Delete Admin Logics ---
  showDeleteConfirm = signal(false);
  isDeleting = signal(false);

  openDeleteConfirm() {
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
  }

  submitDeleteAdmin() {
    const user = this.selectedUser();
    if (!user) return;

    this.isDeleting.set(true);
    this.adminService.deleteAdmin(user.id).subscribe({
      next: () => {
        // Remove from list
        const all = this.allUsers().filter(u => u.id !== user.id);
        this.allUsers.set(all);
        this.selectedUser.set(null); // Clear selection
        this.currentPermissions.set(new Set()); // Clear permissions

        this.isDeleting.set(false);
        this.closeDeleteConfirm();
        this.toastService.success('Đã xóa tài khoản Admin thành công!');
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.toastService.error(err.error?.message || 'Có lỗi xảy ra khi xóa tài khoản.');
      }
    });
  }
}
