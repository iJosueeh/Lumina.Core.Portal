import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth.repository.impl';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { CoursesRepository } from '@features/student/domain/repositories/courses.repository';
import { CoursesHttpRepositoryImpl } from '@features/student/infrastructure/repositories/courses-http.repository.impl';
import { AssignmentsRepository } from '@features/student/domain/repositories/assignments.repository';
import { AssignmentsHttpRepositoryImpl } from '@features/student/infrastructure/repositories/assignments-http.repository.impl';
import { AnnouncementsRepository } from '@features/student/domain/repositories/announcements.repository';
import { AnnouncementsHttpRepositoryImpl } from '@features/student/infrastructure/repositories/announcements-http.repository.impl';
import { ResourcesRepository } from '@features/student/domain/repositories/resources.repository';
import { ResourcesHttpRepositoryImpl } from '@features/student/infrastructure/repositories/resources-http.repository.impl';
import { GradesRepository } from '@features/student/domain/repositories/grades.repository';
import { GradesHttpRepositoryImpl } from '@features/student/infrastructure/repositories/grades-http.repository.impl';
import { ScheduleRepository } from '@features/student/domain/repositories/schedule.repository';
import { ScheduleHttpRepositoryImpl } from '@features/student/infrastructure/repositories/schedule-http.repository.impl';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { TeacherCourseHttpRepositoryImpl } from '@features/teacher/infrastructure/repositories/teacher-course-http.repository.impl';
import { GradesManagementRepository } from '@features/teacher/domain/repositories/grades-management.repository';
import { GradesManagementHttpRepositoryImpl } from '@features/teacher/infrastructure/repositories/grades-management-http.repository.impl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Auth
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
    // Student Repositories
    { provide: CoursesRepository, useClass: CoursesHttpRepositoryImpl },
    { provide: AssignmentsRepository, useClass: AssignmentsHttpRepositoryImpl },
    { provide: AnnouncementsRepository, useClass: AnnouncementsHttpRepositoryImpl },
    { provide: ResourcesRepository, useClass: ResourcesHttpRepositoryImpl },
    { provide: GradesRepository, useClass: GradesHttpRepositoryImpl },
    { provide: ScheduleRepository, useClass: ScheduleHttpRepositoryImpl },
    // Teacher Repositories
    { provide: TeacherCourseRepository, useClass: TeacherCourseHttpRepositoryImpl },
    { provide: GradesManagementRepository, useClass: GradesManagementHttpRepositoryImpl }
  ]
};
