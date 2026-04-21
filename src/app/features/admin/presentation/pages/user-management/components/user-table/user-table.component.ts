import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUser } from '@shared/models/admin-user.models';
import { StatusBadgeComponent } from '../../../../../../../shared/components/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-user-table',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css'
})
export class UserTableComponent {
  @Input({ required: true }) users: AdminUser[] = [];
  @Output() edit = new EventEmitter<AdminUser>();
  @Output() delete = new EventEmitter<AdminUser>();
}
