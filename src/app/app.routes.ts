import { Routes } from '@angular/router';
import { LoginPageComponent } from '@features/auth/presentation/pages/login-page/login-page.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginPageComponent }
];
