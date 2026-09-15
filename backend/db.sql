
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
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
 
-- Bảng Student
CREATE TABLE student (
    id             SERIAL PRIMARY KEY,
    full_name      VARCHAR(100) NOT NULL,
    date_of_birth  DATE,
    gender         VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
    class_name     VARCHAR(20),
    address        VARCHAR(255),
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
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