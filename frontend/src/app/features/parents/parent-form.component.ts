import { Component, inject, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ParentService } from '../../core/services/parent.service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-parent-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden w-full max-w-3xl mx-auto">
      <div class="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800 dark:text-slate-100">
          {{ isEditMode() ? 'Cập nhật Phụ huynh' : 'Thêm mới Phụ huynh' }}
        </h2>
        <button (click)="goBack()" class="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300">
          <svg *ngIf="isModal" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          <span *ngIf="!isModal">Trở lại</span>
        </button>
      </div>

      <div class="p-6">
        <form [formGroup]="parentForm" (ngSubmit)="onSubmit()">

          <!-- General Server Error -->
          <div *ngIf="serverError()" class="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {{ serverError() }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Họ Tên -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Họ và Tên <span class="text-red-500">*</span></label>
              <input type="text" formControlName="fullName"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                [ngClass]="{'border-red-500': submitted() && f['fullName'].errors}">
              <div *ngIf="submitted() && f['fullName'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['fullName'].errors['required']">Họ tên là bắt buộc</p>
                <p *ngIf="f['fullName'].errors['pattern']">Họ tên không được chứa số và ký tự đặc biệt</p>
              </div>
            </div>

            <!-- SĐT -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Số điện thoại <span class="text-red-500">*</span></label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <input type="text" formControlName="phoneNumber" (input)="f['phoneNumber'].setErrors(null)"
                  class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                  [ngClass]="{'border-red-500': (submitted() || f['phoneNumber'].dirty) && f['phoneNumber'].errors}">
              </div>
              <div *ngIf="(submitted() || f['phoneNumber'].dirty) && f['phoneNumber'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['phoneNumber'].errors['required']">Số điện thoại là bắt buộc</p>
                <p *ngIf="f['phoneNumber'].errors['pattern']">Số điện thoại không hợp lệ (Gồm 10 số, bắt đầu bằng 03,05,07,08,09)</p>
                <p *ngIf="f['phoneNumber'].errors['serverError']" class="font-semibold">{{ f['phoneNumber'].errors['serverError'] }}</p>
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <input type="email" formControlName="email" (input)="f['email'].setErrors(null)"
                  class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                  [ngClass]="{'border-red-500': (submitted() || f['email'].dirty) && f['email'].errors}">
              </div>
              <div *ngIf="(submitted() || f['email'].dirty) && f['email'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['email'].errors['email']">Email không hợp lệ</p>
                <p *ngIf="f['email'].errors['serverError']" class="font-semibold">{{ f['email'].errors['serverError'] }}</p>
              </div>
            </div>

            <!-- Nghề nghiệp -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Nghề nghiệp</label>
              <div class="flex flex-col gap-2">
                <select formControlName="occupationSelect"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white bg-white dark:bg-slate-800">
                  <option value="">-- Chọn nghề nghiệp --</option>
                  <option *ngFor="let occ of predefinedOccupations" [value]="occ">{{occ}}</option>
                  <option value="Khác">Khác (Nhập tay...)</option>
                </select>

                <input *ngIf="isCustomOccupation()" type="text" formControlName="occupation" placeholder="Nhập nghề nghiệp..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                  [ngClass]="{'border-red-500': submitted() && f['occupation'].errors}">
              </div>
              <p *ngIf="submitted() && f['occupation'].errors?.['pattern']" class="text-red-500 text-xs mt-1">Nghề nghiệp không được chứa số và ký tự đặc biệt</p>
            </div>

            <!-- Địa chỉ -->
            <div class="md:col-span-2 mb-8">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Địa chỉ</label>
              <div class="bg-white dark:bg-slate-800 rounded-md w-full">
                <quill-editor formControlName="address"
                  [styles]="{height: '150px', display: 'block', width: '100%'}"
                  class="w-full"
                  placeholder="Nhập địa chỉ chi tiết (số nhà, phường/xã, quận/huyện...)"
                  theme="snow">
                </quill-editor>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700 pt-6">
            <button type="button" (click)="goBack()"
              class="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Hủy
            </button>
            <button type="submit" [disabled]="isLoading()"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center">
              <svg *ngIf="isLoading()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ isEditMode() ? 'Cập nhật' : 'Lưu lại' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ParentFormComponent implements OnInit {
  @Input() parentId: number | null = null;
  @Input() isModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private parentService = inject(ParentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  isEditMode = signal(false);
  isLoading = signal(false);
  submitted = signal(false);
  serverError = signal<string | null>(null);

  predefinedOccupations = ['Giáo viên', 'Bác sĩ', 'Kỹ sư', 'Kinh doanh', 'Nhân viên văn phòng', 'Nội trợ', 'Công nhân'];
  isCustomOccupation = signal(false);

  parentForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ỹ\s]*[a-zA-ZÀ-ỹ][a-zA-ZÀ-ỹ\s]*$/)]],
    phoneNumber: ['', [
      Validators.required,
      Validators.pattern(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    ]],
    email: ['', [Validators.email]],
    occupationSelect: [''],
    occupation: ['', [Validators.pattern(/^[a-zA-ZÀ-ỹ\s]*$/)]],
    address: ['']
  });

  get f() { return this.parentForm.controls; }

  ngOnInit() {
    this.parentForm.get('occupationSelect')?.valueChanges.subscribe(val => {
      if (val === 'Khác') {
        this.isCustomOccupation.set(true);
        if (this.parentForm.get('occupation')?.value === 'Khác') {
          this.parentForm.get('occupation')?.setValue('');
        }
      } else {
        this.isCustomOccupation.set(false);
        this.parentForm.get('occupation')?.setValue(val);
      }
    });

    this.checkEditMode();
  }

  private checkEditMode() {
    let id = this.parentId;
    if (!id) {
      const routeId = this.route.snapshot.paramMap.get('id');
      if (routeId) {
        id = Number(routeId);
      }
    }

    if (id) {
      this.isEditMode.set(true);
      this.loadParent(id);
    }
  }

  loadParent(id: number) {
    this.isLoading.set(true);
    this.parentService.getParentById(id).subscribe({
      next: (parent) => {
        if (parent) {
          if (parent.occupation) {
            if (!this.predefinedOccupations.includes(parent.occupation)) {
              this.isCustomOccupation.set(true);
              (parent as any).occupationSelect = 'Khác';
            } else {
              (parent as any).occupationSelect = parent.occupation;
            }
          }
          this.parentForm.patchValue(parent);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.serverError.set('Không tìm thấy phụ huynh');
        this.goBack();
      }
    });
  }

  onSubmit() {
    this.submitted.set(true);
    this.serverError.set(null);

    if (this.parentForm.get('occupationSelect')?.value === 'Khác' && !this.parentForm.get('occupation')?.value) {
      // Allow empty custom occupation if it's optional, but we just want to submit it.
    }

    if (this.parentForm.invalid) return;

    this.isLoading.set(true);
    const rawData = this.parentForm.value;
    const data = {
      ...rawData,
      fullName: rawData.fullName?.trim(),
      phoneNumber: rawData.phoneNumber?.trim(),
      email: rawData.email?.trim(),
      occupation: rawData.occupation?.trim(),
      address: rawData.address?.trim()
    };
    delete data.occupationSelect;

    const id = this.parentId || Number(this.route.snapshot.paramMap.get('id'));

    if (this.isEditMode() && id) {
      this.parentService.updateParent(id, data).subscribe({
        next: () => {
          this.isLoading.set(false);
          if (this.isModal) {
            this.saved.emit();
          } else {
            this.router.navigate(['/parents']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.message || 'Có lỗi xảy ra khi cập nhật phụ huynh. Vui lòng kiểm tra lại dữ liệu.';
          if (msg.toLowerCase().includes('điện thoại')) {
            this.f['phoneNumber'].setErrors({ serverError: msg });
          } else if (msg.toLowerCase().includes('email')) {
            this.f['email'].setErrors({ serverError: msg });
          } else {
            this.serverError.set(msg);
          }
        }
      });
    } else {
      this.parentService.createParent(data).subscribe({
        next: () => {
          this.isLoading.set(false);
          if (this.isModal) {
            this.saved.emit();
          } else {
            this.router.navigate(['/parents']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.message || 'Có lỗi xảy ra khi thêm mới phụ huynh.';
          if (msg.toLowerCase().includes('điện thoại')) {
            this.f['phoneNumber'].setErrors({ serverError: msg });
          } else if (msg.toLowerCase().includes('email')) {
            this.f['email'].setErrors({ serverError: msg });
          } else {
            this.serverError.set(msg);
          }
        }
      });
    }
  }

  goBack() {
    if (this.isModal) {
      this.cancelled.emit();
    } else {
      this.location.back();
    }
  }
}
