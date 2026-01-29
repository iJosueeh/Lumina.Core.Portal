import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../infrastructure/services/admin.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  dashboardData$!: Observable<any>;
  now: string = new Date().getFullYear().toString();

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.dashboardData$ = this.adminService.getDashboardData();
  }
}
