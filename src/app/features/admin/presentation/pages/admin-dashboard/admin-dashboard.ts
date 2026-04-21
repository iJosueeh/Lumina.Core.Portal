import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService } from '../../../infrastructure/services/admin-dashboard.service';
import { Observable } from 'rxjs';
import { StatCardComponent } from '../../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private adminDashboardService = inject(AdminDashboardService);
  
  dashboardData$!: Observable<any>;
  now: string = new Date().getFullYear().toString();

  ngOnInit(): void {
    this.dashboardData$ = this.adminDashboardService.getDashboardData();
  }
}
