# Plan: Resetear Contraseña desde Admin — User Management

## Estado del Backend ✅
- **Endpoint existente:** `POST /api/auth/admin/reset-password`
- **Body:** `{ email: string, newPassword: string }`
- **Response:** `{ message, email, passwordHashPreview }`
- **Validación:** valida email, busca usuario por email, hashea con BCrypt, actualiza
- **No requiere auth** (temporal para desarrollo)

## Frontend — Cambios Necesarios

### 1. AdminUserService — agregar método
**Archivo:** `features/admin/infrastructure/services/admin-user.service.ts`
```ts
resetPassword(email: string, newPassword: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/admin/reset-password`, { email, newPassword });
}
```

### 2. UserTableComponent — acción de reset en tabla
**Archivo:** `features/admin/presentation/pages/user-management/components/user-table/user-table.component.html`
- Agregar 3er botón de acción: icono de candado/refresh (`fas fa-key`)
- `@Output() resetPassword = new EventEmitter<AdminUser>()`
- Color: `text-amber-500 hover:text-amber-600 hover:bg-amber-50`

### 3. UserManagement — lógica de reset
**Archivo:** `features/admin/presentation/pages/user-management/user-management.ts`
- Nuevo signal: `showResetModal = signal(false)`
- Nuevo signal: `userToReset: AdminUser | null = null`
- Nuevo signal: `newPassword = signal('')`
- Nuevo signal: `isResetting = signal(false)`
- Método `openResetModal(user)`: abre modal
- Método `confirmReset()`: llama `adminService.resetPassword(email, newPassword)`, muestra toast, cierra modal

### 4. Modal de Reset — template inline o componente separado
**Opción elegida: inline en `user-management.html`** (KISS — no vale la pena componente separado para un form de 1 campo)
- Modal con: título "Resetear Contraseña", email del usuario (readonly), campo nueva contraseña, botones Cancelar/Resetear
- Validación: mínimo 6 caracteres
- Feedback: loading spinner + toast de éxito/error

### 5. Flujo completo
1. Admin hace clic en 🔒 en la tabla → abre modal
2. Modal muestra email del usuario (readonly) + campo "Nueva Contraseña"
3. Admin escribe nueva contraseña (mín 6 chars)
4. Clic en "Resetear" → `POST /api/auth/admin/reset-password`
5. Éxito → toast verde "Contraseña actualizada para [email]" + cierra modal
6. Error → toast rojo con mensaje

## Archivos a modificar
1. `admin-user.service.ts` — +1 método
2. `user-table.component.ts` — +1 @Output
3. `user-table.component.html` — +1 botón acción
4. `user-management.ts` — signals + lógica reset
5. `user-management.html` — modal inline
