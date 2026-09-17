import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface AdminRequest {
  fullName: string;
  email: string;
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
}

