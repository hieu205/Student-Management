import { Component, OnInit, OnDestroy, AfterViewInit, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import * as L from 'leaflet';
import { StudentService } from '../../core/services/student.service';
import { ParentService } from '../../core/services/parent.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterLink],
  template: `
    <div class="space-y-6">

      <!-- Header & Clock -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col lg:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transform translate-x-1/2 -translate-y-1/2"></div>
        <div class="relative z-10 flex items-center gap-4 w-full lg:w-auto">
          <div class="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-200 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-slate-100">Bảng điều khiển</h1>
            <p class="text-gray-500 dark:text-slate-400 text-sm sm:text-base">Tổng quan tình hình học tập và nhân sự</p>
          </div>
        </div>
        <div class="relative z-10 bg-gray-50 dark:bg-slate-900 px-6 py-3 rounded-xl border border-gray-100 dark:border-slate-700 w-full lg:w-auto text-center lg:text-right mt-2 lg:mt-0">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-wider">{{ currentTime() | date:'HH:mm:ss' }}</div>
          <div class="text-sm text-gray-500 dark:text-slate-400 font-medium">{{ currentTime() | date:'EEEE, dd/MM/yyyy' }}</div>
        </div>
      </div>

      <!-- Summary Cards with Dropdowns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Students Card -->
        <div class="card-dropdown-container relative">
          <div (click)="toggleStudentList()" class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-500 dark:text-slate-400 font-medium mb-1">Tổng số Học sinh</p>
                <h3 class="text-3xl font-bold text-gray-800 dark:text-slate-100">{{ totalStudents() }}</h3>
              </div>
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
            </div>
            <div class="mt-4 flex items-center text-sm">
              <span class="text-green-500 font-medium flex items-center"><svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> Mới cập nhật</span>
            </div>
          </div>
          <!-- Dropdown List -->
          <div *ngIf="showStudentDropdown()" class="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 animate-fade-in-up">
            <div class="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50 dark:bg-slate-900 rounded-t-xl">
              <span class="text-sm font-bold text-gray-700 dark:text-slate-300">Học sinh (Gần đây)</span>
              <button routerLink="/students" class="text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">Xem tất cả</button>
            </div>
            <ul class="max-h-64 overflow-y-auto">
              <li *ngFor="let s of recentStudents()" class="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">{{ s.name.charAt(0) }}</div>
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-slate-100">{{ s.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">Lớp {{ s.class }}</p>
                  </div>
                </div>
                <span class="text-xs text-gray-400">{{ s.date }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Parents Card -->
        <div class="card-dropdown-container relative">
          <div (click)="toggleParentList()" class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-500 dark:text-slate-400 font-medium mb-1">Tổng số Phụ huynh</p>
                <h3 class="text-3xl font-bold text-gray-800 dark:text-slate-100">{{ totalParents() }}</h3>
              </div>
              <div class="p-3 bg-green-50 rounded-lg text-green-600 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
            </div>
            <div class="mt-4 flex items-center text-sm">
              <span class="text-green-500 font-medium flex items-center"><svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> Mới cập nhật</span>
            </div>
          </div>
          <!-- Dropdown List -->
          <div *ngIf="showParentDropdown()" class="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 animate-fade-in-up">
            <div class="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50 dark:bg-slate-900 rounded-t-xl">
              <span class="text-sm font-bold text-gray-700 dark:text-slate-300">Phụ huynh (Gần đây)</span>
              <button routerLink="/parents" class="text-green-600 text-xs hover:underline cursor-pointer">Xem tất cả</button>
            </div>
            <ul class="max-h-64 overflow-y-auto">
              <li *ngFor="let p of recentParents()" class="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">{{ p.name.charAt(0) }}</div>
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-slate-100">{{ p.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">{{ p.relation }}</p>
                  </div>
                </div>
                <span class="text-xs text-gray-500 dark:text-slate-400 font-mono">{{ p.phone }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- System Status Card -->
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-md text-white relative overflow-hidden flex flex-col justify-between">
          <div class="absolute right-0 top-0 w-32 h-32 bg-white dark:bg-slate-800/10 rounded-full mix-blend-overlay filter blur-xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-indigo-100 font-medium mb-1">Trạng thái Hệ thống</p>
              <h3 class="text-3xl font-bold">Hoạt động</h3>
            </div>
            <div class="p-3 bg-white/20 dark:bg-slate-800/20 rounded-lg backdrop-blur-sm">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
          </div>
          <div class="mt-4 flex flex-col gap-1 text-sm text-indigo-100 relative z-10">
            <div class="flex justify-between"><span>Database:</span><span class="font-bold text-white">Đã kết nối</span></div>
            <div class="flex justify-between"><span>Lần backup cuối:</span><span class="font-bold text-white">03:00 AM</span></div>
          </div>
        </div>
      </div>

      <!-- Charts & Timeline -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Bar Chart (Takes 2 columns) -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 lg:col-span-2 flex flex-col">
          <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6">Thống kê Học sinh theo Khối lớp</h3>
          <div class="flex-1 relative min-h-[250px]">
            <canvas baseChart
              [data]="barChartData"
              [options]="barChartOptions"
              [type]="barChartType">
            </canvas>
          </div>
        </div>

        <!-- Doughnut Chart -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6">Tỷ lệ Giới tính</h3>
          <div class="flex-1 relative min-h-[250px]">
            <canvas baseChart
              [data]="doughnutChartData"
              [options]="doughnutChartOptions"
              [type]="doughnutChartType">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Map Row -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
        <h3 class="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6">Bản đồ Phân bổ Địa chỉ Học sinh</h3>
        <div class="flex-1 relative min-h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
          <div id="studentMap" class="absolute inset-0 z-0"></div>
        </div>
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
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Real-time clock
  currentTime = signal(new Date());
  private timer: any;
  private map: L.Map | undefined;

  // Dropdown states for cards
  showStudentDropdown = signal(false);
  showParentDropdown = signal(false);

  private studentService = inject(StudentService);
  private parentService = inject(ParentService);

  totalStudents = signal(0);
  totalParents = signal(0);

  recentStudents = signal<any[]>([]);
  recentParents = signal<any[]>([]);

  // Chart Data: Bar Chart (Học sinh theo khối)
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  };
  public barChartType: 'bar' = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Khối 10', 'Khối 11', 'Khối 12'],
    datasets: [
      {
        data: [0, 0, 0],
        label: 'Học sinh',
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        barThickness: 40
      }
    ]
  };

  // Chart Data: Doughnut Chart (Giới tính)
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    cutout: '70%'
  };
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Nam', 'Nữ'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#3b82f6', '#ec4899'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  ngOnInit() {
    this.timer = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    // Fetch Students Data
    this.studentService.getStudents(1, 1000, '', '').subscribe(res => {
      this.totalStudents.set(res.totalCount);

      // Compute charts data
      let male = 0; let female = 0;
      const classCounts: Record<string, number> = {};

      res.items.forEach(s => {
        if (s.gender === 'Male') male++; else female++;
        if (s.className) {
          classCounts[s.className] = (classCounts[s.className] || 0) + 1;
        }
      });

      // Update Doughnut Chart (Gender)
      this.doughnutChartData = {
        labels: ['Nam', 'Nữ'],
        datasets: [{
          data: [male, female],
          backgroundColor: ['#3b82f6', '#ec4899'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      };

      // Update Bar Chart (Classes)
      const classes = Object.keys(classCounts).sort();
      this.barChartData = {
        labels: classes.length ? classes : ['Chưa có dữ liệu'],
        datasets: [{
          data: classes.length ? classes.map(c => classCounts[c]) : [0],
          label: 'Học sinh',
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          barThickness: 40
        }]
      };

      // Set recent students
      this.recentStudents.set(res.items.slice(0, 5).map(s => ({
        name: s.fullName,
        class: s.className || 'Chưa rõ',
        date: s.studentCode
      })));

      // Call async geocoding for a limited batch of students (e.g. 15 to not overload API)
      this.geocodeStudents(res.items.slice(0, 15));
    });

    // Fetch Parents Data
    this.parentService.getParents(1, 10, '').subscribe(res => {
      this.totalParents.set(res.totalCount);
      this.recentParents.set(res.items.slice(0, 5).map(p => ({
        name: p.fullName,
        phone: p.phoneNumber,
        relation: p.occupation || 'Phụ huynh'
      })));
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.map) {
      this.map.remove();
    }
  }

  private mapStudents: any[] = [];

  private initMap(): void {
    // Sửa lỗi icon mặc định của Leaflet trong Angular
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    // Zoom level 14 để nhìn rõ đường xá (Hà Nội)
    this.map = L.map('studentMap', {
      attributionControl: false
    }).setView([21.0076, 105.8196], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.renderMapMarkers();
  }

  private async geocodeStudents(students: any[]) {
    this.mapStudents = [];
    for (const s of students) {
      // Default to a random location in Hanoi if no address or geocoding fails
      let lat = 21.0076 + (Math.random() - 0.5) * 0.05;
      let lon = 105.8196 + (Math.random() - 0.5) * 0.05;

      if (s.address && s.address.trim() !== '') {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(s.address)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
            }
          }
        } catch (e) {
          console.error('Geocoding failed for', s.address);
        }
        // Respect Nominatim's rate limit of 1 req/s (delay 1 second between requests)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const mapStudent = {
        name: `${s.fullName} (${s.studentCode})`,
        address: s.address || 'Chưa cập nhật',
        coords: [lat, lon]
      };

      this.mapStudents.push(mapStudent);

      // If the map is already initialized, draw the marker immediately
      if (this.map) {
        this.renderSingleMarker(mapStudent);
      }
    }
  }

  private renderMapMarkers(): void {
    if (!this.map || !this.mapStudents.length) return;
    this.mapStudents.forEach(s => this.renderSingleMarker(s));
  }

  private renderSingleMarker(s: any): void {
    if (!this.map) return;
    L.marker(s.coords as L.LatLngExpression)
      .addTo(this.map!)
      .bindPopup(`
        <div class="text-sm">
          <strong class="text-blue-600 dark:text-blue-400 block mb-1">${s.name}</strong>
          <span>📍 ${s.address}</span>
        </div>
      `);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.card-dropdown-container')) {
      this.showStudentDropdown.set(false);
      this.showParentDropdown.set(false);
    }
  }

  toggleStudentList() {
    this.showStudentDropdown.set(!this.showStudentDropdown());
    this.showParentDropdown.set(false);
  }

  toggleParentList() {
    this.showParentDropdown.set(!this.showParentDropdown());
    this.showStudentDropdown.set(false);
  }
}

