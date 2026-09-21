import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div class="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div class="p-8 sm:p-10 flex flex-col justify-center">
          
          <div *ngIf="step === 'verifying'" class="text-center py-8">
            <svg class="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Đang kiểm tra token...</h3>
          </div>

          <div *ngIf="step === 'invalid'" class="text-center py-8 animate-fade-in-up">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Liên kết không hợp lệ</h3>
            <p class="text-gray-500 dark:text-slate-400 mb-6">Liên kết khôi phục mật khẩu này đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu lại.</p>
            <button (click)="goToLogin()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">Quay lại Đăng nhập</button>
          </div>

          <div *ngIf="step === 'reset'" class="animate-fade-in-up">
            <div class="mb-8 text-center">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-500">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
              </div>
              <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Đặt lại mật khẩu</h1>
              <p class="text-sm text-gray-500 dark:text-slate-400">Vui lòng nhập mật khẩu mới của bạn.</p>
            </div>

            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Mật khẩu mới</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input formControlName="newPassword" [type]="showPassword ? 'text' : 'password'"
                    class="pl-10 pr-10 w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="Nhập mật khẩu mới...">
                  <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500" (click)="showPassword = !showPassword">
                    <svg *ngIf="!showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    <svg *ngIf="showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  </button>
                </div>
                <div *ngIf="submitted() && f['newPassword'].errors" class="text-red-500 text-xs mt-1 font-medium">
                  <span *ngIf="f['newPassword'].errors['required']">Vui lòng nhập mật khẩu mới</span>
                  <span *ngIf="f['newPassword'].errors['pattern']">Mật khẩu phải từ 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt (@$!%*?&).</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Xác nhận mật khẩu mới</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input formControlName="confirmPassword" [type]="showConfirmPassword ? 'text' : 'password'"
                    class="pl-10 pr-10 w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="Nhập lại mật khẩu mới...">
                  <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500" (click)="showConfirmPassword = !showConfirmPassword">
                    <svg *ngIf="!showConfirmPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    <svg *ngIf="showConfirmPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  </button>
                </div>
                <div *ngIf="submitted() && (f['confirmPassword'].errors || resetForm.errors?.['passwordMismatch'])" class="text-red-500 text-xs mt-1 font-medium">
                  <span *ngIf="f['confirmPassword'].errors?.['required']">Vui lòng xác nhận mật khẩu</span>
                  <span *ngIf="resetForm.errors?.['passwordMismatch']">Mật khẩu xác nhận không khớp</span>
                </div>
              </div>

              <!-- Error message from server -->
              <div *ngIf="errorMessage()" class="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm flex items-center font-medium shadow-sm">
                <svg class="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                {{ errorMessage() }}
              </div>

              <button type="submit" [disabled]="isLoading()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center shadow-md disabled:opacity-70">
                <svg *ngIf="isLoading()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Lưu mật khẩu mới
              </button>
            </form>
          </div>

          <!-- Bước 3: Thành công -->
          <div *ngIf="step === 'success'" class="text-center py-6 animate-fade-in-up">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">Đổi mật khẩu thành công!</h3>
            <p class="text-sm text-gray-600 dark:text-slate-300 mb-8">Mật khẩu của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập.</p>
            <button (click)="goToLogin()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-md">Đến trang Đăng nhập</button>
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
  `
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  step: 'verifying' | 'invalid' | 'reset' | 'success' = 'verifying';
  
  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  submitted = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = false;
  showConfirmPassword = false;

  get f() { return this.resetForm.controls; }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.step = 'invalid';
      } else {
        // Trong thực tế có thể gọi API check token hợp lệ hay không trước.
        // Ở đây chúng ta cho phép đi thẳng vào màn reset, backend sẽ check khi submit.
        this.step = 'reset';
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  onSubmit() {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (this.resetForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    
    this.authService.resetPassword(this.token, this.resetForm.value.newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step = 'success';
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
