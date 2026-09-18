import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface AdminResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  createdAt: string;
  permissions?: string[]; // Added expected permissions array
}

export interface AdminRequest {
  fullName: string;
  email: string;
}

export interface PermissionUpdateRequest {
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:5075/api/v1/Admin';

  getProfileAdmin(id: number): Observable<AdminResponse> {
    return this.http.get<AdminResponse>(`${this.BASE_URL}/${id}`);
  }

  updateAdmin(id: number, request: AdminRequest): Observable<AdminResponse> {
    return this.http.put<AdminResponse>(`${this.BASE_URL}/${id}`, request);
  }

  // --- MOCK ENDPOINTS FOR RBAC (BE hasn't implemented these yet) ---
  getAllAdmins(): Observable<AdminResponse[]> {
    // Temporary mock data until BE is ready
    return of([
      { id: 1, username: 'admin_tong', fullName: 'Super Admin', email: 'super@admin.com', createdAt: new Date().toISOString(), permissions: ['manage_students', 'manage_parents', 'manage_rbac'] },
      { id: 2, username: 'admin_con1', fullName: 'Trần Văn Phụ', email: 'phu@admin.com', createdAt: new Date().toISOString(), permissions: ['manage_parents'] },
      { id: 3, username: 'admin_con2', fullName: 'Lê Học Sinh', email: 'hs@admin.com', createdAt: new Date().toISOString(), permissions: ['manage_students'] },
    ]);
  }

  updateAdminPermissions(id: number, permissions: string[]): Observable<any> {
    // Fake success response
    return of({ success: true, permissions });
  }
}

