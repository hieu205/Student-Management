import { Component, inject, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/student.model';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden w-full max-w-3xl mx-auto">
      <div class="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800 dark:text-slate-100">
          {{ isEditMode() ? 'Cập nhật Học sinh' : 'Thêm mới Học sinh' }}
        </h2>
        <button (click)="goBack()" class="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300">
          <svg *ngIf="isModal" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          <span *ngIf="!isModal">Trở lại</span>
        </button>
      </div>

      <div class="p-6">
        <form [formGroup]="studentForm" (ngSubmit)="onSubmit()">

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Mã HS -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Mã Học Sinh <span class="text-red-500">*</span></label>
              <input type="text" formControlName="studentCode"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                [ngClass]="{'border-red-500': submitted() && f['studentCode'].errors}">
              <div *ngIf="submitted() && f['studentCode'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['studentCode'].errors?.['required']">Mã học sinh là bắt buộc</p>
                <p *ngIf="f['studentCode'].errors?.['pattern']">Mã học sinh phải bắt đầu bằng HS và chỉ chứa số</p>
              </div>
            </div>

            <!-- Họ Tên -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Họ và Tên <span class="text-red-500">*</span></label>
              <input type="text" formControlName="fullName"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                [ngClass]="{'border-red-500': submitted() && f['fullName'].errors}">
              <div *ngIf="submitted() && f['fullName'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['fullName'].errors?.['required']">Họ tên là bắt buộc</p>
                <p *ngIf="f['fullName'].errors?.['pattern']">Họ tên không được chứa số và ký tự đặc biệt</p>
              </div>
            </div>

            <!-- Lớp -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Lớp <span class="text-red-500">*</span></label>
              <input type="text" formControlName="className"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                [ngClass]="{'border-red-500': submitted() && f['className'].errors}">
              <div *ngIf="submitted() && f['className'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['className'].errors?.['required']">Lớp học là bắt buộc</p>
                <p *ngIf="f['className'].errors?.['pattern']">Tên lớp không được chứa ký tự đặc biệt</p>
              </div>
            </div>

            <!-- Ngày sinh -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Ngày sinh <span class="text-red-500">*</span></label>
              <input type="date" formControlName="dateOfBirth"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                [ngClass]="{'border-red-500': submitted() && f['dateOfBirth'].errors}">
              <p *ngIf="submitted() && f['dateOfBirth'].errors?.['required']" class="text-red-500 text-xs mt-1">Ngày sinh là bắt buộc</p>
            </div>

            <!-- Giới tính -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Giới tính</label>
              <select formControlName="gender" class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white bg-white dark:bg-slate-800">
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
              </select>
            </div>

            <!-- Địa chỉ -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Địa chỉ</label>
              <textarea formControlName="address" rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700 pt-6">
            <button type="button" (click)="goBack()"
              class="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Hủy
            </button>
            <button type="submit" [disabled]="isLoading()"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center">
              <svg *ngIf="isLoading()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditMode() ? 'Cập nhật' : 'Lưu lại' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class StudentFormComponent implements OnInit {
  @Input() studentId: number | null = null;
  @Input() isModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  studentForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  submitted = signal(false);

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  private initForm() {
    this.studentForm = this.fb.group({
      studentCode: ['', [Validators.required, Validators.pattern(/^HS\d+$/)]],
      fullName: ['', [Validators.required, Validators.pattern(/^[^0-9!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/]*$/)]],
      dateOfBirth: ['', Validators.required],
      gender: ['Male', Validators.required],
      className: ['', [Validators.required, Validators.pattern(/^[0-9]+[a-zA-Z0-9]+$/)]],
      address: ['']
    });
  }

  private checkEditMode() {
    let id = this.studentId;
    if (!id) {
      const routeId = this.route.snapshot.paramMap.get('id');
      if (routeId) {
        id = Number(routeId);
      }
    }

    if (id) {
      this.isEditMode.set(true);
      this.loadStudentData(id);
    }
  }

  private loadStudentData(id: number) {
    this.isLoading.set(true);
    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        if (student) {
          const dateStr = new Date(student.dateOfBirth).toISOString().split('T')[0];
          this.studentForm.patchValue({
            ...student,
            dateOfBirth: dateStr
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu học sinh', err);
        this.isLoading.set(false);
        alert('Không tìm thấy học sinh!');
        this.goBack();
      }
    });
  }

  get f() {
    return this.studentForm.controls;
  }

  onSubmit() {
    this.submitted.set(true);
    if (this.studentForm.invalid) return;

    this.isLoading.set(true);
    const rawData = this.studentForm.value;
    const data = {
      ...rawData,
      studentCode: rawData.studentCode?.trim(),
      fullName: rawData.fullName?.trim(),
      className: rawData.className?.trim(),
      address: rawData.address?.trim()
    };

    const id = this.studentId || Number(this.route.snapshot.paramMap.get('id'));

    if (this.isEditMode() && id) {
      this.studentService.updateStudent(id, data).subscribe({
        next: () => {
          this.isLoading.set(false);
          if (this.isModal) {
            this.saved.emit();
          } else {
            this.router.navigate(['/students']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          alert(err.message || 'Lỗi cập nhật');
        }
      });
    } else {
      this.studentService.createStudent(data).subscribe({
        next: () => {
          this.isLoading.set(false);
          if (this.isModal) {
            this.saved.emit();
          } else {
            this.router.navigate(['/students']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          alert(err.message || 'Lỗi thêm mới');
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
