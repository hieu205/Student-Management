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

  getAllAdmins(): Observable<AdminResponse[]> {
    return this.http.get<AdminResponse[]>(this.BASE_URL);
  }

  updateAdminPermissions(id: number, permissions: string[]): Observable<any> {
    return this.http.put(`${this.BASE_URL}/${id}/permissions`, { permissionCodes: permissions });
  }

  addAdmin(data: any): Observable<AdminResponse> {
    return this.http.post<AdminResponse>(this.BASE_URL, data);
  }

  deleteAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/${id}`);
  }
}
