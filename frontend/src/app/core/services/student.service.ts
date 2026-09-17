import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Student, PaginatedResult } from '../models/student.model';

export interface StudentRequest {
  mhs: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  className?: string;
  address?: string;
}

export interface AddParentToStudentRequest {
  parentId: number;
  relationshipType: string;
}

// Interface khớp với StudentResponseDto / StudentDetailResponseDto của BE
interface StudentResponseDto {
  id: number;
  mhs: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  className?: string;
  address?: string;
  parents?: { id: number; fullName: string; phoneNumber: string; relationshipType: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private http = inject(HttpClient);

  private readonly BASE_URL = 'http://localhost:5075/api/v1';

  // Chuyển đổi từ DTO của BE sang Model của FE
  private mapToStudent(dto: StudentResponseDto): Student {
    return {
      id: dto.id,
      studentCode: dto.mhs,
      fullName: dto.fullName,
      dateOfBirth: dto.dateOfBirth ?? '',
      gender: (dto.gender as 'Male' | 'Female') ?? 'Male',
      className: dto.className ?? '',
      address: dto.address ?? '',
      parents: dto.parents?.map(p => ({
        id: p.id,
        fullName: p.fullName,
        phoneNumber: p.phoneNumber,
        email: '',
        occupation: '',
        relationshipType: p.relationshipType
      })) ?? []
    };
  }

  // --- API Học sinh ---

  getStudents(page: number = 1, pageSize: number = 10, search: string = '', sortBy: string = '', sortDir: 'asc' | 'desc' = 'asc'): Observable<PaginatedResult<Student>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (search) params = params.set('search', search);

    return this.http.get<StudentResponseDto[]>(`${this.BASE_URL}/student`, { params }).pipe(
      map(list => {
        const students = list.map(dto => this.mapToStudent(dto));

        // Sắp xếp phía client nếu cần (BE chưa hỗ trợ sortBy)
        if (sortBy) {
          students.sort((a: any, b: any) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });
        }

        // Phân trang phía client nếu BE trả về toàn bộ
        const totalCount = students.length;
        const startIndex = (page - 1) * pageSize;
        const items = students.slice(startIndex, startIndex + pageSize);

        return { items, totalCount, page, pageSize };
      })
    );
  }

  getStudentById(id: number): Observable<Student> {
    return this.http.get<StudentResponseDto>(`${this.BASE_URL}/student/${id}`).pipe(
      map(dto => this.mapToStudent(dto))
    );
  }

  createStudent(student: Omit<Student, 'id'>): Observable<Student> {
    const body: StudentRequest = {
      mhs: student.studentCode,
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth || undefined,
      gender: student.gender || undefined,
      className: student.className || undefined,
      address: student.address || undefined
    };
    return this.http.post<StudentResponseDto>(`${this.BASE_URL}/student`, body).pipe(
      map(dto => this.mapToStudent(dto))
    );
  }

  updateStudent(id: number, data: Partial<Student>): Observable<Student> {
    const body: Partial<StudentRequest> = {
      mhs: data.studentCode,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender || undefined,
      className: data.className || undefined,
      address: data.address || undefined
    };
    return this.http.put<StudentResponseDto>(`${this.BASE_URL}/student/${id}`, body).pipe(
      map(dto => this.mapToStudent(dto))
    );
  }

  deleteStudent(id: number): Observable<boolean> {
    return this.http.delete(`${this.BASE_URL}/student/${id}`).pipe(
      map(() => true)
    );
  }

  // --- API Gán Phụ Huynh ---

  addParentLink(studentId: number, parentId: number, relationshipType: string): Observable<any> {
    const body: AddParentToStudentRequest = { parentId, relationshipType };
    return this.http.post(`${this.BASE_URL}/student/${studentId}/parents`, body);
  }

  removeParentLink(studentId: number, parentId: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/student/${studentId}/parents/${parentId}`);
  }
}
