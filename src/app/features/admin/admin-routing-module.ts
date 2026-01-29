import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayout } from './presentation/components/admin-layout/admin-layout';
import { AdminDashboard } from './presentation/pages/admin-dashboard/admin-dashboard';
import { UserManagement } from './presentation/pages/user-management/user-management';
import { CourseManagement } from './presentation/pages/course-management/course-management';

const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: UserManagement },
      { path: 'courses', component: CourseManagement }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
