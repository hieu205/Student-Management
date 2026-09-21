import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div class="max-w-4xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <!-- Left Side: Login Form -->
        <div class="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div class="mb-8 text-center md:text-left">
            <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Hệ thống Quản lý</h1>
            <p class="text-gray-500 dark:text-slate-400">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5" for="username">Tên đăng nhập <span class="text-red-500">*</span></label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input formControlName="username" id="username" type="text"
                  class="pl-10 w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                  placeholder="Nhập tên đăng nhập...">
              </div>
              <div *ngIf="submitted() && f['username'].errors" class="text-red-500 text-xs mt-1 font-medium">
                <span *ngIf="f['username'].errors['required']">Vui lòng nhập tên đăng nhập</span>
                <span *ngIf="f['username'].errors['minlength']">Tên đăng nhập phải từ 5 ký tự</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5" for="password">Mật khẩu <span class="text-red-500">*</span></label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input formControlName="password" id="password" [type]="showPassword ? 'text' : 'password'"
                  class="pl-10 pr-10 w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                  placeholder="Nhập mật khẩu...">
                <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500 focus:outline-none" (click)="showPassword = !showPassword">
                  <svg *ngIf="!showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div *ngIf="submitted() && f['password'].errors" class="text-red-500 text-xs mt-1 font-medium">
                <span *ngIf="f['password'].errors['required']">Vui lòng nhập mật khẩu</span>
                <span *ngIf="f['password'].errors['pattern']">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</span>
              </div>
            </div>

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
          </form>

          <!-- Google Login Button -->
          <div class="mt-8">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200 dark:border-slate-700"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div class="mt-6">
              <button (click)="loginWithGoogle()" class="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>
          </div>
        </div>

        <!-- Right Side: Background/Image -->
        <div class="hidden md:block w-1/2 bg-blue-600 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 opacity-90"></div>
          <!-- Decorative circles -->
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-white opacity-10 rounded-full blur-2xl"></div>

          <div class="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
            <svg class="w-24 h-24 text-white/80 mb-6 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>
            <h2 class="text-3xl font-bold text-white mb-4">Hệ thống Quản lý</h2>
            <p class="text-blue-100 text-lg leading-relaxed">Giải pháp toàn diện giúp nhà trường quản lý thông tin học sinh, phụ huynh và phân quyền hệ thống một cách hiệu quả và bảo mật.</p>
          </div>
        </div>
      </div>

      <!-- GOOGLE LOGIN DEMO MODAL -->
      <div *ngIf="showGoogleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" (click)="closeGoogleModal()"></div>
        <!-- Modal Content -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full relative z-10 transform transition-all text-center animate-fade-in-up">
          <div *ngIf="googleModalStep === 'loading'">
            <svg class="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Đang kết nối với Google...</h3>
            <p class="text-gray-500 dark:text-slate-400 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
          <div *ngIf="googleModalStep === 'done'">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Tính năng chưa khả dụng</h3>
            <p class="text-gray-600 dark:text-slate-300 text-sm mb-6">Đăng nhập bằng Google hiện đang được phát triển và chưa thể sử dụng.</p>
            <button (click)="closeGoogleModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">Đóng</button>
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
              <p class="text-sm text-gray-600 dark:text-slate-300 mb-4">Vui lòng nhập địa chỉ email đã đăng ký của bạn. Hệ thống sẽ gửi một liên kết để bạn đặt lại mật khẩu mới.</p>

              <div *ngIf="forgotErrorMessage" class="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm flex items-start font-medium shadow-sm">
                <svg class="w-5 h-5 mr-2 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                <span>{{ forgotErrorMessage }}</span>
              </div>

              <div class="mb-4">
                <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Địa chỉ Email <span class="text-red-500">*</span></label>
                <input type="email" [(ngModel)]="resetEmail" (keydown.enter)="sendResetLink()" class="shadow-sm appearance-none border rounded-lg w-full py-2.5 px-3 bg-white dark:bg-slate-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="example@gmail.com">
              </div>
              <button (click)="sendResetLink()" [disabled]="isSendingLink" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-70 flex justify-center items-center shadow-md">
                <svg *ngIf="isSendingLink" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ isSendingLink ? 'Đang gửi...' : 'Gửi liên kết khôi phục' }}
              </button>
            </div>

            <!-- Bước 2: Thành công -->
            <div *ngIf="forgotStep === 2" class="text-center py-4">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Đã gửi liên kết!</h3>
              <p class="text-sm text-gray-600 dark:text-slate-300 mb-6">Liên kết khôi phục mật khẩu đã được gửi tới <b>{{ resetEmail }}</b>. Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục Spam) và làm theo hướng dẫn.</p>
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

  // Trạng thái modal Google Login demo
  showGoogleModal = false;
  googleModalStep: 'loading' | 'done' = 'loading';

  // Trạng thái modal Quên mật khẩu
  showForgotPassword = false;
  forgotStep = 1;
  resetEmail = '';
  isSendingLink = false;
  forgotErrorMessage = '';

  ngOnInit() {
    const rememberedUsername = localStorage.getItem('remembered_username');
    if (rememberedUsername) {
      this.loginForm.patchValue({
        username: rememberedUsername,
        rememberMe: true
      });
    }
  }

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
        if (err.status === 401) {
          this.errorMessage.set('Tên đăng nhập hoặc mật khẩu không chính xác.');
        } else if (err.status === 0) {
          this.errorMessage.set('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
        } else {
          this.errorMessage.set(err.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
    });
  }

  loginWithGoogle() {
    this.showGoogleModal = true;
    this.googleModalStep = 'loading';
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
      this.isSendingLink = false;
      this.forgotErrorMessage = '';
    }, 300);
  }

  sendResetLink() {
    this.forgotErrorMessage = '';

    if (!this.resetEmail) {
      this.forgotErrorMessage = 'Vui lòng nhập địa chỉ email.';
      return;
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.resetEmail)) {
      this.forgotErrorMessage = 'Định dạng email không hợp lệ. Vui lòng nhập đúng định dạng (VD: example@gmail.com).';
      return;
    }

    this.isSendingLink = true;
    this.authService.forgotPassword(this.resetEmail).subscribe({
      next: () => {
        this.isSendingLink = false;
        this.forgotStep = 2; // Success step
      },
      error: (err) => {
        this.isSendingLink = false;
        // Display precise error from backend (like Email not found)
        if (err.status === 404 || err.status === 400) {
          this.forgotErrorMessage = err.error?.message || 'Email không tồn tại trên hệ thống.';
        } else {
          this.forgotErrorMessage = 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.';
        }
      }
    });
  }
}
