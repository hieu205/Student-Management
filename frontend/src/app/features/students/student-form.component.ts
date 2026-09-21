import { Component, inject, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/student.model';
import { QuillModule } from 'ngx-quill';
import { SCHOOL_CLASSES } from '../../core/constants/app.constants';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
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

          <!-- General Server Error -->
          <div *ngIf="serverError()" class="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {{ serverError() }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

            <!-- Mã học sinh -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Mã học sinh <span class="text-red-500">*</span></label>
              <input type="text" formControlName="studentCode" (input)="f['studentCode'].setErrors(null)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white uppercase"
                [ngClass]="{'border-red-500': (submitted() || f['studentCode'].dirty) && f['studentCode'].errors}">
              <div *ngIf="(submitted() || f['studentCode'].dirty) && f['studentCode'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['studentCode'].errors['required']">Mã học sinh là bắt buộc</p>
                <p *ngIf="f['studentCode'].errors['pattern']">Mã học sinh chỉ chứa chữ và số</p>
                <p *ngIf="f['studentCode'].errors['serverError']" class="font-semibold">{{ f['studentCode'].errors['serverError'] }}</p>
              </div>
            </div>

            <!-- Họ Tên -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Họ và Tên <span class="text-red-500">*</span></label>
              <input type="text" formControlName="fullName"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                [ngClass]="{'border-red-500': submitted() && f['fullName'].errors}">
              <div *ngIf="submitted() && f['fullName'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['fullName'].errors['required']">Họ tên là bắt buộc</p>
                <p *ngIf="f['fullName'].errors['pattern']">Họ tên không được chứa số và ký tự đặc biệt</p>
              </div>
            </div>

            <!-- Khối và Lớp -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Lớp học <span class="text-red-500">*</span></label>
              <div class="grid grid-cols-2 gap-3">
                <select formControlName="grade"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white bg-white dark:bg-slate-800">
                  <option value="">- Khối -</option>
                  <option *ngFor="let g of grades" [value]="g">{{g}}</option>
                </select>

                <select formControlName="className"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  [ngClass]="{'border-red-500': submitted() && f['className'].errors}">
                  <option value="">- Lớp -</option>
                  <option *ngFor="let c of availableClasses()" [value]="c">{{c}}</option>
                </select>
              </div>
              <div *ngIf="submitted() && f['className'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['className'].errors['required']">Lớp học là bắt buộc</p>
                <p *ngIf="f['className'].errors['pattern']">Tên lớp không hợp lệ</p>
              </div>
            </div>

            <!-- Ngày sinh -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Ngày sinh <span class="text-red-500">*</span></label>
              <div class="relative">
                <input type="date" formControlName="dateOfBirth" min="1900-01-01" max="2099-12-31"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white"
                  [ngClass]="{'border-red-500': submitted() && f['dateOfBirth'].errors}">
              </div>
              <div *ngIf="submitted() && f['dateOfBirth'].errors" class="text-red-500 text-xs mt-1">
                <p *ngIf="f['dateOfBirth'].errors['required']">Ngày sinh là bắt buộc</p>
                <p *ngIf="f['dateOfBirth'].errors['pattern']">Năm sinh không hợp lệ (nhập từ 1900 đến 2099)</p>
              </div>
            </div>

            <!-- Giới tính -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Giới tính</label>
              <div class="flex gap-6 mt-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="gender" value="Male" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                  <span class="text-gray-700 dark:text-slate-300">Nam</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="gender" value="Female" class="w-4 h-4 text-pink-500 border-gray-300 focus:ring-pink-500">
                  <span class="text-gray-700 dark:text-slate-300">Nữ</span>
                </label>
              </div>
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
  serverError = signal<string | null>(null);

  schoolClasses = SCHOOL_CLASSES;
  grades = Object.keys(SCHOOL_CLASSES);
  availableClasses = signal<string[]>([]);

  ngOnInit() {
    this.initForm();

    // Watch grade changes
    this.studentForm.get('grade')?.valueChanges.subscribe(grade => {
      if (grade) {
        this.availableClasses.set(this.schoolClasses[grade] || []);
      } else {
        this.availableClasses.set([]);
      }

      const currentClass = this.studentForm.get('className')?.value;
      if (grade && !this.schoolClasses[grade].includes(currentClass)) {
        this.studentForm.get('className')?.setValue('');
      }
    });

    this.checkEditMode();
  }

  private initForm() {
    this.studentForm = this.fb.group({
      studentCode: ['', [Validators.required, Validators.pattern(/^HS[0-9]+$/)]],
      fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ỹ\s]*[a-zA-ZÀ-ỹ][a-zA-ZÀ-ỹ\s]*$/)]],
      dateOfBirth: ['', [Validators.required, Validators.pattern(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)]],
      gender: ['Male', Validators.required],
      grade: [''],
      className: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s]*$/)]],
      address: ['']
    });
  }

  get f() { return this.studentForm.controls; }

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
      this.loadStudent(id);
    }
  }

  loadStudent(id: number) {
    this.isLoading.set(true);
    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        if (student) {
          if (student.dateOfBirth) {
            student.dateOfBirth = student.dateOfBirth.split('T')[0];
          }

          let foundGrade = '';
          for (const [grade, classes] of Object.entries(this.schoolClasses)) {
            if (classes.includes(student.className)) {
              foundGrade = grade;
              break;
            }
          }

          const patchData = { ...student, grade: foundGrade };
          this.studentForm.patchValue(patchData);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.serverError.set('Không tìm thấy học sinh');
        this.goBack();
      }
    });
  }

  onSubmit() {
    this.submitted.set(true);
    this.serverError.set(null);
    if (this.studentForm.invalid) return;

    this.isLoading.set(true);
    const rawData = this.studentForm.value;
    const data = {
      ...rawData,
      fullName: rawData.fullName?.trim(),
      studentCode: rawData.studentCode?.trim(),
      className: rawData.className?.trim(),
      address: rawData.address?.trim()
    };
    delete data.grade;

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
          const msg = err.error?.message || 'Có lỗi xảy ra khi cập nhật học sinh.';
          if (msg.toLowerCase().includes('mã')) {
            this.f['studentCode'].setErrors({ serverError: msg });
          } else {
            this.serverError.set(msg);
          }
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
          const msg = err.error?.message || 'Có lỗi xảy ra khi thêm học sinh.';
          if (msg.toLowerCase().includes('mã')) {
            this.f['studentCode'].setErrors({ serverError: msg });
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
