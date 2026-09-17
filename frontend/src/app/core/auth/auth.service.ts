import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  admin: {
    id: number;
    username: string;
    fullName: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly BASE_URL = 'http://localhost:5075/api/v1/auth';

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE_URL}/auth/login`, credentials);
  }

  // --- Các hàm tiện ích quản lý Token ---

  setToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setCurrentUser(user: any) {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    // Điều hướng về trang login
    this.router.navigate(['/login']);
  }
}
