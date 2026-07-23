# Plan: Eliminar Usuarios — User Management

## Contexto
El frontend tiene el botón 🗑️ en la tabla, el `@Output() delete` en `UserTableComponent`, y el `AdminUserService.deleteUser(id)` ya existe. Solo falta: el modal de confirmación (type-to-confirm) y la lógica real en `deleteUser()`.

## Backend
- `DELETE /api/usuarios/{id:guid}` — **ya existe** en `UsuariosController.cs:118`
- Retorna `204 NoContent` en éxito, `400 BadRequest` en error
- Service `AdminUserService.deleteUser(id)` — **ya existe** en `admin-user.service.ts:30`

## Archivos a crear/modificar

### 1. `shared/components/ui/confirm-delete-modal/confirm-delete-modal.component.ts` (NUEVO)
- Modal inline (no lazy-load), standalone
- Inputs: `isVisible`, `title`, `message`, `confirmText` (nombre del usuario a escribir)
- Output: `onConfirm`, `onCancel`
- Lógica: input deshabilitado hasta que el usuario escriba exactamente el `confirmText`
- Estilo: light theme, `bg-white`, `border-red-200`, botón rojo `bg-red-600 hover:bg-red-500`
- Icono: `fa-trash` rojo en header

### 2. `features/admin/presentation/pages/user-management/user-management.ts` (MODIFICAR)
- Agregar signal `showDeleteModal = signal(false)`
- Agregar signal `userToDelete = signal<AdminUser | null>(null)`
- Cambiar `deleteUser()`: reemplazar `confirm()` → `userToDelete.set(user)` + `showDeleteModal.set(true)`
- Nuevo método `confirmDelete()`: llama `adminService.deleteUser(user.id)`, al éxito → `notificationService.show('success', ...)`, remueve usuario de `allUsers`, cierra modal
- Nuevo método `closeDeleteModal()`: resetea signals

### 3. `features/admin/presentation/pages/user-management/user-management.html` (MODIFICAR)
- Importar `ConfirmDeleteModalComponent` en imports del TS
- Agregar bloque `@if (showDeleteModal())` al final del template
- Bindings: `[isVisible]`, `[confirmText]="userToDelete()?.fullName"`, `(onConfirm)="confirmDelete()"`, `(onCancel)="closeDeleteModal()"`

## Estilo del modal (consistente con reset password)
- Header: `bg-red-100` icono + título "Eliminar Usuario"
- Body: mensaje + input para escribir nombre
- Footer: "Cancelar" slate + "Eliminar" rojo disabled hasta match
- Backdrop: `bg-slate-900/40 backdrop-blur-sm`

## Flujo
1. Click 🗑️ → `deleteUser(user)` → abre modal
2. Modal muestra: "Escribe **{nombre}** para confirmar"
3. Usuario escribe nombre exacto → botón "Eliminar" se habilita
4. Click "Eliminar" → `DELETE /api/usuarios/{id}` → toast éxito → cierra modal → recarga tabla
5. Click "Cancelar" o backdrop → cierra modal sin acción
