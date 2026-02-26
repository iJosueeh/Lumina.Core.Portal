import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth.repository.impl';
import { AuthMockRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-mock.repository.impl';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { CoursesRepository } from '@features/student/domain/repositories/courses.repository';
import { CoursesHttpRepositoryImpl } from '@features/student/infrastructure/repositories/courses-http.repository.impl';
import { AssignmentsRepository } from '@features/student/domain/repositories/assignments.repository';
import { AssignmentsHttpRepositoryImpl } from '@features/student/infrastructure/repositories/assignments-http.repository.impl';
import { AssignmentsMockRepositoryImpl } from '@features/student/infrastructure/repositories/assignments-mock.repository.impl';
import { AnnouncementsRepository } from '@features/student/domain/repositories/announcements.repository';
import { AnnouncementsHttpRepositoryImpl } from '@features/student/infrastructure/repositories/announcements-http.repository.impl';
import { ResourcesRepository } from '@features/student/domain/repositories/resources.repository';
import { ResourcesHttpRepositoryImpl } from '@features/student/infrastructure/repositories/resources-http.repository.impl';
import { GradesRepository } from '@features/student/domain/repositories/grades.repository';
import { GradesHttpRepositoryImpl } from '@features/student/infrastructure/repositories/grades-http.repository.impl';
import { GradesMockRepositoryImpl } from '@features/student/infrastructure/repositories/grades-mock.repository.impl';
import { ScheduleRepository } from '@features/student/domain/repositories/schedule.repository';
import { ScheduleHttpRepositoryImpl } from '@features/student/infrastructure/repositories/schedule-http.repository.impl';
import { CoursesMockRepositoryImpl } from '@features/student/infrastructure/repositories/courses-mock.repository.impl';
import { AnnouncementsMockRepositoryImpl } from '@features/student/infrastructure/repositories/announcements-mock.repository.impl';
import { ResourcesMockRepositoryImpl } from '@features/student/infrastructure/repositories/resources-mock.repository.impl';
import { environment } from '../environments/environment';
import { ProfileRepository } from '@features/student/domain/repositories/profile.repository';
import { ProfileMockRepositoryImpl } from '@features/student/infrastructure/repositories/profile-mock.repository.impl';
import { AccountRepository } from '@features/student/domain/repositories/account.repository';
import { AccountMockRepositoryImpl } from '@features/student/infrastructure/repositories/account-mock.repository.impl';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { TeacherCourseHttpRepositoryImpl } from '@features/teacher/infrastructure/repositories/teacher-course-http.repository.impl';

import { GradesManagementRepository } from '@features/teacher/domain/repositories/grades-management.repository';
import { GradesManagementHttpRepositoryImpl } from '@features/teacher/infrastructure/repositories/grades-management-http.repository.impl';
import { TeacherInfoRepository } from '@features/teacher/domain/repositories/teacher-info.repository';
import { TeacherInfoHttpRepositoryImpl } from '@features/teacher/infrastructure/repositories/teacher-info-http.repository.impl';
import { TeacherStudentRepository } from '@features/teacher/domain/repositories/teacher-student.repository';
import { TeacherStudentHttpRepositoryImpl } from '@features/teacher/infrastructure/repositories/teacher-student-http.repository.impl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // TanStack Query configuration
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos - datos frescos
            gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en caché (antes cacheTime)
            retry: 2, // Reintentar 2 veces en caso de error
            refetchOnWindowFocus: false, // No refetch al volver a la ventana
            refetchOnReconnect: true, // Refetch al reconectar internet
          },
        },
      })
    ),
    // Auth (condicional basado en useMockData)
    {
      provide: AuthRepository,
      useClass: environment.useMockData ? AuthMockRepositoryImpl : AuthRepositoryImpl,
    },
    // Student Repositories (condicionales basados en useMockData)
    {
      provide: CoursesRepository,
      useClass: environment.useMockData ? CoursesMockRepositoryImpl : CoursesHttpRepositoryImpl,
    },
    {
      provide: AssignmentsRepository,
      useClass: environment.useMockData
        ? AssignmentsMockRepositoryImpl
        : AssignmentsHttpRepositoryImpl,
    },
    {
      provide: AnnouncementsRepository,
      useClass: environment.useMockData
        ? AnnouncementsMockRepositoryImpl
        : AnnouncementsHttpRepositoryImpl,
    },
    {
      provide: ResourcesRepository,
      useClass: environment.useMockData ? ResourcesMockRepositoryImpl : ResourcesHttpRepositoryImpl,
    },
    {
      provide: GradesRepository,
      useClass: environment.useMockData ? GradesMockRepositoryImpl : GradesHttpRepositoryImpl,
    },
    { provide: ScheduleRepository, useClass: ScheduleHttpRepositoryImpl },
    // Profile and Account Repositories (condicionales basados en useMockData)
    {
      provide: ProfileRepository,
      useClass: environment.useMockData ? ProfileMockRepositoryImpl : ProfileMockRepositoryImpl, // TODO: Crear ProfileHttpRepositoryImpl
    },
    {
      provide: AccountRepository,
      useClass: environment.useMockData ? AccountMockRepositoryImpl : AccountMockRepositoryImpl, // TODO: Crear AccountHttpRepositoryImpl
    },
    // Teacher Repositories
    { provide: TeacherCourseRepository, useClass: TeacherCourseHttpRepositoryImpl },
    { provide: GradesManagementRepository, useClass: GradesManagementHttpRepositoryImpl },
    { provide: TeacherInfoRepository, useClass: TeacherInfoHttpRepositoryImpl },
    { 
      provide: TeacherStudentRepository, 
      useClass: TeacherStudentHttpRepositoryImpl 
    },
  ],
};
