import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUserService } from './admin-user.service';
import { AdminCourseService } from './admin-course.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { GuidUtils } from '../../../../shared/utils/guid.utils';

/**
 * @deprecated Use specialized services (AdminUserService, AdminCourseService, AdminDashboardService)
 * This class now acts as a Facade to maintain backward compatibility.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private userService = inject(AdminUserService);
  private courseService = inject(AdminCourseService);
  private dashboardService = inject(AdminDashboardService);

  // Dashboard
  getDashboardData(): Observable<any> {
    return this.dashboardService.getDashboardData();
  }

  // Users
  getUsers(): Observable<any[]> {
    return this.userService.getUsers();
  }

  createUser(userData: any): Observable<any> {
    return this.userService.createUser(userData);
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.userService.updateUser(id, userData);
  }

  deleteUser(id: string): Observable<any> {
    return this.userService.deleteUser(id);
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.userService.checkEmailExists(email);
  }

  // Courses
  getCourses(): Observable<any[]> {
    return this.courseService.getCourses();
  }

  getCourseDetail(courseId: string): Observable<any> {
    return this.courseService.getCourseDetail(courseId);
  }

  getDocentes(): Observable<any[]> {
    return this.courseService.getDocentes();
  }

  // Utility
  extractGuid(value: any): string | null {
    return GuidUtils.extractGuid(value);
  }
}
