import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<any> {
    return this.http.get<any>('/assets/mock-data/admin/dashboard.json');
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>('/assets/mock-data/users/users.json');
  }

  getCourses(): Observable<any[]> {
    return this.http.get<any[]>('/assets/mock-data/courses/admin-courses.json');
  }

  // User Mock Actions
  createUser(user: any): Observable<boolean> {
    console.log('Mock Create User:', user);
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }

  updateUser(user: any): Observable<boolean> {
    console.log('Mock Update User:', user);
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }

  deleteUser(userId: string): Observable<boolean> {
     console.log('Mock Delete User:', userId);
     return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }

  // Course Mock Actions
  createCourse(course: any): Observable<boolean> {
    console.log('Mock Create Course:', course);
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }
  
  updateCourse(course: any): Observable<boolean> {
    console.log('Mock Update Course:', course);
    return new Observable(observer => {
        setTimeout(() => {
          observer.next(true);
          observer.complete();
        }, 1000);
      });
  }

  deleteCourse(courseId: string): Observable<boolean> {
    console.log('Mock Delete Course:', courseId);
    return new Observable(observer => {
        setTimeout(() => {
          observer.next(true);
          observer.complete();
        }, 1000);
      });
  }
}
