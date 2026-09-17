import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="relative min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-700 bg-cover bg-center bg-no-repeat"
         style="background-image: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTY5ogHdZlDYIK5YxJAFfNcBezIDBTuG5bO1Fb5R-XLrw&s=10');">
      <!-- Giảm độ mờ (opacity) xuống 30% thay vì 60% và giữ lớp blur nhẹ -->
      <div class="absolute inset-0 bg-blue-900/30 backdrop-blur-[2px]"></div>

      <div class="bg-white dark:bg-slate-800/95 p-8 rounded-2xl shadow-2xl w-[26rem] relative z-10 border border-white/20">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-slate-100">Hệ thống Quản lý</h2>
          <p class="text-gray-500 dark:text-slate-400 text-sm mt-1">Đăng nhập dành cho Quản trị viên</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Username -->
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2" for="username">Tài khoản <span class="text-red-500">*</span></label>
            <input formControlName="username"
              class="shadow-sm appearance-none border rounded-lg w-full py-2.5 px-3 bg-white dark:bg-slate-700 text-gray-700 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              [ngClass]="{'border-red-500': f['username'].invalid && (f['username'].dirty || f['username'].touched || submitted())}"
              id="username" type="text" placeholder="Tên đăng nhập">

            <div *ngIf="f['username'].invalid && (f['username'].dirty || f['username'].touched || submitted())" class="text-red-500 text-xs mt-1 font-medium">
              <span *ngIf="f['username'].errors?.['required']">Vui lòng nhập tài khoản.</span>
              <span *ngIf="f['username'].errors?.['minlength']">Tài khoản phải dài tối thiểu 5 ký tự.</span>
            </div>
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2" for="password">Mật khẩu <span class="text-red-500">*</span></label>
            <div class="relative">
              <input formControlName="password"
                class="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-3 pr-10 bg-white dark:bg-slate-700 text-gray-700 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                [ngClass]="{'border-red-500': f['password'].invalid && (f['password'].dirty || f['password'].touched || submitted())}"
                id="password" [type]="showPassword ? 'text' : 'password'" placeholder="******">
              <button type="button" (click)="showPassword = !showPassword" tabindex="-1"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:text-blue-400 focus:outline-none">
                <!-- Eye Icon -->
                <svg *ngIf="!showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye Slash Icon -->
                <svg *ngIf="showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>

            <div *ngIf="f['password'].invalid && (f['password'].dirty || f['password'].touched || submitted())" class="text-red-500 text-xs mt-1 font-medium">
              <span *ngIf="f['password'].errors?.['required']">Vui lòng nhập mật khẩu.</span>
              <span *ngIf="f['password'].errors?.['pattern']">Mật khẩu phải từ 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt (@$!%*?&).</span>
            </div>
          </div>

          <!-- Options -->
          <div class="flex items-center justify-between mb-6">
            <label class="flex items-center cursor-pointer group">
              <input type="checkbox" formControlName="rememberMe" class="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 transition duration-150 ease-in-out border-gray-300 dark:border-slate-600 rounded cursor-pointer">
              <span class="ml-2 text-sm text-gray-600 dark:text-slate-300 group-hover:text-blue-600 dark:text-blue-400 transition-colors">Ghi nhớ đăng nhập</span>
            </label>
            <a href="javascript:void(0)" (click)="showForgotPassword = true" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-300 hover:underline transition-colors font-medium">
              Quên mật khẩu?
            </a>
          </div>

          <!-- Error message from server -->
          <div *ngIf="errorMessage()" class="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm flex items-center font-medium shadow-sm">
            <svg class="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
            {{ errorMessage() }}
          </div>

          <!-- Submit Button -->
          <div>
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 w-full flex justify-center items-center transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              type="submit" [disabled]="isLoading()">
              <svg *ngIf="isLoading()" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading() ? 'Đang xử lý...' : 'Đăng nhập' }}</span>
            </button>
          </div>

          <!-- Social Login -->
          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200 dark:border-slate-700"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 text-gray-500 dark:text-slate-400 font-medium">Hoặc đăng nhập với</span>
              </div>
            </div>

            <button type="button" (click)="loginWithGoogle()" class="mt-4 w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>
        </form>

        <!-- GOOGLE LOGIN DEMO MODAL -->
        <div *ngIf="showGoogleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" (click)="googleModalStep === 'done' && closeGoogleModal()"></div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-fade-in-up">
            <!-- Header -->
            <div class="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-600 flex items-center gap-3">
              <svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="font-semibold text-gray-700 dark:text-slate-200 text-sm">Đăng nhập với Google</span>
            </div>

            <div class="p-6">
              <!-- Bước 1: Đang kết nối -->
              <div *ngIf="googleModalStep === 'loading'" class="text-center py-4">
                <div class="flex justify-center mb-4">
                  <svg class="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p class="text-gray-700 dark:text-slate-200 font-semibold">Đang kết nối tới Google...</p>
                <p class="text-gray-400 dark:text-slate-400 text-sm mt-1">Vui lòng chờ trong giây lát</p>
              </div>

              <!-- Bước 2: Đã gửi mail -->
              <div *ngIf="googleModalStep === 'done'" class="text-center">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 class="text-gray-800 dark:text-slate-100 font-bold text-base mb-2">Đã gửi thông báo xác nhận!</h3>
                <p class="text-gray-500 dark:text-slate-400 text-sm mb-1">Một liên kết đăng nhập đã được gửi tới</p>
                <p class="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-5">admin&#64;gmail.com</p>

                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 text-left mb-5">
                  <p class="text-yellow-800 dark:text-yellow-300 text-xs font-medium flex items-start gap-1.5">
                    <svg class="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    Đây là chế độ Demo. Thực tế cần cấu hình OAuth2 / Firebase Authentication ở Backend.
                  </p>
                </div>

                <button (click)="closeGoogleModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-md text-sm">
                  Đã hiểu, quay lại đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FORGOT PASSWORD MODAL -->
      <div *ngIf="showForgotPassword" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" (click)="closeForgotPassword()"></div>

        <!-- Modal Content -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 transform transition-all overflow-hidden animate-fade-in-up">
          <div class="p-6">
            <div class="flex justify-between items-center mb-5 border-b border-gray-100 dark:border-slate-700 pb-3">
              <h3 class="text-xl font-bold text-gray-800 dark:text-slate-100">Khôi phục mật khẩu</h3>
              <button (click)="closeForgotPassword()" class="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <!-- Bước 1: Nhập Email -->
            <div *ngIf="forgotStep === 1">
              <p class="text-sm text-gray-600 dark:text-slate-300 mb-4">Vui lòng nhập địa chỉ email đã đăng ký của bạn. Hệ thống sẽ gửi mã OTP gồm 6 chữ số để xác thực.</p>
              <div class="mb-4">
                <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Địa chỉ Email <span class="text-red-500">*</span></label>
                <input type="email" [(ngModel)]="resetEmail" class="shadow-sm appearance-none border rounded-lg w-full py-2.5 px-3 bg-white dark:bg-slate-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="example@gmail.com">
              </div>
              <button (click)="sendOtp()" [disabled]="!resetEmail || isSendingOtp" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-70 flex justify-center items-center shadow-md">
                <svg *ngIf="isSendingOtp" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Gửi mã xác thực
              </button>
            </div>

            <!-- Bước 2: Nhập OTP & Đổi Pass -->
            <div *ngIf="forgotStep === 2">
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4 flex items-start gap-2">
                <svg class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Mã xác thực đã được gửi tới <b>{{ resetEmail }}</b>. Vui lòng kiểm tra hộp thư.</span>
              </div>

              <div class="mb-4">
                <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Mã OTP (6 số) <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="resetOtp" maxlength="6" class="shadow-sm appearance-none border rounded-lg w-full py-2.5 px-3 bg-white dark:bg-slate-700 text-gray-700 dark:text-white tracking-widest text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="------">
              </div>

              <div class="mb-5">
                <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Mật khẩu mới <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input [(ngModel)]="newPassword" [type]="showNewPassword ? 'text' : 'password'"
                         class="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-3 pr-10 bg-white dark:bg-slate-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="******">
                  <button type="button" (click)="showNewPassword = !showNewPassword" tabindex="-1"
                          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:text-blue-400 focus:outline-none">
                    <!-- Eye Icon -->
                    <svg *ngIf="!showNewPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <!-- Eye Slash Icon -->
                    <svg *ngIf="showNewPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="flex gap-3">
                <button (click)="forgotStep = 1" class="w-1/3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-lg transition-colors border border-gray-200 dark:border-slate-700">Quay lại</button>
                <button (click)="resetPassword()"
                        [disabled]="!resetOtp || resetOtp.length !== 6 || !newPassword || !checkPasswordRegex(newPassword)"
                        class="w-2/3 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-300 transition-all disabled:opacity-70 shadow-md">Lưu mật khẩu</button>
              </div>
              <div *ngIf="newPassword && !checkPasswordRegex(newPassword)" class="text-red-500 text-xs mt-2 font-medium">
                Mật khẩu phải từ 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt (@$!%*?&).
              </div>
            </div>

            <!-- Bước 3: Thành công -->
            <div *ngIf="forgotStep === 3" class="text-center py-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Đổi mật khẩu thành công!</h3>
              <p class="text-sm text-gray-600 dark:text-slate-300 mb-6">Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
              <button (click)="closeForgotPassword()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-md">Quay lại Đăng nhập</button>
            </div>
          </div>
        </div>
      </div>

      <style>
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      </style>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(5)]],
    password: ['', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]],
    rememberMe: [false]
  });

  submitted = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  showPassword = false;
  showNewPassword = false;

  // Trạng thái modal Google Login demo
  showGoogleModal = false;
  googleModalStep: 'loading' | 'done' = 'loading';

  // Trạng thái modal Quên mật khẩu
  showForgotPassword = false;
  forgotStep = 1;
  resetEmail = '';
  resetOtp = '';
  newPassword = '';
  isSendingOtp = false;

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService.login({ username: this.loginForm.value.username, password: this.loginForm.value.password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.authService.setToken(res.accessToken);
        this.authService.setCurrentUser(res.admin);

        // Nếu có chọn Ghi nhớ đăng nhập
        if (this.loginForm.value.rememberMe) {
          localStorage.setItem('remembered_username', this.loginForm.value.username);
        } else {
          localStorage.removeItem('remembered_username');
        }

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Có lỗi xảy ra từ máy chủ');
      }
    });
  }

  loginWithGoogle() {
    this.showGoogleModal = true;
    this.googleModalStep = 'loading';
    // Giả lập thời gian kết nối ~1.5s rồi hiển thị trạng thái đã gửi mail
    setTimeout(() => {
      this.googleModalStep = 'done';
    }, 1500);
  }

  closeGoogleModal() {
    this.showGoogleModal = false;
    this.googleModalStep = 'loading';
  }

  closeForgotPassword() {
    this.showForgotPassword = false;
    setTimeout(() => {
      this.forgotStep = 1;
      this.resetEmail = '';
      this.resetOtp = '';
      this.newPassword = '';
      this.isSendingOtp = false;
      this.showNewPassword = false;
    }, 300);
  }

  sendOtp() {
    this.isSendingOtp = true;
    setTimeout(() => {
      this.isSendingOtp = false;
      this.forgotStep = 2;
      alert('⚠️ Tính năng đang giả lập (Mock API). Vui lòng dùng mã OTP: 123456 để test!');
    }, 1500); // Giả lập mạng
  }

  resetPassword() {
    if (this.resetOtp !== '123456') {
      alert('Mã OTP không chính xác. Mã giả lập là: 123456');
      return;
    }
    // Giả lập call API đổi pass thành công
    setTimeout(() => {
      this.forgotStep = 3;
    }, 800);
  }

  checkPasswordRegex(password: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }
}
