import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing-module';
import { AdminLayout } from './presentation/components/admin-layout/admin-layout';
import { AdminDashboard } from './presentation/pages/admin-dashboard/admin-dashboard';
import { UserManagement } from './presentation/pages/user-management/user-management';
import { CourseManagement } from './presentation/pages/course-management/course-management';


@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    AdminLayout,
    AdminDashboard,
    UserManagement,
    CourseManagement
  ]
})
export class AdminModule { }
