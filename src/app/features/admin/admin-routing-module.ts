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
        path: 'course/:id/content',
        loadComponent: () => import('./presentation/pages/course-content-editor/course-content-editor').then(m => m.CourseContentEditorComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./presentation/pages/user-management/user-management').then(m => m.UserManagement)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
