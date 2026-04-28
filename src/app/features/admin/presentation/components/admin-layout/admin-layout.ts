import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  isSidebarOpen = false;
  userName = 'Administrador'; // Mock
  userRole = 'Admin'; // Mock
  
  menuItems = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Analytics', route: '/admin/analytics', icon: 'bar-chart' },
    { label: 'Institutions', route: '/admin/institutions', icon: 'building' },
    { label: 'Scholars', route: '/admin/scholars', icon: 'user-graduate' },
    { label: 'Archive', route: '/admin/archive', icon: 'archive' },
    { label: 'Reports', route: '/admin/reports', icon: 'file-alt' }
  ];

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
