export interface Parent {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  occupation: string;
  address?: string;
  relationship?: string;
}

export interface StudentParent {
  studentId: number;
  parentId: number;
  relationshipType: string;
}

