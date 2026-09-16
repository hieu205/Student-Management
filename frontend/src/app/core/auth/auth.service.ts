import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  // Giả lập API Login trả về JWT dựa trên API_DOCS
  login(credentials: { username: string; password: string }): Observable<any> {
    if (credentials.username === 'admin01' && credentials.password === 'Admin@123') {
      const mockResponse = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_for_admin01',
        expiresIn: 3600,
        admin: { id: 1, username: 'admin01', fullName: 'Nguyen Van A', email: 'admin@edu.min' }
      };
      return of(mockResponse).pipe(delay(500));
    } else {
      return throwError(() => ({ message: 'Sai tài khoản hoặc mật khẩu' })).pipe(delay(500));
    }
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
