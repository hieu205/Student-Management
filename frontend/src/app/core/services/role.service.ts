import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role, RoleRequest, Permission } from '../models/role.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5075/api/v1/Role';

  getRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl).pipe(
      map(res => res.data.map(r => ({ ...r, id: r.roleId })))
    );
  }

  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}/permissions`).pipe(
      map(res => res.data)
    );
  }

  getRoleById(id: number): Observable<Role> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(res => ({ ...res.data, id: res.data.roleId }))
    );
  }

  createRole(role: RoleRequest): Observable<Role> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, role).pipe(
      map(res => ({ ...res.data, id: res.data.roleId }))
    );
  }

  updateRole(id: number, role: RoleRequest): Observable<Role> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, role).pipe(
      map(res => ({ ...res.data, id: res.data.roleId }))
    );
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }
}
