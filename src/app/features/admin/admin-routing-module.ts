import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayout } from './presentation/components/admin-layout/admin-layout';

const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./presentation/pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
      },
      {
        path: 'courses',
        loadComponent: () => import('./presentation/pages/course-management/course-management').then(m => m.CourseManagement)
      },
      {
        path: 'course/:id/manage',
        loadComponent: () => import('./presentation/pages/course-detail/admin-course-detail.component').then(m => m.AdminCourseDetailComponent)
      },
      {
        path: 'course/:id/content',
        loadComponent: () => import('./presentation/pages/course-content-editor/course-content-editor').then(m => m.CourseContentEditorComponent)
      },
      {
        path: 'course/:id/settings',
        loadComponent: () => import('./presentation/pages/course-settings/course-settings.component').then(m => m.CourseSettingsComponent)
      },
      {
        path: 'course/create',
        loadComponent: () => import('./presentation/pages/course-create/course-create.component').then(m => m.CourseCreateComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./presentation/pages/user-management/user-management').then(m => m.UserManagement)
      },
      {
        path: 'settings',
        loadComponent: () => import('./presentation/pages/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'noticias',
        loadComponent: () => import('./presentation/pages/noticias-management/noticias-management').then(m => m.NoticiasManagement)
      },
      {
        path: 'noticias/new',
        loadComponent: () => import('./presentation/pages/noticia-editor/noticia-editor').then(m => m.NoticiaEditorComponent)
      },
      {
        path: 'noticias/edit/:id',
        loadComponent: () => import('./presentation/pages/noticia-editor/noticia-editor').then(m => m.NoticiaEditorComponent)
      },
      {
        path: 'eventos',
        loadComponent: () => import('./presentation/pages/eventos-management/eventos-management').then(m => m.EventosManagement)
      },
      {
        path: 'eventos/new',
        loadComponent: () => import('./presentation/pages/evento-editor/evento-editor').then(m => m.EventoEditorComponent)
      },
      {
        path: 'eventos/edit/:id',
        loadComponent: () => import('./presentation/pages/evento-editor/evento-editor').then(m => m.EventoEditorComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
