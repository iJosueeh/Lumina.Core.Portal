import { Routes } from '@angular/router';
import { LoginPageComponent } from '@features/auth/presentation/pages/login-page/login-page.component';
import { StudentLayoutComponent } from '@features/student/presentation/layouts/student-layout/student-layout.component';
import { DashboardComponent } from '@features/student/presentation/pages/dashboard/dashboard.component';
import { MyCoursesComponent } from '@features/student/presentation/pages/my-courses/my-courses.component';
import { CourseDetailComponent } from '@features/student/presentation/pages/course-detail/course-detail.component';
import { GradesComponent } from '@features/student/presentation/pages/grades/grades.component';
import { ScheduleComponent } from '@features/student/presentation/pages/schedule/schedule.component';
import { ResourcesComponent } from '@features/student/presentation/pages/resources/resources.component';
import { TeacherLayoutComponent } from '@features/teacher/presentation/layouts/teacher-layout/teacher-layout.component';
import { TeacherDashboardComponent } from '@features/teacher/presentation/pages/teacher-dashboard/teacher-dashboard.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginPageComponent,
        title: 'Iniciar Sesión - Lumina Core'
    },
    {
        path: 'student',
        component: StudentLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
                title: 'Dashboard - Portal Estudiante'
            },
            {
                path: 'courses',
                component: MyCoursesComponent,
                title: 'Mis Cursos - Portal Estudiante'
            },
            {
                path: 'course/:id',
                component: CourseDetailComponent,
                title: 'Detalle del Curso - Portal Estudiante'
            },
            {
                path: 'grades',
                component: GradesComponent,
                title: 'Mis Calificaciones - Portal Estudiante'
            },
            {
                path: 'schedule',
                component: ScheduleComponent,
                title: 'Mi Horario - Portal Estudiante'
            },
            {
                path: 'resources',
                component: ResourcesComponent,
                title: 'Recursos - Portal Estudiante'
            }
        ]
    },
    {
        path: 'teacher',
        component: TeacherLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: TeacherDashboardComponent,
                title: 'Dashboard - Portal Docente'
            },
            {
                path: 'courses',
                loadComponent: () => import('@features/teacher/presentation/pages/teacher-courses/teacher-courses.component').then(m => m.TeacherCoursesComponent),
                title: 'Mis Cursos - Portal Docente'
            },
            {
                path: 'course/:id',
                loadComponent: () => import('@features/teacher/presentation/pages/course-management/course-management.component').then(m => m.CourseManagementComponent),
                title: 'Gestión de Curso - Portal Docente'
            },
            {
                path: 'students',
                loadComponent: () => import('@features/teacher/presentation/pages/students-list/students-list.component').then(m => m.StudentsListComponent),
                title: 'Alumnos - Portal Docente'
            },
            {
                path: 'grades',
                loadComponent: () => import('@features/teacher/presentation/pages/grades-management/grades-management.component').then(m => m.GradesManagementComponent),
                title: 'Gestión de Calificaciones - Portal Docente'
            },
            {
                path: 'attendance',
                loadComponent: () => import('@features/teacher/presentation/pages/attendance-management/attendance-management.component').then(m => m.AttendanceManagementComponent),
                title: 'Gestión de Asistencia - Portal Docente'
            },
            {
                path: 'schedule',
                loadComponent: () => import('@features/teacher/presentation/pages/teacher-schedule/teacher-schedule.component').then(m => m.TeacherScheduleComponent),
                title: 'Mi Horario - Portal Docente'
            },
            {
                path: 'materials',
                loadComponent: () => import('@features/teacher/presentation/pages/materials-management/materials-management.component').then(m => m.MaterialsManagementComponent),
                title: 'Gestión de Materiales - Portal Docente'
            }
        ]
    }
];
