import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminResponse } from '../../core/services/admin.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { RoleService } from '../../core/services/role.service';
import { Role } from '../../core/models/role.model';
import { PERMISSION_GROUPS, PermissionGroup, PermissionItem } from '../../core/constants/permission.constants';

@Component({
  selector: 'app-permission-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto flex flex-col gap-6">

      <div *ngIf="authService.hasPermission('admin:read')" class="flex flex-col md:flex-row gap-6 w-full">
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

            <!-- Roles Accordion -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/30 dark:bg-slate-900/30">

              <div *ngFor="let role of allRoles()" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-200" [ngClass]="{'ring-2 ring-blue-500': expandedRoleId === role.id}">
                <!-- Card Header -->
                <div class="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" (click)="toggleRole(role.id)">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100">{{ role.name }}</h3>
                    <p class="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{{ role.description || 'Không có mô tả' }} • <span class="font-medium text-blue-600 dark:text-blue-400">{{ role.permissions.length || 0 }} quyền gốc</span></p>
                  </div>
                  <div class="flex items-center gap-4">
                    <button *ngIf="authService.hasPermission('admin_permission:assign')"
                            (click)="applyRole(role); $event.stopPropagation()"
                            class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                      Áp dụng nhóm
                    </button>
                    <div class="p-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 transition-transform duration-200" [ngClass]="{'rotate-180': expandedRoleId === role.id}">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <!-- Card Body (Full Permissions List) -->
                <div *ngIf="expandedRoleId === role.id" class="border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900 p-6 space-y-6">

                  <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                    <p class="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Lưu ý:</strong> Dưới đây là TẤT CẢ quyền trên hệ thống.
                      Các quyền được tick là quyền hiện tại của tài khoản <strong>{{ selectedUser()!.username }}</strong>.
                      Bạn có thể tick thêm quyền ngoài nhóm nếu muốn.
                    </p>
                  </div>

                  <div *ngFor="let group of groups">
                    <h4 class="font-bold text-gray-800 dark:text-slate-200 mb-3 flex items-center gap-2 text-md">
                      <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                      {{ group.name }}
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div *ngFor="let item of group.items" class="flex items-start bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700"
                           [ngClass]="hasPermission(item.code) ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-600' : 'border-gray-200 dark:border-slate-700'">
                        <div class="flex items-center h-5 mt-0.5">
                          <input type="checkbox"
                                 [id]="role.id + '_' + item.code"
                                 [checked]="hasPermission(item.code)"
                                 (change)="togglePermission(item)"
                                 [disabled]="!authService.hasPermission('admin_permission:assign')"
                                 class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer">
                        </div>
                        <div class="ml-3 text-sm">
                          <label [for]="role.id + '_' + item.code" class="font-medium text-gray-900 dark:text-slate-200 cursor-pointer block">{{ item.label }}</label>
                          <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-mono">{{ item.code }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Empty Roles State -->
              <div *ngIf="allRoles().length === 0" class="flex flex-col items-center justify-center p-8 text-gray-400">
                <p>Chưa có nhóm quyền nào được tạo.</p>
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
      </div>

      <div *ngIf="!authService.hasPermission('admin:read')" class="w-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[400px]">
        <div class="bg-gray-50 dark:bg-slate-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
          <svg class="h-10 w-10 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">Không có quyền xem danh sách</h3>
        <p class="text-gray-500 dark:text-slate-400 max-w-md mx-auto text-center">Tài khoản của bạn không được cấp quyền xem danh sách Admin. Bạn chỉ có thể thực hiện thao tác Thêm mới nếu được phân quyền.</p>
        <button *ngIf="authService.hasPermission('admin:create')" (click)="openAddModal()" class="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Thêm Admin mới
        </button>
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
              <input type="text" [(ngModel)]="newAdmin.fullName" name="fullName" required [pattern]="fullNameRegex" #addFullName="ngModel" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" [ngClass]="{'border-red-500': addFullName.invalid && (addFullName.dirty || addFullName.touched)}">
              <p *ngIf="addFullName.invalid && (addFullName.dirty || addFullName.touched)" class="text-red-500 text-xs mt-1">Họ tên không được chứa số và ký tự đặc biệt</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tên đăng nhập (Username) <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="newAdmin.username" name="username" required class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email <span class="text-red-500">*</span></label>
              <input type="email" [(ngModel)]="newAdmin.email" name="email" required pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov|io|biz|info)$" #addEmail="ngModel" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" [ngClass]="{'border-red-500': addEmail.invalid && (addEmail.dirty || addEmail.touched)}">
              <p *ngIf="addEmail.invalid && (addEmail.dirty || addEmail.touched)" class="text-red-500 text-xs mt-1">Email không hợp lệ (VD: @gmail.com)</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mật khẩu khởi tạo <span class="text-red-500">*</span></label>
              <div class="relative">
                <input [type]="showAddPassword() ? 'text' : 'password'" [(ngModel)]="newAdmin.password" name="password" required [pattern]="passwordRegex" #addPassword="ngModel" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors pr-10" [ngClass]="{'border-red-500': addPassword.invalid && (addPassword.dirty || addPassword.touched)}">
                <button type="button" (click)="toggleAddPassword()" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                  <svg *ngIf="!showAddPassword()" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showAddPassword()" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <p *ngIf="addPassword.invalid && (addPassword.dirty || addPassword.touched)" class="text-red-500 text-xs mt-1">Mật khẩu phải bắt đầu bằng chữ hoa, có số, ký tự đặc biệt và dài tối thiểu 6 ký tự</p>
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
              <input type="text" [(ngModel)]="editAdminData.fullName" name="fullName" required [pattern]="fullNameRegex" #editFullName="ngModel" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" [ngClass]="{'border-red-500': editFullName.invalid && (editFullName.dirty || editFullName.touched)}">
              <p *ngIf="editFullName.invalid && (editFullName.dirty || editFullName.touched)" class="text-red-500 text-xs mt-1">Họ tên không được chứa số và ký tự đặc biệt</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" [(ngModel)]="editAdminData.email" name="email" pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov|io|biz|info)$" #editEmail="ngModel" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" [ngClass]="{'border-red-500': editEmail.invalid && (editEmail.dirty || editEmail.touched)}">
              <p *ngIf="editEmail.invalid && (editEmail.dirty || editEmail.touched)" class="text-red-500 text-xs mt-1">Email không hợp lệ (VD: @gmail.com)</p>
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
      <!-- Delete Admin Modal -->
      <div *ngIf="showDeleteConfirm()" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
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
              Xóa
            </button>
          </div>
        </div>
      </div>

      <!-- Apply Role Modal -->
      <div *ngIf="showApplyRoleConfirm()" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
        <div class="fixed inset-0 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity" (click)="closeApplyRoleConfirm()"></div>
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-fade-in-up border border-gray-100 dark:border-slate-700 p-6 text-center">
          <div class="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-500">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Áp dụng nhóm quyền</h3>
          <p class="text-gray-500 dark:text-slate-400 mb-6">Bạn có muốn áp dụng các quyền từ nhóm <strong>"{{ roleToApply()?.name }}"</strong> cho người dùng này không? (Các quyền hiện tại sẽ bị ghi đè)</p>
          <div class="flex justify-center gap-3">
            <button type="button" (click)="closeApplyRoleConfirm()" class="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors w-full">Hủy</button>
            <button type="button" (click)="submitApplyRole()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors w-full">
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PermissionManagerComponent implements OnInit {
  private adminService = inject(AdminService);
  private roleService = inject(RoleService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  allUsers = signal<AdminResponse[]>([]);
  allRoles = signal<Role[]>([]);
  searchQuery = signal<string>('');

  expandedRoleId: number | null = null;

  filteredUsers = computed(() => {
    // Luôn ẩn tài khoản admin tổng có id = 1 (Tài khoản root tạo đầu tiên)
    const usersWithoutSuperAdmin = this.allUsers().filter(u => u.id !== 1);

    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return usersWithoutSuperAdmin;

    return usersWithoutSuperAdmin.filter(u =>
      u.fullName.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query)
    );
  });

  currentPermissions = signal<Set<string>>(new Set());
  groups = PERMISSION_GROUPS;

  toggleRole(roleId: number) {
    if (this.expandedRoleId === roleId) {
      this.expandedRoleId = null;
    } else {
      this.expandedRoleId = roleId;
    }
  }

  isLoading = signal(false);
  isSaving = signal(false);
  isAdding = signal(false);
  showSuccessMsg = signal(false);
  showAddModal = signal(false);
  showAddPassword = signal(false);

  fullNameRegex = '^[a-zA-Z_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\\s]+$';
  passwordRegex = '^[A-Z](?=.*[0-9])(?=.*[!@#$%^&*()_+{}\\[\\]:;"\'<>,.?/~`|\\\\-]).{5,}$';

  newAdmin = {
    fullName: '',
    username: '',
    email: '',
    password: ''
  };

  selectedUser = signal<AdminResponse | null>(null);


  ngOnInit() {
    if (this.authService.hasPermission('admin:read')) {
      this.loadUsers();
    }
    if (this.authService.hasPermission('role:read')) {
      this.loadRoles();
    }
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.allRoles.set(data);
      },
      error: () => {
        this.toastService.error('Không thể tải danh sách Nhóm quyền');
      }
    });
  }

  showApplyRoleConfirm = signal<boolean>(false);
  roleToApply = signal<Role | null>(null);

  applyRole(role: Role) {
    if (!this.selectedUser()) return;
    this.roleToApply.set(role);
    this.showApplyRoleConfirm.set(true);
  }

  closeApplyRoleConfirm() {
    this.showApplyRoleConfirm.set(false);
    this.roleToApply.set(null);
  }

  submitApplyRole() {
    const role = this.roleToApply();
    if (!role) return;

    const permCodes = new Set(role.permissions.map(p => p.code) || []);
    this.currentPermissions.set(permCodes);
    this.closeApplyRoleConfirm();
    this.toastService.success(`Đã áp dụng quyền từ nhóm ${role.name}. Vui lòng bấm Lưu thay đổi để xác nhận.`);
  }

  loadUsers() {
    if (!this.authService.hasPermission('admin:read')) return;
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
    } else {
      // Check
      current.add(item.code);
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
    this.showAddPassword.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  toggleAddPassword() {
    this.showAddPassword.set(!this.showAddPassword());
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

          // Xử lý lỗi validation từ .NET (ValidationProblemDetails)
          if (err.status === 400 && err.error?.errors) {
            const errors = err.error.errors;
            let errorMessages = [];
            for (const key in errors) {
              if (errors.hasOwnProperty(key)) {
                errorMessages.push(...errors[key]);
              }
            }
            if (errorMessages.length > 0) {
              this.toastService.error(errorMessages.join('\n'));
              return;
            }
          }

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

        // Xử lý lỗi validation từ .NET (ValidationProblemDetails)
        if (err.status === 400 && err.error?.errors) {
          const errors = err.error.errors;
          let errorMessages = [];
          for (const key in errors) {
            if (errors.hasOwnProperty(key)) {
              errorMessages.push(...errors[key]);
            }
          }
          if (errorMessages.length > 0) {
            this.toastService.error(errorMessages.join('\n'));
            return;
          }
        }

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
