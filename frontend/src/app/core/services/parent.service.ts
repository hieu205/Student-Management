import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { Parent } from '../models/parent.model';
import { PaginatedResult } from '../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  // Dữ liệu mock bám sát schema DB: fullName, phoneNumber, email, occupation
  private parents: Parent[] = [
    { id: 10, fullName: 'Trần Văn C', phoneNumber: '0912345678', email: 'c.tran@example.com', occupation: 'Kỹ sư' },
    { id: 11, fullName: 'Nguyễn Thị H', phoneNumber: '0987654321', email: 'h.nguyen@example.com', occupation: 'Giáo viên' },
    { id: 12, fullName: 'Lê Văn T', phoneNumber: '0909112233', email: 't.le@example.com', occupation: 'Bác sĩ' },
    { id: 13, fullName: 'Phạm Minh Đ', phoneNumber: '0988112233', email: 'd.pham@example.com', occupation: 'Kinh doanh tự do' }
  ];

  getParents(page: number = 1, pageSize: number = 10, search: string = '', sortBy: string = '', sortDir: 'asc'|'desc' = 'asc'): Observable<PaginatedResult<Parent>> {
    let filtered = this.parents;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(x =>
        x.fullName.toLowerCase().includes(s) ||
        x.phoneNumber.includes(s)
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

  // Dùng để đổ vào dropdown khi gán phụ huynh cho học sinh
  getAllParents(): Observable<Parent[]> {
    return of([...this.parents]).pipe(delay(200));
  }

  getParentById(id: number): Observable<Parent> {
    const parent = this.parents.find(p => p.id === id);
    if (parent) {
      return of({ ...parent }).pipe(delay(200));
    }
    return throwError(() => new Error('Không tìm thấy phụ huynh'));
  }

  // Tiện ích để lấy parent object
  getParentSync(id: number): Parent | undefined {
    return this.parents.find(p => p.id === id);
  }

  createParent(data: Omit<Parent, 'id'>): Observable<Parent> {
    // Kiểm tra ràng buộc UNIQUE của Số điện thoại
    if (this.parents.some(p => p.phoneNumber === data.phoneNumber)) {
      return throwError(() => new Error('Số điện thoại này đã tồn tại trong hệ thống!'));
    }
    // Kiểm tra ràng buộc UNIQUE của Email (nếu có nhập)
    if (data.email && this.parents.some(p => p.email?.toLowerCase() === data.email?.toLowerCase())) {
      return throwError(() => new Error('Email này đã được sử dụng bởi phụ huynh khác!'));
    }

    const newParent: Parent = {
      ...data,
      id: Math.max(...this.parents.map(p => p.id), 0) + 1
    };
    this.parents.push(newParent);
    return of(newParent).pipe(delay(400));
  }

  updateParent(id: number, data: Partial<Parent>): Observable<Parent> {
    // Kiểm tra ràng buộc UNIQUE (bỏ qua chính nó)
    if (data.phoneNumber && this.parents.some(p => p.phoneNumber === data.phoneNumber && p.id !== id)) {
      return throwError(() => new Error('Số điện thoại này đã được sử dụng bởi phụ huynh khác!'));
    }
    if (data.email && this.parents.some(p => p.email?.toLowerCase() === data.email?.toLowerCase() && p.id !== id)) {
      return throwError(() => new Error('Email này đã được sử dụng bởi phụ huynh khác!'));
    }

    const index = this.parents.findIndex(p => p.id === id);
    if (index !== -1) {
      this.parents[index] = { ...this.parents[index], ...data };
      return of(this.parents[index]).pipe(delay(400));
    }
    return throwError(() => new Error('Không tìm thấy phụ huynh'));
  }

  deleteParent(id: number): Observable<boolean> {
    this.parents = this.parents.filter(p => p.id !== id);
    return of(true).pipe(delay(300));
  }
}

