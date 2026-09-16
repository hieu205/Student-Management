import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { Student, PaginatedResult } from '../models/student.model';
import { Parent } from '../models/parent.model';

import { ParentService } from './parent.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private parentService = inject(ParentService);

  // --- MOCK DATA ---
  private students: Student[] = [
    {
      id: 1, studentCode: 'HS001', fullName: 'Trần Thị B', dateOfBirth: '2008-05-12', gender: 'Female', className: '12A1', address: 'Hà Nội',
      parents: [
        { id: 101, fullName: 'Trần Văn X', phoneNumber: '0901111111', email: 'x@test.com', occupation: 'Kỹ sư', address: 'Hà Nội', relationshipType: 'Bố' },
        { id: 102, fullName: 'Lê Thị Y', phoneNumber: '0902222222', email: 'y@test.com', occupation: 'Giáo viên', address: 'Hà Nội', relationshipType: 'Mẹ' }
      ]
    },
    {
      id: 2, studentCode: 'HS002', fullName: 'Nguyễn Văn A', dateOfBirth: '2008-10-20', gender: 'Male', className: '12A1', address: 'TP.HCM',
      parents: [
        { id: 103, fullName: 'Nguyễn Văn Z', phoneNumber: '0903333333', email: 'z@test.com', occupation: 'Bác sĩ', address: 'TP.HCM', relationshipType: 'Bố' },
        { id: 104, fullName: 'Phạm Thị M', phoneNumber: '0904444444', email: 'm@test.com', occupation: 'Kế toán', address: 'TP.HCM', relationshipType: 'Mẹ' },
        { id: 105, fullName: 'Nguyễn Ông Nội', phoneNumber: '0905555555', email: 'noi@test.com', occupation: 'Hưu trí', address: 'TP.HCM', relationshipType: 'Ông nội' },
        { id: 106, fullName: 'Nguyễn Bà Nội', phoneNumber: '0906666666', email: 'banoi@test.com', occupation: 'Hưu trí', address: 'TP.HCM', relationshipType: 'Bà nội' }
      ]
    },
    { id: 3, studentCode: 'HS003', fullName: 'Lê Hoàng C', dateOfBirth: '2009-01-15', gender: 'Male', className: '11B2', address: 'Đà Nẵng', parents: [] },
    { id: 4, studentCode: 'HS004', fullName: 'Phạm Minh D', dateOfBirth: '2009-08-30', gender: 'Female', className: '11B2', address: 'Hải Phòng', parents: [] },
    { id: 5, studentCode: 'HS005', fullName: 'Vũ Đức E', dateOfBirth: '2010-03-05', gender: 'Male', className: '10C3', address: 'Cần Thơ', parents: [] },
    { id: 6, studentCode: 'HS006', fullName: 'Hoàng Thị F', dateOfBirth: '2011-07-22', gender: 'Female', className: '9A4', address: 'Nha Trang', parents: [] },
  ];

  // --- API Học sinh ---

  getStudents(page: number = 1, pageSize: number = 10, search: string = '', sortBy: string = '', sortDir: 'asc'|'desc' = 'asc'): Observable<PaginatedResult<Student>> {
    let filtered = this.students;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(x =>
        x.fullName.toLowerCase().includes(s) ||
        x.studentCode.toLowerCase().includes(s)
      );
    }

    if (sortBy) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return of({
      items,
      totalCount: filtered.length,
      page,
      pageSize
    });
  }

  getStudentById(id: number): Observable<Student> {
    const student = this.students.find(s => s.id === id);
    if (student) {
      return of({ ...student }).pipe(delay(300));
    }
    return throwError(() => new Error('Không tìm thấy học sinh'));
  }

  createStudent(student: Omit<Student, 'id'>): Observable<Student> {
    // Kiểm tra trùng Mã học sinh
    if (this.students.some(s => s.studentCode === student.studentCode)) {
      return throwError(() => new Error('Mã học sinh này đã tồn tại trong hệ thống!'));
    }

    const newStudent: Student = {
      ...student,
      id: Math.max(...this.students.map(s => s.id), 0) + 1,
      parents: []
    };
    this.students.push(newStudent); // Thêm xuống cuối danh sách
    return of(newStudent).pipe(delay(500));
  }

  updateStudent(id: number, data: Partial<Student>): Observable<Student> {
    // Kiểm tra trùng Mã học sinh khi cập nhật (bỏ qua chính nó)
    if (data.studentCode && this.students.some(s => s.studentCode === data.studentCode && s.id !== id)) {
      return throwError(() => new Error('Mã học sinh này đã được sử dụng bởi học sinh khác!'));
    }

    const index = this.students.findIndex(s => s.id === id);
    if (index !== -1) {
      this.students[index] = { ...this.students[index], ...data };
      return of(this.students[index]).pipe(delay(500));
    }
    return throwError(() => new Error('Không tìm thấy học sinh'));
  }

  deleteStudent(id: number): Observable<boolean> {
    this.students = this.students.filter(s => s.id !== id);
    return of(true).pipe(delay(400));
  }

  // --- API Gán Phụ Huynh ---

  addParentLink(studentId: number, parentId: number, relationshipType: string): Observable<any> {
    const student = this.students.find(s => s.id === studentId);

    // Sử dụng parentService đã được inject ở đầu class
    const parent = this.parentService.getParentSync(parentId);

    if (student && parent) {
      if (!student.parents) student.parents = [];
      // Kiểm tra tránh gán trùng
      if (!student.parents.find(p => p.id === parentId)) {
        student.parents.push({ ...parent, relationshipType });
      }
      return of(true).pipe(delay(400));
    }
    return throwError(() => new Error('Dữ liệu không hợp lệ'));
  }

  removeParentLink(studentId: number, parentId: number): Observable<any> {
    const student = this.students.find(s => s.id === studentId);
    if (student && student.parents) {
      student.parents = student.parents.filter(p => p.id !== parentId);
    }
    return of(true).pipe(delay(400));
  }
}

