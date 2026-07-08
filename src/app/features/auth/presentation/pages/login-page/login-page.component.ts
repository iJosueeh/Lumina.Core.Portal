import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginUseCase } from '@features/auth/application/use-cases/login.usecase';

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

    constructor(
        private fb: FormBuilder,
        private loginUseCase: LoginUseCase,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
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

        const credentials = this.loginForm.value;

        this.loginUseCase.execute(credentials).subscribe({
            next: (user) => {
                this.isLoading = false;
                
                if (!user?.role) {
                    this.errorMessage = 'Error: No se recibió información del usuario';
                    return;
                }
                
                this.redirectUser(user.role);
            },
            error: (err) => {
                this.isLoading = false;
                
                if (err.status === 401) {
                    this.errorMessage = 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.';
                } else if (err.status === 0) {
                    this.errorMessage = 'No se pudo conectar con el servidor. Verifica que la API esté funcionando.';
                } else {
                    this.errorMessage = 'Error al iniciar sesión. Por favor, intenta nuevamente.';
                }
            }
        });
    }

    private redirectUser(role: string): void {
        const routes: Record<string, string> = {
            'STUDENT': '/student/dashboard',
            'TEACHER': '/teacher/dashboard',
            'ADMIN': '/admin/dashboard'
        };
        this.router.navigate([routes[role] || '/student/dashboard']);
    }
}
