import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCourse } from '@shared/models/admin-course.models';
import { StatusBadgeComponent } from '../../../../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../../../../../../shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-admin-course-table',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, SkeletonLoaderComponent],
  templateUrl: './course-table.component.html',
  styleUrl: './course-table.component.css'
})
export class CourseTableComponent {
  @Input({ required: true }) courses: AdminCourse[] = [];
  @Input() isLoading = false;
  @Output() edit = new EventEmitter<AdminCourse>();
  @Output() delete = new EventEmitter<AdminCourse>();
}
