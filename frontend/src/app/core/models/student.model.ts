import { Parent } from './parent.model';

export interface Student {
  id: number;
  studentCode: string; // Đã bổ sung trường mã học sinh như yêu cầu
  fullName: string;
  dateOfBirth: string; // yyyy-MM-dd
  gender: 'Male' | 'Female';
  className: string;
  address: string;
  parents?: LinkedParent[]; // Dùng để hiển thị danh sách phụ huynh ở trang chi tiết
}

export interface LinkedParent extends Parent {
  relationshipType: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

