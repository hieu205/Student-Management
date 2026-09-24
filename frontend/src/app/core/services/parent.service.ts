import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Parent } from '../models/parent.model';
import { PaginatedResult } from '../models/pagination.model';

export interface ParentRequest {
  fullName: string;
  phoneNumber: string;
  email?: string;
  occupation?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  private http = inject(HttpClient);

  private readonly BASE_URL = 'http://localhost:5075/api/v1/parent';

  getParents(page: number = 1, pageSize: number = 10, search: string = '', sortBy: string = '', sortDir: 'asc' | 'desc' = 'asc'): Observable<PaginatedResult<Parent>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<Parent[]>(this.BASE_URL, { params }).pipe(
      map(list => {
        // Sắp xếp phía client nếu cần
        if (sortBy) {
          list.sort((a: any, b: any) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });
        }

        // Phân trang phía client
        const totalCount = list.length;
        const startIndex = (page - 1) * pageSize;
        const items = list.slice(startIndex, startIndex + pageSize);

        return { items, totalCount, page, pageSize };
      })
    );
  }

  // Dùng để đổ vào dropdown khi gán phụ huynh cho học sinh
  getAllParents(): Observable<Parent[]> {
    return this.http.get<Parent[]>(this.BASE_URL);
  }

  getParentById(id: number): Observable<Parent> {
    return this.http.get<Parent>(`${this.BASE_URL}/${id}`);
  }

  createParent(data: Omit<Parent, 'id'>): Observable<Parent> {
    const body: ParentRequest = {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email || undefined,
      occupation: data.occupation || undefined,
      address: data.address || undefined
    };
    return this.http.post<Parent>(this.BASE_URL, body);
  }

  updateParent(id: number, data: Partial<Parent>): Observable<Parent> {
    const body: Partial<ParentRequest> = {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email || undefined,
      occupation: data.occupation || undefined,
      address: data.address || undefined
    };
    return this.http.put<Parent>(`${this.BASE_URL}/${id}`, body);
  }

  deleteParent(id: number): Observable<boolean> {
    return this.http.delete(`${this.BASE_URL}/${id}`).pipe(
      map(() => true)
    );
  }
}
