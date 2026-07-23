# Plan: Modal Registrar/Editar Usuario — Light Theme + Campos Completos

## Contexto
El modal actual tiene: email, nombres, apellido paterno, rol, status. **Faltan**: contraseña (obligatoria al crear), apellido materno, y el backend espera más campos. El `<app-form-field>` tiene `dark:text-slate-300` (resquicio dark theme). El `getEmptyUser()` no incluye password ni campos del backend.

## Backend `CrearUsuarioRequest`
```
Password, Rol, Nombres, ApellidoPaterno, ApellidoMaterno,
FechaNacimiento, CorreoElectronico,
Pais, Departamento, Provincia, Ciudad, Distrito, Calle
```

## Archivos a modificar

### 1. `admin-user.models.ts` (MODIFICAR)
- Agregar `password?: string` a `AdminUser`
- Agregar campos faltantes: `apellidoMaterno`, `fechaNacimiento`, `pais`, `departamento`, `provincia`, `ciudad`, `distrito`, `calle`

### 2. `user-form-modal.component.html` (REESCRIBIR)
Campos del formulario (modo crear):
- **Email** (institucional, validación @lumina.edu)
- **Contraseña** (obligatoria, mínimo 6 caracteres, toggle show/hide)
- **Nombres** + **Apellido Paterno** + **Apellido Materno** (grid 3 cols)
- **Rol** (select: Estudiante/Docente/Admin)
- **Estado** (select: Activo/Suspendido)

Modo editar: mismos campos sin email (readonly) y contraseña opcional.

Estilo: consistente con reset password modal — `bg-slate-50` inputs, `border-slate-200`, `focus:ring-indigo-500/20`, labels `text-xs font-bold text-slate-400 uppercase tracking-widest`.

### 3. `user-form-modal.component.ts` (REESCRIBIR)
- Eliminar imports de `FormFieldComponent`, `InputComponent`, `ButtonComponent` (no existen como archivos separados o son innecesarios)
- Usar HTML nativo con Tailwind (consistente con reset password y delete modals)
- Agregar signal `showPassword = signal(false)` para toggle
- Mantener `onEmailChange()` con debounce
- Agregar validación de contraseña mínima 6 caracteres
- El `submit()` debe emitir el objeto completo para el backend

### 4. `user-management.ts` (MODIFICAR)
- Actualizar `getEmptyUser()` para incluir todos los campos del backend
- `saveUser()` debe construir el `CrearUsuarioRequest` completo

### 5. `form-field.component.html` (LIMPIAR)
- Eliminar `dark:text-slate-300` (resquicio dark theme)

## Campos del form (crear)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| Correo Institucional | email | ✅ | @lumina.edu, debounce check |
| Contraseña | password | ✅ | Min 6, toggle show/hide |
| Nombres | text | ✅ | |
| Apellido Paterno | text | ✅ | |
| Apellido Materno | text | ❌ | |
| Rol | select | ✅ | Estudiante/Docente/Admin |
| Estado | select | ✅ | Activo/Suspendido |

## Estilo consistente
- Inputs: `bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`
- Labels: `text-xs font-bold text-slate-400 uppercase tracking-widest`
- Botones: `app-button` (ya funciona con light theme)
- Modal container: `app-modal-container` (ya funciona con light theme)
