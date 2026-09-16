# API Documentation — Student Management System

> Giả định: ASP.NET Core Web API + JWT Authentication + SQL Server/EF Core.
> Chỉ **Admin** đăng nhập được vào hệ thống. Student và Parent chỉ là dữ liệu được Admin quản lý (không có tài khoản đăng nhập).

## 1. Tổng quan

Base URL: `https://localhost:5001/api`

| Module | Mô tả |
|---|---|
| Auth | Admin đăng nhập bằng `username`/`password`, nhận `accessToken` |
| Students | Admin CRUD học sinh + quản lý liên kết với phụ huynh (n-n) |
| Parents | Admin CRUD phụ huynh |

Tất cả request/response dùng `Content-Type: application/json`.

**Quy tắc chung**: mọi endpoint (trừ `/auth/login`) đều yêu cầu header:
```
Authorization: Bearer {accessToken}
```
Không có phân quyền nhiều cấp — chỉ cần có token hợp lệ là được thao tác toàn bộ.

---

## 2. Schema quan hệ

```
Admin
├── id (PK)
├── username       -- unique
├── passwordHash
├── fullName
└── email

Student
├── id (PK)
├── fullName
├── dateOfBirth
├── gender          -- "Male" | "Female"
├── className        -- vd "12A1"
└── address

Parent
├── id (PK)
├── fullName
├── phoneNumber     -- unique
├── email
└── occupation

StudentParent (n-n)
├── studentId (FK → Student)
├── parentId  (FK → Parent)
└── relationshipType   -- "Father" | "Mother" | "Guardian"
```

---

## 3. Authentication

### 3.1. POST `/auth/login`

**Request**
```json
{ "username": "admin01", "password": "123456" }
```

**Response 200**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "admin": { "id": 1, "username": "admin01", "fullName": "Nguyen Van A" }
}
```

**Response 401**
```json
{ "message": "Sai tài khoản hoặc mật khẩu" }
```

---

## 4. Students API

### 4.1. GET `/students`
**Query params**: `page`, `pageSize` (default 1/10), `search` (theo tên), `className` (lọc lớp).

**Response 200**
```json
{
  "items": [
    { "id": 1, "fullName": "Tran Thi B", "dateOfBirth": "2008-05-12", "gender": "Female", "className": "12A1", "address": "Ha Noi" }
  ],
  "totalCount": 42, "page": 1, "pageSize": 10
}
```

### 4.2. GET `/students/{id}`
Chi tiết học sinh + danh sách phụ huynh liên kết.
```json
{
  "id": 1, "fullName": "Tran Thi B", "dateOfBirth": "2008-05-12", "gender": "Female",
  "className": "12A1", "address": "Ha Noi",
  "parents": [
    { "id": 10, "fullName": "Tran Van C", "phoneNumber": "0912345678", "relationshipType": "Father" }
  ]
}
```
**Response 404**: `{ "message": "Không tìm thấy học sinh" }`

### 4.3. POST `/students`
```json
{
  "fullName": "Tran Thi B", "dateOfBirth": "2008-05-12", "gender": "Female",
  "className": "12A1", "address": "Ha Noi"
}
```
**Response 201**: Student vừa tạo (`parents: []`). Gán phụ huynh riêng qua mục 4.6.

### 4.4. PUT `/students/{id}`
Body giống POST. **Response 200**: Student đã cập nhật.

### 4.5. DELETE `/students/{id}`
**Response 204**. **Response 409** nếu còn ràng buộc dữ liệu liên quan.

### 4.6. Quản lý liên kết Student ↔ Parent

`POST /students/{studentId}/parents`
```json
{ "parentId": 10, "relationshipType": "Father" }
```
**Response 201**: `{ "studentId": 1, "parentId": 10, "relationshipType": "Father" }`
**Response 409** nếu liên kết đã tồn tại.

`DELETE /students/{studentId}/parents/{parentId}` → **Response 204** (chỉ xóa liên kết, không xóa Parent).

---

## 5. Parents API

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/parents` | Danh sách (phân trang, search theo tên/sđt) |
| GET | `/parents/{id}` | Chi tiết + danh sách học sinh liên kết |
| POST | `/parents` | Tạo mới |
| PUT | `/parents/{id}` | Cập nhật |
| DELETE | `/parents/{id}` | Xóa (409 nếu đang liên kết học sinh) |

**POST/PUT body**
```json
{
  "fullName": "Tran Van C", "phoneNumber": "0912345678",
  "email": "c.tran@example.com", "occupation": "Kỹ sư"
}
```

---

## 6. Quy ước chung

### 6.1. HTTP Status Codes
| Code | Ý nghĩa |
|---|---|
| 200 | Thành công (GET/PUT) |
| 201 | Tạo mới (POST) |
| 204 | Xóa thành công |
| 400 | Dữ liệu không hợp lệ |
| 401 | Chưa đăng nhập / token hết hạn |
| 404 | Không tìm thấy |
| 409 | Xung đột (trùng dữ liệu, ràng buộc khóa ngoại) |
| 500 | Lỗi server |

### 6.2. Format lỗi chuẩn (validation)
```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": {
    "fullName": ["Họ tên không được để trống"],
    "phoneNumber": ["Số điện thoại không đúng định dạng"]
  }
}
```

### 6.3. Quy ước đặt tên
- Field JSON: `camelCase`. Date: `yyyy-MM-dd`. DateTime: `yyyy-MM-ddTHH:mm:ssZ`.

---

## 7. Việc mỗi bên có thể làm ngay (song song)

**Backend**
- DbContext: `Admin`, `Student`, `Parent`, `StudentParent` (composite key `studentId + parentId`).
- Implement Auth (JWT) trước, sau đó Students → Parents.
- Seed 1 tài khoản Admin + vài Student/Parent mẫu để FE test sớm.

**Frontend**
- Mock đúng response mẫu ở tài liệu này (JSON Server/MSW) → code UI/gọi API độc lập, không cần chờ BE.
- 2 màn: Login → Student CRUD (list/detail có tab "Phụ huynh liên kết" để add/remove).

Khi BE xong, FE chỉ cần đổi base URL / bỏ mock — vì đã theo đúng contract này.
