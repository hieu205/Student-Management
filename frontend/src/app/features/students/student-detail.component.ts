import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/student.model';
import { Parent } from '../../core/models/parent.model';
import { ParentService } from '../../core/services/parent.service';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="!isLoading() && student()" class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Cột Trái: Thông tin Học sinh -->
      <div class="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div class="bg-blue-600 h-24 relative">
          <button (click)="goBack()" class="absolute top-4 left-4 text-white hover:text-gray-200 bg-black/20 p-2 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
        </div>
        <div class="px-6 pb-6 pt-16 relative">
          <div class="w-24 h-24 bg-gray-200 rounded-full border-4 border-white absolute -top-12 left-6 flex items-center justify-center shadow-md">
            <span class="text-3xl font-bold text-gray-500 dark:text-slate-400">{{ student()?.fullName?.charAt(0) }}</span>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ student()?.fullName }}</h2>
            <p class="text-blue-600 dark:text-blue-400 font-medium">{{ student()?.studentCode }}</p>
          </div>

          <div class="mt-6 space-y-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-slate-400">Lớp</p>
              <p class="font-medium">{{ student()?.className }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-slate-400">Ngày sinh</p>
              <p class="font-medium">{{ student()?.dateOfBirth | date:'dd/MM/yyyy' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-slate-400">Giới tính</p>
              <p class="font-medium">{{ student()?.gender === 'Male' ? 'Nam' : 'Nữ' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-slate-400">Địa chỉ</p>
              <p class="font-medium">{{ student()?.address || 'Chưa cập nhật' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cột Phải: Danh sách Phụ huynh (Quan hệ n-n) -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div class="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
          <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100">Thông tin Phụ huynh </h3>
        </div>

        <!-- Bảng danh sách phụ huynh hiện tại -->
        <div *ngIf="student()?.parents?.length" class="overflow-x-auto mb-8">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Họ Tên</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Vai trò</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Điện thoại</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
              <tr *ngFor="let parent of student()?.parents">
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ parent.fullName }}</td>
                <td class="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  {{ parent.relationshipType === 'Father' ? 'Bố' : (parent.relationshipType === 'Mother' ? 'Mẹ' : (parent.relationshipType === 'Guardian' ? 'Người giám hộ' : (parent.relationshipType || '—'))) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{{ parent.phoneNumber }}</td>
                <td class="px-4 py-3 text-right">
                  <button (click)="removeParent(parent.id)" class="text-red-500 hover:text-red-700 text-sm font-medium">Gỡ liên kết</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="!student()?.parents?.length" class="text-center py-8 bg-gray-50 dark:bg-slate-900 rounded-lg mb-8 border border-dashed border-gray-300 dark:border-slate-600">
          <p class="text-gray-500 dark:text-slate-400">Học sinh này chưa được gán phụ huynh nào.</p>
        </div>

        <!-- Form Gán thêm Phụ huynh với tính năng Tìm kiếm -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-100 relative">
          <h4 class="font-semibold text-blue-800 dark:text-blue-300 mb-3">Gán thêm Phụ huynh từ Hệ thống</h4>

          <!-- Màn chắn (Backdrop) để tắt dropdown khi bấm ra ngoài -->
          <div *ngIf="showDropdown && !selectedParent()" (click)="showDropdown = false" class="fixed inset-0 z-0"></div>

          <div class="flex flex-col sm:flex-row gap-3 relative z-10">
            <!-- Searchable Dropdown -->
            <div class="relative flex-1">
              <input type="text" [(ngModel)]="searchTerm" (input)="filterParents(); showDropdown = true" (focus)="showDropdown = true"
                     [placeholder]="selectedParent() ? '' : '🔍 Gõ tên hoặc SĐT phụ huynh để tìm...'"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-all">

              <!-- Selected Badge Overlay -->
              <div *ngIf="selectedParent()" class="absolute inset-y-1 left-1 right-10 flex items-center bg-blue-100 dark:bg-blue-900 rounded px-3 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30">
                <span class="font-medium truncate">{{ selectedParent()?.fullName }}</span>
                <span class="ml-2 text-sm text-blue-600 dark:text-blue-400 truncate">- {{ selectedParent()?.phoneNumber }}</span>
              </div>
              <button *ngIf="selectedParent()" (click)="clearSelection(); $event.stopPropagation()" class="absolute inset-y-1 right-1 px-3 text-gray-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-md">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <!-- Dropdown List -->
              <div *ngIf="showDropdown && !selectedParent()" class="absolute w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-xl max-h-56 overflow-y-auto">
                <ul class="py-1">
                  <li *ngIf="filteredParents().length === 0" class="px-4 py-4 text-sm text-gray-500 dark:text-slate-400 text-center flex flex-col items-center">
                    <svg class="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Không tìm thấy phụ huynh nào
                  </li>
                  <li *ngFor="let p of filteredParents()" (mousedown)="selectParent(p); $event.preventDefault()"
                      class="px-4 py-3 hover:bg-blue-50 dark:bg-blue-900/20 dark:hover:bg-slate-700 cursor-pointer flex flex-col border-b border-gray-50 last:border-0 transition-colors">
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-gray-900 dark:text-white">{{ p.fullName }}</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-slate-400 mt-1">SĐT: {{ p.phoneNumber }} | Nghề: {{ p.occupation || '—' }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Dropdown chọn Vai trò -->
            <select *ngIf="selectedParent()" [(ngModel)]="selectedRelationship" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 min-w-[150px]">
              <option value="" disabled>Chọn vai trò...</option>
              <option value="Bố">Bố</option>
              <option value="Mẹ">Mẹ</option>
              <option value="Ông">Ông</option>
              <option value="Bà">Bà</option>
              <option value="Người giám hộ">Người giám hộ</option>
            </select>

            <button (click)="addParent()" [disabled]="!selectedParent() || !selectedRelationship || isLinking()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap font-medium flex items-center justify-center">
              <svg *ngIf="isLinking()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ isLinking() ? 'Đang gán...' : 'Gán vào HS' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoading()" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  `
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private parentService = inject(ParentService);
  private location = inject(Location);

  student = signal<Student | null>(null);

  // Dữ liệu cho Dropdown
  availableParents = signal<Parent[]>([]);
  filteredParents = signal<Parent[]>([]);

  isLoading = signal(true);
  isLinking = signal(false);

  // Trạng thái của Searchable Dropdown
  showDropdown = false;
  searchTerm = '';
  selectedParent = signal<Parent | null>(null);
  selectedRelationship = ''; // Khai báo lại biến lưu vai trò

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadData(+id);
      }
    });
  }

  loadData(studentId: number) {
    this.isLoading.set(true);
    this.studentService.getStudentById(studentId).subscribe(s => {
      this.student.set(s);

      this.parentService.getAllParents().subscribe(parents => {
        const linkedIds = s.parents?.map(p => p.id) || [];
        const unlinked = parents.filter(p => !linkedIds.includes(p.id));
        this.availableParents.set(unlinked);
        this.filteredParents.set(unlinked);
        this.isLoading.set(false);
      });
    });
  }

  filterParents() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredParents.set(this.availableParents());
    } else {
      this.filteredParents.set(
        this.availableParents().filter(p =>
          p.fullName.toLowerCase().includes(term) || p.phoneNumber.includes(term)
        )
      );
    }
  }

  selectParent(p: Parent) {
    this.selectedParent.set(p);
    this.searchTerm = '';
    this.showDropdown = false;
    this.selectedRelationship = 'Mother'; // Đặt mặc định gợi ý
  }

  clearSelection() {
    this.selectedParent.set(null);
    this.searchTerm = '';
    this.selectedRelationship = '';
    this.filterParents();
  }

  addParent() {
    const parent = this.selectedParent();
    if (!parent || !this.student() || !this.selectedRelationship) return;

    this.isLinking.set(true);

    // Tạm thời map các tuỳ chọn Tiếng Việt sang 3 giá trị cố định của BE
    let mappedRelationship = 'Guardian';
    if (this.selectedRelationship === 'Bố' || this.selectedRelationship === 'Ông') {
      mappedRelationship = 'Father';
    } else if (this.selectedRelationship === 'Mẹ' || this.selectedRelationship === 'Bà') {
      mappedRelationship = 'Mother';
    }

    this.studentService.addParentLink(this.student()!.id, parent.id, mappedRelationship)
      .subscribe({
        next: () => {
          this.isLinking.set(false);
          this.clearSelection();
          this.loadData(this.student()!.id);
        },
        error: (err) => {
          this.isLinking.set(false);
          alert('Có lỗi xảy ra khi gán phụ huynh: ' + (err.error?.message || err.message));
        }
      });
  }

  removeParent(parentId: number) {
    if (!this.student()) return;
    if (confirm('Gỡ bỏ liên kết với phụ huynh này?')) {
      this.studentService.removeParentLink(this.student()!.id, parentId).subscribe(() => {
        this.loadData(this.student()!.id);
      });
    }
  }

  goBack() {
    this.location.back();
  }
}

