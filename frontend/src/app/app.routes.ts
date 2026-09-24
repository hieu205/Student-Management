import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    canActivate: [authGuard], // KÍCH HOẠT CHẶN Ở ĐÂY
    loadComponent: () => import('./features/layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./features/students/student-list.component').then(m => m.StudentListComponent)
      },
      {
        path: 'students/new',
        loadComponent: () => import('./features/students/student-form.component').then(m => m.StudentFormComponent)
      },
      {
        path: 'students/detail/:id',
        loadComponent: () => import('./features/students/student-detail.component').then(m => m.StudentDetailComponent)
      },
      {
        path: 'parents',
        loadComponent: () => import('./features/parents/parent-list.component').then(m => m.ParentListComponent)
      },
      {
        path: 'parents/new',
        loadComponent: () => import('./features/parents/parent-form.component').then(m => m.ParentFormComponent)
      },
      {
        path: 'permissions',
        loadComponent: () => import('./features/permissions/permission-manager.component').then(m => m.PermissionManagerComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/role-manager.component').then(m => m.RoleManagerComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
      }
      // Các route CRUD khác
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
