# 🎓 Student Management System - Backend API (.NET / C#)

![.NET](https://img.shields.io/badge/.NET-8.0-purple?style=for-the-badge&logo=dotnet)
![C#](https://img.shields.io/badge/C%23-12-blue?style=for-the-badge&logo=csharp)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-brightgreen?style=for-the-badge&logo=swagger)

A RESTful Web API for managing student and parent relationships, built with .NET (C#), Entity Framework Core, and PostgreSQL using Layered Architecture.

---

## 🚀 Key Features

- **Student & Parent Relationship Management**:
  - Full CRUD operations for Students, Parents, and Admins.
  - Handles complex many-to-many relationship mapping (`StudentParentRepository`).
- **Authentication & Authorization**:
  - JWT (JSON Web Token) authentication service (`authService.cs`).
  - Secure endpoints with role-based access control.
- **Layered Architecture & Clean Code**:
  - Clear separation of concerns using Interfaces, Services, Repositories, and DTOs.
- **Robust Error Handling**:
  - Centralized exception management (`exception` directory).
- **Database & Migration**:
  - Powered by Entity Framework Core (`AppDbContext.cs`) and custom configurations (`Data/Configurations`).

---

## 🏗️ Project Directory Structure

```text
demo_dotnet/
└── backend/
    ├── Controllers/                  # API Endpoints
    ├── Data/
    │   ├── Configurations/           # EF Core Entity Configurations
    │   ├── Repositories/             # Data Access Layer
    │   │   ├── interfaces/           # Repository Interfaces
    │   │   ├── AdminRepository.cs
    │   │   ├── ParentRepository.cs
    │   │   ├── StudentParentRepository.cs
    │   │   └── StudentRepository.cs
    │   └── AppDbContext.cs           # Database Context
    ├── DTOs/                         # Data Transfer Objects
    │   ├── request/                  # Request Payloads
    │   └── response/                 # Response Models
    ├── Services/                     # Business Logic Layer
    │   ├── interface/                # Service Interfaces
    │   ├── adminService.cs
    │   ├── authService.cs
    │   ├── parentService.cs
    │   └── studentService.cs
    ├── Models/                       # Database Entities (Student, Parent, Admin, etc.)
    ├── exception/                    # Custom Exceptions & Handlers
    ├── appsettings.json              # Configuration file
    └── appsettings.Development.json  # Environment configurations
