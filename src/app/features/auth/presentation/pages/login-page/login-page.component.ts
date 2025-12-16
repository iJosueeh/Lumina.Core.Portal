import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginUseCase } from '@features/auth/application/use-cases/login.usecase';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login-page.component.html',
    styles: ``
})
export class LoginPageComponent implements OnInit {
    loginForm!: FormGroup;
    isLoading = false;
    errorMessage = '';
    showPassword = false;

    roles: { id: 'STUDENT' | 'TEACHER' | 'ADMIN', label: string, icon: string }[] = [
        { id: 'STUDENT', label: 'Estudiante', icon: 'academic-cap' },
        { id: 'TEACHER', label: 'Docente', icon: 'presentation-chart-bar' },
        { id: 'ADMIN', label: 'Administrador', icon: 'shield-check' }
    ];

    selectedRole: 'STUDENT' | 'TEACHER' | 'ADMIN' = 'STUDENT';

    constructor(
        private fb: FormBuilder,
        private loginUseCase: LoginUseCase,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            role: [this.selectedRole, Validators.required]
        });
    }

    setRole(role: 'STUDENT' | 'TEACHER' | 'ADMIN'): void {
        this.selectedRole = role;
        this.loginForm.patchValue({ role });
        this.errorMessage = '';
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const credentials: LoginCredentials = this.loginForm.value;

        this.loginUseCase.execute(credentials).subscribe({
            next: (user) => {
                this.isLoading = false;
                console.log('Login successful', user);
                this.redirectUser(user.role);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.message || 'Error al iniciar sesión. Verifique sus credenciales.';
            }
        });
    }

    private redirectUser(role: string): void {
        // Placeholder redirection - Phase 2 will implement these dashboards
        /*
        switch (role) {
          case 'STUDENT':
            this.router.navigate(['/student/dashboard']);
            break;
          case 'TEACHER':
            this.router.navigate(['/teacher/dashboard']);
            break;
          case 'ADMIN':
            this.router.navigate(['/admin/dashboard']);
            break;
        }
        */
        alert(`Bienvenido ${role}! Redirigiendo a dashboard...`);
    }
}
