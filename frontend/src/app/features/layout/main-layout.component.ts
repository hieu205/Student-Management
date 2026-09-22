import { Component, inject, HostListener, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col transition-colors duration-300 overflow-hidden">
      <!-- Top Navigation -->
      <header class="bg-blue-600 dark:bg-slate-800 text-white shadow-md transition-colors duration-300 z-20 relative">
        <div class="w-full flex justify-between h-16 items-center">

          <!-- Logo & Hamburger (Width matches sidebar) -->
          <div
            [ngClass]="isSidebarCollapsed ? 'w-16 px-0 justify-center' : 'w-64 px-2 justify-start'"
            class="flex items-center font-bold text-xl h-full transition-all duration-300 ease-in-out border-r border-blue-500/30 dark:border-slate-700 overflow-hidden shrink-0">

            <button (click)="toggleSidebar()" class="p-2 rounded-md hover:bg-blue-700 dark:hover:bg-slate-700 focus:outline-none transition-colors flex-shrink-0"
                    [ngClass]="isSidebarCollapsed ? 'mx-auto' : 'mr-2'">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div class="flex items-center gap-2 overflow-hidden transition-all duration-300"
                 [ngClass]="isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
              <span class="whitespace-nowrap">Student Admin</span>
            </div>
          </div>

          <!-- Right side actions & profile -->
          <div class="flex items-center px-4 sm:px-6 lg:px-8 gap-3">

            <!-- Dark mode toggle -->
            <button (click)="themeService.toggleDarkMode()"
                    class="p-2 rounded-full hover:bg-blue-700 dark:hover:bg-slate-700 focus:outline-none transition-colors text-white"
                    title="Chuyển chế độ giao diện">
              <svg *ngIf="!themeService.isDarkMode()" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <svg *ngIf="themeService.isDarkMode()" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>

            <!-- User profile dropdown container -->
            <div class="relative user-dropdown-container">
              <button (click)="toggleUserDropdown($event)" class="flex items-center gap-2 focus:outline-none rounded-full hover:ring-2 hover:ring-blue-300 dark:hover:ring-slate-500 transition-all">
                <div *ngIf="!avatarUrl()" class="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-100 dark:border-slate-600">
                  {{ currentUser?.fullName?.charAt(0) || 'A' }}
                </div>
                <img *ngIf="avatarUrl()" [src]="avatarUrl()" class="w-9 h-9 rounded-full object-cover shadow-sm border border-blue-100 dark:border-slate-600" alt="Avatar">
                <span class="hidden sm:block text-sm font-medium mr-1">{{ currentUser?.fullName || 'Admin' }}</span>
                <svg class="w-4 h-4 text-blue-200 dark:text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              <!-- Dropdown -->
              <div *ngIf="isUserDropdownOpen()" class="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 animate-fade-in-up overflow-hidden text-gray-800 dark:text-slate-200">
                <div class="px-4 py-3 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ currentUser?.fullName || 'Admin' }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 truncate">{{ currentUser?.username || 'admin' }}</p>
                </div>
                <div class="py-1">
                  <a routerLink="/profile" (click)="isUserDropdownOpen.set(false)" class="px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors cursor-pointer">
                    <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Hồ sơ cá nhân
                  </a>
                </div>
                <div class="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                <div class="py-1">
                  <button (click)="onLogout()" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors cursor-pointer">
                    <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      <div class="flex-1 flex w-full overflow-hidden relative">
        <!-- Mobile Sidebar Backdrop -->
        <div *ngIf="!isSidebarCollapsed"
             (click)="toggleSidebar()"
             class="md:hidden fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm z-40 animate-fade-in-up">
        </div>

        <!-- Sidebar -->
        <aside
          [ngClass]="[
            isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64',
            'fixed md:static inset-y-0 left-0 bg-white dark:bg-slate-800 shadow-sm border-r border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out z-50 overflow-hidden'
          ]">

          <!-- Mobile Close Button inside Sidebar -->
          <div class="md:hidden flex items-center justify-between p-4 border-b border-blue-500/30 dark:border-slate-700 bg-blue-600 dark:bg-slate-800 text-white">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
              <span class="font-bold text-lg whitespace-nowrap">Student Admin</span>
            </div>
            <button (click)="toggleSidebar()" class="text-white/80 hover:text-white hover:bg-blue-700 dark:hover:bg-slate-700 p-1.5 rounded-md focus:outline-none transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav class="mt-2 md:mt-5 px-2 flex-1 space-y-1 overflow-y-auto">
            <!-- Dashboard Menu -->
            <a routerLink="/" routerLinkActive="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400" [routerLinkActiveOptions]="{exact: true}"
               (click)="closeSidebarOnMobile()"
               class="text-gray-900 dark:text-slate-300 group flex items-center py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 whitespace-nowrap"
               [ngClass]="isSidebarCollapsed ? 'px-0 md:justify-center' : 'px-2 justify-start'"
               [title]="isSidebarCollapsed ? 'Dashboard' : ''">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
               </svg>
               <span class="transition-all duration-300 block overflow-hidden"
                     [ngClass]="isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'">Dashboard</span>
            </a>

            <!-- Students Menu -->
            <a routerLink="/students" routerLinkActive="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400"
               (click)="closeSidebarOnMobile()"
               class="text-gray-900 dark:text-slate-300 group flex items-center py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 mt-1 transition-all duration-300 whitespace-nowrap"
               [ngClass]="isSidebarCollapsed ? 'px-0 md:justify-center' : 'px-2 justify-start'"
               [title]="isSidebarCollapsed ? 'Học sinh' : ''">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
               <span class="transition-all duration-300 block overflow-hidden"
                     [ngClass]="isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'">Học sinh</span>
            </a>

            <!-- Parents Menu -->
            <a routerLink="/parents" routerLinkActive="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400"
               (click)="closeSidebarOnMobile()"
               class="text-gray-900 dark:text-slate-300 group flex items-center py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 mt-1 transition-all duration-300 whitespace-nowrap"
               [ngClass]="isSidebarCollapsed ? 'px-0 md:justify-center' : 'px-2 justify-start'"
               [title]="isSidebarCollapsed ? 'Phụ huynh' : ''">
              <svg class="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="transition-all duration-300 block overflow-hidden"
                    [ngClass]="isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'">Phụ huynh</span>
            </a>

            <!-- Permissions Menu -->
            <a *ngIf="authService.hasPermission('admin:read') || authService.hasPermission('admin:create') || authService.hasPermission('admin:update') || authService.hasPermission('admin:delete') || authService.hasPermission('admin_permission:assign')" routerLink="/permissions" routerLinkActive="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400"
               (click)="closeSidebarOnMobile()"
               class="text-gray-900 dark:text-slate-300 group flex items-center py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 mt-1 transition-all duration-300 whitespace-nowrap"
               [ngClass]="isSidebarCollapsed ? 'px-0 md:justify-center' : 'px-2 justify-start'"
               [title]="isSidebarCollapsed ? 'Phân quyền' : ''">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
               <span class="transition-all duration-300 block overflow-hidden"
                     [ngClass]="isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'">Phân quyền</span>
            </a>

            <!-- Roles Menu -->
            <a *ngIf="authService.hasPermission('role:read') || authService.hasPermission('role:manage')" routerLink="/roles" routerLinkActive="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400"
               (click)="closeSidebarOnMobile()"
               class="text-gray-900 dark:text-slate-300 group flex items-center py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 mt-1 transition-all duration-300 whitespace-nowrap"
               [ngClass]="isSidebarCollapsed ? 'px-0 md:justify-center' : 'px-2 justify-start'"
               [title]="isSidebarCollapsed ? 'Nhóm quyền' : ''">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
               <span class="transition-all duration-300 block overflow-hidden"
                     [ngClass]="isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'">Nhóm quyền</span>
            </a>

            <!-- Chat Menu -->
            <a routerLink="/chat" routerLinkActive="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400"
               (click)="closeSidebarOnMobile()"
               class="text-gray-900 dark:text-slate-300 group flex items-center py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 mt-1 transition-all duration-300 whitespace-nowrap"
               [ngClass]="isSidebarCollapsed ? 'px-0 md:justify-center' : 'px-2 justify-start'"
               [title]="isSidebarCollapsed ? 'Nhắn tin' : ''">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
               </svg>
               <span class="transition-all duration-300 block overflow-hidden"
                     [ngClass]="isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'">Nhắn tin</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 p-4 sm:p-6 w-full overflow-y-auto overflow-x-hidden text-gray-900 dark:text-slate-100 transition-colors duration-300">
          <router-outlet></router-outlet>
        </main>
      </div>

      <style>
        .animate-fade-in-up {
          animation: fadeInUp 0.2s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </div>
  `
})
export class MainLayoutComponent implements OnInit {
  public authService = inject(AuthService);
  themeService = inject(ThemeService);
  currentUser = this.authService.getCurrentUser();
  avatarUrl = signal<string | null>(null);

  isSidebarCollapsed = window.innerWidth < 768; // Bắt đầu ẩn nếu là màn hình nhỏ
  isUserDropdownOpen = signal(false);

  ngOnInit() {
    this.loadUserData();
    // Lắng nghe sự kiện để cập nhật Header ngay lập tức khi đổi profile
    window.addEventListener('storage', () => {
      this.loadUserData();
    });
  }

  loadUserData() {
    this.currentUser = this.authService.getCurrentUser();
    this.avatarUrl.set(localStorage.getItem('user_avatar'));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth < 768) {
      this.isSidebarCollapsed = true;
    } else {
      this.isSidebarCollapsed = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown-container')) {
      this.isUserDropdownOpen.set(false);
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
    }
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen.set(!this.isUserDropdownOpen());
  }

  onLogout() {
    this.authService.logout();
  }
}

