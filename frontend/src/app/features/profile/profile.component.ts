import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 max-w-3xl mx-auto mt-6 animate-fade-in-up">

      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
        <!-- Header & Avatar -->
        <div class="flex flex-col sm:flex-row items-center gap-6 mb-8 border-b border-gray-100 dark:border-slate-700 pb-8 relative">
          <!-- Avatar Upload -->
          <div class="relative group cursor-pointer" (click)="fileInput.click()">
            <div *ngIf="!avatarUrl()" class="w-28 h-28 bg-gradient-to-tr from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 text-4xl font-bold shadow-inner">
              {{ profileForm.value.fullName?.charAt(0) || 'A' }}
            </div>
            <img *ngIf="avatarUrl()" [src]="avatarUrl()" class="w-28 h-28 rounded-full object-cover shadow-sm border-4 border-white" alt="Avatar">

            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg class="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span class="text-white text-xs font-medium">Thay đổi</span>
            </div>
            <input #fileInput type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)">
          </div>

          <div class="text-center sm:text-left">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-slate-100">Cài đặt Hồ sơ</h1>
            <p class="text-gray-500 dark:text-slate-400 mt-1">Cập nhật thông tin và bảo mật tài khoản của bạn</p>
          </div>

          <button *ngIf="isEditing()" type="submit" [disabled]="profileForm.invalid || isLoading()"
                  class="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            <svg *ngIf="isLoading()" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg *ngIf="!isLoading()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Lưu thay đổi
          </button>
        </div>

        <!-- Thông tin cơ bản -->
        <div class="mb-10">
          <h2 class="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 border-l-4 border-blue-500 pl-3">Thông tin cơ bản</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <!-- Họ và tên -->
            <div>
              <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Họ và Tên <span class="text-red-500">*</span></label>
              <input formControlName="fullName" type="text"
                class="shadow-sm appearance-none border border-gray-300 dark:border-slate-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                [ngClass]="{'border-red-500': f['fullName'].invalid && f['fullName'].touched}">
              <div *ngIf="f['fullName'].invalid && f['fullName'].touched" class="text-red-500 text-xs mt-1 font-medium">
                Vui lòng nhập họ và tên.
              </div>
            </div>

            <!-- Tên đăng nhập -->
            <div>
              <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Tên đăng nhập</label>
              <input type="text" [value]="user?.username" disabled
                class="shadow-sm appearance-none border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-700 rounded-lg w-full py-2.5 px-3 text-gray-500 dark:text-slate-400 cursor-not-allowed">
              <p class="text-xs text-gray-400 mt-1">Không thể thay đổi tên đăng nhập.</p>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Email <span class="text-red-500">*</span></label>
              <input formControlName="email" type="email"
                class="shadow-sm appearance-none border border-gray-300 dark:border-slate-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                [ngClass]="{'border-red-500': f['email'].invalid && f['email'].touched}">
              <div *ngIf="f['email'].invalid && f['email'].touched" class="text-red-500 text-xs mt-1 font-medium">
                Vui lòng nhập email hợp lệ.
              </div>
            </div>

            <!-- Role -->
            <div>
              <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Quyền hạn (Role)</label>
              <div class="flex items-center gap-2 py-2.5 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-100 font-medium">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Administrator
              </div>
            </div>
          </div>
        </div>

        <!-- Đổi mật khẩu -->
        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 border-l-4 border-red-400 pl-3">Bảo mật (Đổi mật khẩu)</h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mb-5">Để trống các trường này nếu bạn không muốn đổi mật khẩu.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Mật khẩu hiện tại -->
            <div>
              <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Mật khẩu hiện tại</label>
              <div class="relative">
                <input formControlName="currentPassword" [type]="showCurrentPwd ? 'text' : 'password'"
                  class="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-3 pr-10 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [ngClass]="{'border-red-500': f['currentPassword'].errors, 'border-gray-300 dark:border-slate-600': !f['currentPassword'].errors}">
                <button type="button" (click)="showCurrentPwd = !showCurrentPwd" tabindex="-1" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:text-blue-400 focus:outline-none">
                  <svg *ngIf="!showCurrentPwd" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <svg *ngIf="showCurrentPwd" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                </button>
              </div>
              <div *ngIf="f['currentPassword'].errors?.['required']" class="text-red-500 text-xs mt-1 font-medium">
                Vui lòng nhập mật khẩu hiện tại.
              </div>
              <div *ngIf="f['currentPassword'].errors?.['incorrect']" class="text-red-500 text-xs mt-1 font-medium">
                Mật khẩu hiện tại không chính xác!
              </div>
            </div>

            <div class="hidden md:block"></div>

            <!-- Mật khẩu mới -->
            <div>
              <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Mật khẩu mới</label>
              <div class="relative">
                <input formControlName="newPassword" [type]="showNewPwd ? 'text' : 'password'"
                  class="shadow-sm appearance-none border border-gray-300 dark:border-slate-600 rounded-lg w-full py-2.5 pl-3 pr-10 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <button type="button" (click)="showNewPwd = !showNewPwd" tabindex="-1" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:text-blue-400 focus:outline-none">
                  <svg *ngIf="!showNewPwd" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <svg *ngIf="showNewPwd" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                </button>
              </div>
              <div *ngIf="f['newPassword'].errors?.['pattern'] && f['newPassword'].touched" class="text-red-500 text-xs mt-1 font-medium">
                Mật khẩu phải từ 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt.
              </div>
            </div>

            <div class="hidden md:block"></div>

            <!-- Xác nhận mật khẩu mới -->
            <div>
              <label class="block text-gray-700 dark:text-slate-300 text-sm font-bold mb-2">Xác nhận mật khẩu</label>
              <div class="relative">
                <input formControlName="confirmPassword" [type]="showConfirmPwd ? 'text' : 'password'"
                  class="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-3 pr-10 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [ngClass]="{'border-red-500': profileForm.errors?.['passwordMismatch'] && f['confirmPassword'].touched, 'border-gray-300 dark:border-slate-600': !profileForm.errors?.['passwordMismatch'] || !f['confirmPassword'].touched}">
                <button type="button" (click)="showConfirmPwd = !showConfirmPwd" tabindex="-1" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:text-blue-400 focus:outline-none">
                  <svg *ngIf="!showConfirmPwd" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <svg *ngIf="showConfirmPwd" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                </button>
              </div>
              <div *ngIf="profileForm.errors?.['passwordMismatch'] && f['confirmPassword'].touched" class="text-red-500 text-xs mt-1 font-medium">
                Mật khẩu xác nhận không khớp!
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Thông báo lưu thành công -->
      <div *ngIf="showSuccess()" class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-up z-50">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">Đã lưu thay đổi hồ sơ thành công!</span>
      </div>

      <style>
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  user = this.authService.getCurrentUser();
  avatarUrl = signal<string | null>(null);

  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;

  isLoading = signal(false);
  showSuccess = signal(false);
  isEditing = signal(false);

  profileForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    currentPassword: [''],
    newPassword: ['', [Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
    confirmPassword: ['']
  }, { validators: this.passwordMatchValidator });

  get f() { return this.profileForm.controls; }

  ngOnInit() {
    if (this.user) {
      this.profileForm.patchValue({
        fullName: this.user.fullName,
        email: this.user.email || ''
      });
      // Check stored avatar
      const savedAvatar = localStorage.getItem('user_avatar');
      if (savedAvatar) {
        this.avatarUrl.set(savedAvatar);
      }
    }

    // Theo dõi thay đổi form để hiện nút Lưu
    this.profileForm.valueChanges.subscribe(() => {
      this.isEditing.set(true);
    });

    this.profileForm.get('currentPassword')?.valueChanges.subscribe(() => {
      if (this.profileForm.get('currentPassword')?.hasError('incorrect')) {
        this.profileForm.get('currentPassword')?.setErrors(null);
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const newPwd = g.get('newPassword')?.value;
    const confirmPwd = g.get('confirmPassword')?.value;
    if (newPwd || confirmPwd) {
      return newPwd === confirmPwd ? null : { passwordMismatch: true };
    }
    return null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarUrl.set(e.target.result);
        this.isEditing.set(true);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.profileForm.value;

    // Kịch bản Đổi mật khẩu
    if (newPassword || confirmPassword || currentPassword) {
      // Bắt buộc nhập mật khẩu hiện tại
      if (!currentPassword) {
        this.profileForm.controls['currentPassword'].setErrors({ required: true });
        return;
      }

      // Giả lập kiểm tra mật khẩu cũ từ Server (Mock: Admin@123)
      if (currentPassword !== 'Admin@123') {
        this.profileForm.controls['currentPassword'].setErrors({ incorrect: true });
        return;
      }
    }

    this.isLoading.set(true);

    // Giả lập lưu API
    setTimeout(() => {
      this.isLoading.set(false);
      this.isEditing.set(false);
      this.showSuccess.set(true);

      // Update local storage info
      if (this.user) {
        this.user.fullName = this.profileForm.value.fullName;
        this.authService.setCurrentUser(this.user);
      }

      if (this.avatarUrl()) {
        localStorage.setItem('user_avatar', this.avatarUrl() as string);
      }

      // Xóa form pass
      this.profileForm.patchValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      this.profileForm.markAsUntouched();

      setTimeout(() => this.showSuccess.set(false), 3000);

      // Force reload để Header cập nhật tên/avatar
      window.dispatchEvent(new Event('storage'));
    }, 800);
  }
}
