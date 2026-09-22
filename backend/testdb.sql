
-- ============================================
-- Student Management System — PostgreSQL Schema
-- ============================================
 
-- Bảng Admin (tài khoản đăng nhập duy nhất)
CREATE TABLE admin (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100),
    role_id       INT NOT NULL DEFAULT 1,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
 
-- Bảng Student
CREATE TABLE student (
    id             SERIAL PRIMARY KEY,
    full_name      VARCHAR(100) NOT NULL,
    date_of_birth  VARCHAR(50),
    gender         VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
    class_name     VARCHAR(20),
    address        VARCHAR(255)
);
 
-- Bảng Parent
CREATE TABLE parent (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    phone_number  VARCHAR(20) NOT NULL UNIQUE,
    email         VARCHAR(100),
    occupation    VARCHAR(100),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
 
-- Bảng trung gian Student <-> Parent (n-n)
CREATE TABLE student_parent (
    student_id        INT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    parent_id         INT NOT NULL REFERENCES parent(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('Father', 'Mother', 'Guardian')),
    PRIMARY KEY (student_id, parent_id)
);
 
-- Index phụ trợ cho tìm kiếm/lọc thường dùng
CREATE INDEX idx_student_full_name ON student (full_name);
CREATE INDEX idx_student_class_name ON student (class_name);
CREATE INDEX idx_parent_full_name ON parent (full_name);
CREATE INDEX idx_student_parent_parent_id ON student_parent (parent_id);

ALTER TABLE student
ADD COLUMN mhs VARCHAR(20) NOT NULL UNIQUE;

-- 1. Bảng Permission (Đơn vị quyền nhỏ nhất)
CREATE TABLE permission (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,   -- vd: student:create
    description VARCHAR(255)
);

-- 2. Bảng Role (Chỉ dùng làm khuôn mẫu)
CREATE TABLE role (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,    -- vd: STUDENT_MANAGER
    description VARCHAR(255)
);

-- 3. Bảng Role_Permission (Template mapping)
CREATE TABLE role_permission (
    role_id       INT NOT NULL REFERENCES role(id)       ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Bảng Admin_Permission (Bảng thực tế quyết định quyền của Admin)
CREATE TABLE admin_permission (
    admin_id      INT NOT NULL REFERENCES admin(id)      ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, permission_id)
);

-- 5. Xóa cột role_id ở bảng admin cũ
ALTER TABLE admin DROP COLUMN role_id;

-- ============================================
-- Cập nhật bổ sung cho bảng admin (Forgot Password Feature)
-- ============================================

-- 1. Thêm cột password_reset_token để lưu Token đặt lại mật khẩu
ALTER TABLE admin 
ADD COLUMN password_reset_token VARCHAR(255);

-- 2. Thêm cột reset_token_expires để lưu thời gian hết hạn của Token
ALTER TABLE admin 
ADD COLUMN reset_token_expires TIMESTAMP;

-- 3. (Tùy chọn tối ưu) Tạo Index giúp truy vấn tìm kiếm Token trong DB nhanh hơn
CREATE INDEX idx_admin_password_reset_token ON admin (password_reset_token);

-- ============================================
-- Bổ sung Tính năng Realtime Chat Admin <-> Admin
-- Schema PostgreSQL
-- ============================================

-- 1. Tạo Bảng chat_room (Quản lý phòng chat giữa 2 Admin)
CREATE TABLE chat_room (
    id         BIGSERIAL PRIMARY KEY,
    admin1_id  INT NOT NULL REFERENCES admin(id) ON DELETE RESTRICT,
    admin2_id  INT NOT NULL REFERENCES admin(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Đảm bảo giữa 2 Admin bất kỳ chỉ tồn tại duy nhất 1 phòng chat
    CONSTRAINT uq_admin1_admin2 UNIQUE (admin1_id, admin2_id)
);

-- 2. Tạo Bảng chat_message (Lưu trữ tin nhắn)
CREATE TABLE chat_message (
    id         BIGSERIAL PRIMARY KEY,
    room_id    BIGINT NOT NULL REFERENCES chat_room(id) ON DELETE CASCADE,
    sender_id  INT NOT NULL REFERENCES admin(id) ON DELETE RESTRICT,
    content    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Tạo các Indexes phụ trợ để tối ưu tốc độ truy vấn
CREATE INDEX idx_chat_room_admin1 ON chat_room (admin1_id);
CREATE INDEX idx_chat_room_admin2 ON chat_room (admin2_id);
CREATE INDEX idx_chat_room_updated_at ON chat_room (updated_at DESC);

CREATE INDEX idx_chat_message_room_created ON chat_message (room_id, created_at DESC);
CREATE INDEX idx_chat_message_unread ON chat_message (room_id, sender_id, is_read) WHERE is_read = FALSE;