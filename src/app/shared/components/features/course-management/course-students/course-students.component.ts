import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseStudent } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-students.component.html',
})
export class CourseStudentsComponent {
  students = input.required<CourseStudent[]>();

  private brokenAvatars = new Set<string>();

  hasAvatar(student: CourseStudent) {
    return !!student.avatar && !this.brokenAvatars.has(student.id);
  }

  handleAvatarError(student: CourseStudent) {
    this.brokenAvatars.add(student.id);
  }

  getInitials(nombre?: string, apellidos?: string) {
    const n = (nombre || '').trim().split(' ')[0] || '';
    const a = (apellidos || '').trim().split(' ')[0] || '';
    const initials = (n.charAt(0) + a.charAt(0)).toUpperCase();
    return initials || '--';
  }
}
