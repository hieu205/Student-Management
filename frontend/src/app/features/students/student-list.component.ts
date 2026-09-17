import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/student.model';
import { StudentFormComponent } from './student-form.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterModule, StudentFormComponent],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      <!-- Header & Search -->
      <div class="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800">
        <div>
          <h2 class="text-xl font-bold text-gray-800 dark:text-slate-100">Danh sách Học sinh</h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">Quản lý thông tin học sinh toàn trường</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div class="flex gap-3 w-full sm:w-auto">
            <!-- View Toggle -->
            <div class="flex items-center bg-gray-100 dark:bg-slate-700/50 rounded-lg p-1 shrink-0">
              <button (click)="toggleViewMode('list')" [ngClass]="{'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400': viewMode() === 'list', 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200': viewMode() !== 'list'}" class="p-1.5 rounded-md transition-all focus:outline-none" title="Dạng danh sách">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              </button>
              <button (click)="toggleViewMode('grid')" [ngClass]="{'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400': viewMode() === 'grid', 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200': viewMode() !== 'grid'}" class="p-1.5 rounded-md transition-all focus:outline-none" title="Dạng thẻ (Grid)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              </button>
            </div>

            <!-- Search box -->
            <div class="relative w-full sm:w-64">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white sm:text-sm transition-all"
                placeholder="Tìm theo tên, mã...">
            </div>
          </div>

          <button
            (click)="openAddModal()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center transition-all shadow-sm hover:shadow-md whitespace-nowrap flex-shrink-0">
            <svg class="h-5 w-5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm học sinh
          </button>
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto" *ngIf="viewMode() === 'list'">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead class="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <!-- Sortable Headers -->
              <th scope="col" (click)="toggleSort('studentCode')" class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-blue-400 transition-colors group select-none">
                <div class="flex items-center gap-1">
                  Mã HS
                  <svg *ngIf="sortColumn() !== 'studentCode'" class="w-4 h-4 text-gray-300 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                  <svg *ngIf="sortColumn() === 'studentCode' && sortDirection() === 'asc'" class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                  <svg *ngIf="sortColumn() === 'studentCode' && sortDirection() === 'desc'" class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </th>
              <th scope="col" (click)="toggleSort('fullName')" class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-blue-400 transition-colors group select-none">
                <div class="flex items-center gap-1">
                  Họ và Tên
                  <svg *ngIf="sortColumn() !== 'fullName'" class="w-4 h-4 text-gray-300 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                  <svg *ngIf="sortColumn() === 'fullName' && sortDirection() === 'asc'" class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                  <svg *ngIf="sortColumn() === 'fullName' && sortDirection() === 'desc'" class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </th>
              <th scope="col" (click)="toggleSort('className')" class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-blue-400 transition-colors group select-none">
                <div class="flex items-center gap-1">
                  Lớp
                  <svg *ngIf="sortColumn() !== 'className'" class="w-4 h-4 text-gray-300 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                  <svg *ngIf="sortColumn() === 'className' && sortDirection() === 'asc'" class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                  <svg *ngIf="sortColumn() === 'className' && sortDirection() === 'desc'" class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ngày sinh</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Giới tính</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Phụ huynh đã gán</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
            <tr *ngIf="isLoading()">
              <td colspan="7" class="px-6 py-12 text-center">
                <svg class="animate-spin h-8 w-8 mx-auto text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="mt-3 text-gray-500 dark:text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
              </td>
            </tr>
            <tr *ngIf="!isLoading() && students().length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                <div class="bg-gray-50 dark:bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p class="font-medium text-gray-600 dark:text-slate-300">Không tìm thấy học sinh nào.</p>
              </td>
            </tr>
            <tr *ngFor="let student of students()" class="hover:bg-blue-50 dark:bg-blue-900/20 dark:hover:bg-slate-700/60 transition-all duration-300 group">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 dark:text-slate-300 align-middle">{{ student.studentCode }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold align-middle">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 text-blue-700 dark:text-blue-900 flex items-center justify-center font-bold text-xs shadow-sm">{{ student.fullName.charAt(0) }}</div>
                  {{ student.fullName }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 align-middle">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                  {{ student.className }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300 font-medium align-middle">{{ student.dateOfBirth | date:'dd/MM/yyyy' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300 align-middle">
                <span [ngClass]="student.gender === 'Male' ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/30'" class="px-2.5 py-1 rounded-md text-xs font-semibold">
                  {{ student.gender === 'Male' ? 'Nam' : 'Nữ' }}
                </span>
              </td>
              <td class="px-6 py-2 text-sm text-gray-600 dark:text-slate-300 w-72 align-middle">
                <div *ngIf="!student.parents || student.parents.length === 0" class="text-gray-400 italic text-xs py-2">Chưa liên kết phụ huynh</div>
                <div *ngIf="student.parents && student.parents.length > 0" class="flex flex-col divide-y divide-gray-100 dark:divide-slate-700 w-full">
                  <div *ngFor="let parent of (expandedRows().has(student.id) ? student.parents : (student.parents | slice:0:2))" class="flex items-center gap-3 py-2.5 animate-fade-in-up w-full">
                    <img [src]="'https://ui-avatars.com/api/?name=' + parent.fullName + '&background=random&color=fff&size=128'" alt="Avatar" class="w-8 h-8 rounded-full shadow-sm shrink-0 border border-gray-200 dark:border-slate-600">
                    <div class="flex flex-col overflow-hidden">
                      <span class="font-bold text-sm text-gray-800 dark:text-slate-200 leading-tight truncate">{{ parent.fullName }}</span>
                      <span class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{{ parent.relationshipType === 'Father' ? 'Bố' : (parent.relationshipType === 'Mother' ? 'Mẹ' : (parent.relationshipType === 'Guardian' ? 'Người giám hộ' : (parent.relationshipType || 'Phụ huynh'))) }} - {{ parent.phoneNumber }}</span>
                    </div>
                  </div>
                  <div class="pt-2 pb-1" *ngIf="student.parents.length > 2">
                    <button (click)="toggleRowExpansion(student.id)" class="text-xs text-blue-500 hover:text-blue-700 hover:underline font-medium focus:outline-none">
                      {{ expandedRows().has(student.id) ? 'Thu gọn' : 'Xem thêm' }}
                    </button>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium action-dropdown-container relative align-middle">
                <button (click)="toggleDropdown(student.id, $event)" class="text-gray-400 hover:text-blue-600 dark:text-blue-400 p-2 rounded-full hover:bg-blue-50 dark:bg-blue-900/20 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                </button>

                <div *ngIf="activeDropdown() === student.id" class="absolute right-8 top-10 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 animate-fade-in-up overflow-hidden">
                  <div class="py-1">
                    <a [routerLink]="['/students/detail', student.id]" class="px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors cursor-pointer">
                      <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Chi tiết
                    </a>
                    <button (click)="openEditModal(student.id)" class="w-full px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-orange-500 flex items-center transition-colors cursor-pointer text-left">
                      <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Sửa
                    </button>
                    <div class="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                    <button (click)="confirmDelete(student.id)" class="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center transition-colors text-left">
                      <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Xóa
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grid View -->
      <div class="p-6 bg-gray-50 dark:bg-slate-900/30 min-h-[400px]" *ngIf="viewMode() === 'grid'">
        <div *ngIf="isLoading()" class="flex justify-center items-center h-48">
          <svg class="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div *ngIf="!isLoading() && students().length === 0" class="text-center py-12 text-gray-500 dark:text-slate-400">
          <div class="bg-white dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 dark:border-slate-700">
            <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p class="font-medium text-gray-600 dark:text-slate-300">Không tìm thấy học sinh nào.</p>
        </div>

        <div *ngIf="!isLoading() && students().length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div *ngFor="let student of students()" class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow relative">
            <div class="absolute top-4 right-4 action-dropdown-container">
              <button (click)="toggleDropdown(student.id, $event)" class="text-gray-400 hover:text-blue-600 dark:text-blue-400 focus:outline-none">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
              </button>
              <div *ngIf="activeDropdown() === student.id" class="absolute right-0 top-6 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 animate-fade-in-up text-left overflow-hidden">
                <div class="py-1">
                  <a [routerLink]="['/students/detail', student.id]" class="px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center">Chi tiết</a>
                  <button (click)="openEditModal(student.id)" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-orange-500 flex items-center">Sửa</button>
                  <button (click)="confirmDelete(student.id)" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center">Xóa</button>
                </div>
              </div>
            </div>

            <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 text-blue-700 dark:text-blue-900 flex items-center justify-center font-bold text-3xl shadow-sm mb-4 border-4 border-white dark:border-slate-800 outline outline-gray-100 dark:outline-slate-700">{{ student.fullName.charAt(0) }}</div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ student.fullName }}</h3>
            <p class="text-blue-600 dark:text-blue-400 font-medium text-sm mb-4">{{ student.studentCode }}</p>

            <div class="w-full space-y-2 text-sm text-left border-t border-gray-100 dark:border-slate-700 pt-4 mb-5">
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-slate-400">Giới tính:</span>
                <span class="font-medium text-gray-700 dark:text-slate-200">{{ student.gender === 'Male' ? 'Nam' : 'Nữ' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-slate-400">Lớp:</span>
                <span class="font-medium text-gray-700 dark:text-slate-200">{{ student.className }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-slate-400">Ngày sinh:</span>
                <span class="font-medium text-gray-700 dark:text-slate-200">{{ student.dateOfBirth | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <a [routerLink]="['/students/detail', student.id]" class="mt-auto px-5 py-2 w-full rounded-full border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-slate-900 transition-colors font-medium">Chi tiết </a>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-900">
        <div class="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-slate-300">
              Hiển thị <span class="font-medium">{{ students().length }}</span> trên tổng số <span class="font-medium">{{ totalCount() }}</span> học sinh
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                [disabled]="currentPage() === 1"
                (click)="changePage(currentPage() - 1)"
                class="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Trước
              </button>
              <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-600 dark:text-blue-400">
                {{ currentPage() }}
              </button>
              <button
                [disabled]="students().length < pageSize"
                (click)="changePage(currentPage() + 1)"
                class="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Sau
              </button>
            </nav>
          </div>
        </div>
      </div>

      <style>
        .animate-fade-in-up {
          animation: fadeInUp 0.2s ease-out;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </div>

    <!-- Add Modal Overlay -->
    <div *ngIf="isAddModalOpen()" class="fixed inset-0 z-[100] flex items-start justify-center pt-10 pb-10 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div class="w-full max-w-3xl px-4 animate-fade-in-down" (click)="$event.stopPropagation()">
        <app-student-form
          [isModal]="true"
          (saved)="onAddModalSaved()"
          (cancelled)="closeAddModal()">
        </app-student-form>
      </div>
    </div>

    <!-- Edit Modal Overlay -->
    <div *ngIf="isEditModalOpen()" class="fixed inset-0 z-[100] flex items-start justify-center pt-10 pb-10 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div class="w-full max-w-3xl px-4 animate-fade-in-down" (click)="$event.stopPropagation()">
        <app-student-form
          [studentId]="editingStudentId()"
          [isModal]="true"
          (saved)="onModalSaved()"
          (cancelled)="closeEditModal()">
        </app-student-form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="deleteStudentId() !== null" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up border border-gray-100 dark:border-slate-700">
        <div class="p-6">
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
            <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Xác nhận xóa học sinh</h3>
          <p class="text-sm text-gray-500 dark:text-slate-400 text-center mb-6">Hành động này không thể hoàn tác. Toàn bộ dữ liệu của học sinh này sẽ bị xóa vĩnh viễn.</p>
          <div class="flex items-center justify-center gap-3">
            <button (click)="cancelDelete()" class="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
              Hủy bỏ
            </button>
            <button (click)="executeDelete()" class="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors">
              Xóa dữ liệu
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentListComponent implements OnInit {
  private studentService = inject(StudentService);

  students = signal<Student[]>([]);
  totalCount = signal(0);
  isLoading = signal(true);

  currentPage = signal(1);
  pageSize = 8;
  searchTerm = '';

  viewMode = signal<'list' | 'grid'>('list');

  // Modals state
  isAddModalOpen = signal(false);
  isEditModalOpen = signal(false);
  editingStudentId = signal<number | null>(null);
  deleteStudentId = signal<number | null>(null);

  // Sorting
  sortColumn = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Dropdown
  activeDropdown = signal<number | null>(null);

  // Merged view expansion
  expandedRows = signal<Set<number>>(new Set());

  toggleRowExpansion(studentId: number) {
    const current = new Set(this.expandedRows());
    if (current.has(studentId)) {
      current.delete(studentId);
    } else {
      current.add(studentId);
    }
    this.expandedRows.set(current);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-dropdown-container')) {
      this.activeDropdown.set(null);
    }
  }

  toggleViewMode(mode: 'list' | 'grid') {
    this.viewMode.set(mode);
  }

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.isLoading.set(true);
    this.studentService.getStudents(this.currentPage(), this.pageSize, this.searchTerm, this.sortColumn(), this.sortDirection())
      .subscribe({
        next: (res) => {
          this.students.set(res.items);
          this.totalCount.set(res.totalCount);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Lỗi khi tải danh sách học sinh:', err);
          this.isLoading.set(false);
          this.students.set([]);
          alert('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại!');
        }
      });
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadStudents();
  }

  changePage(page: number) {
    if (page >= 1) {
      this.currentPage.set(page);
      this.loadStudents();
    }
  }

  toggleDropdown(id: number, event: Event) {
    event.stopPropagation();
    if (this.activeDropdown() === id) {
      this.activeDropdown.set(null);
    } else {
      this.activeDropdown.set(id);
    }
  }

  toggleSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.loadStudents();
  }


  // --- Modals Logic ---

  openAddModal() {
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
  }

  onAddModalSaved() {
    this.closeAddModal();
    this.loadStudents();
  }

  openEditModal(id: number) {
    this.activeDropdown.set(null);
    this.editingStudentId.set(id);
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    setTimeout(() => {
      this.editingStudentId.set(null);
    }, 300);
  }

  onModalSaved() {
    this.closeEditModal();
    this.loadStudents();
  }

  confirmDelete(id: number) {
    this.activeDropdown.set(null);
    this.deleteStudentId.set(id);
  }

  cancelDelete() {
    this.deleteStudentId.set(null);
  }

  executeDelete() {
    const id = this.deleteStudentId();
    if (id !== null) {
      this.studentService.deleteStudent(id).subscribe({
        next: () => {
          this.deleteStudentId.set(null);
          this.loadStudents();
        },
        error: (err) => {
          console.error(err);
          this.deleteStudentId.set(null);
          alert('Không thể xóa học sinh này.');
        }
      });
    }
  }
}
