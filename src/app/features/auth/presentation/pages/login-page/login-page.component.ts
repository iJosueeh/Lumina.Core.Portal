import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginUseCase } from '@features/auth/application/use-cases/login.usecase';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
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
                console.log('✅ Login successful en component, user recibido:', user);
                console.log('✅ user.id:', user?.id);
                console.log('✅ user.role:', user?.role);
                
                if (!user) {
                    console.error('❌ User es null o undefined en next()');
                    this.errorMessage = 'Error: No se recibió información del usuario';
                    return;
                }
                
                if (!user.role) {
                    console.error('❌ User no tiene role:', user);
                    this.errorMessage = 'Error: Usuario sin rol asignado';
                    return;
                }
                
                this.redirectUser(user.role);
            },
            error: (err) => {
                this.isLoading = false;
                
                console.error('❌ Login error en component:', err);
                console.error('❌ Error type:', typeof err);
                console.error('❌ Error status:', err?.status);
                console.error('❌ Error message:', err?.message);
                
                // Manejar diferentes tipos de error
                if (err.status === 401) {
                    this.errorMessage = err.error?.message || 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.';
                } else if (err.status === 0) {
                    this.errorMessage = 'No se pudo conectar con el servidor. Verifica que la API esté funcionando.';
                } else if (err.message) {
                    // Error lanzado desde el map() con throw new Error()
                    this.errorMessage = err.message;
                } else {
                    this.errorMessage = err.error?.message || err.message || 'Error al iniciar sesión. Por favor, intenta nuevamente.';
                }
                
                console.error('❌ Error message mostrado:', this.errorMessage);
            }
        });
    }

    private redirectUser(role: string): void {
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
    }
}
