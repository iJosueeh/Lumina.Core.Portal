# Plan: Admin Settings Page — `/admin/settings`

## Contexto
La ruta `/admin/settings` no existe (404). El sidebar la referencia en `sidebar.component.ts:123` y `admin-layout.ts:47` pero no hay route en `admin-routing-module.ts`. No hay backend de settings (no existe `SettingsController`). El estudiante tiene `account-settings` como referencia (4 tabs, mock JSON).

## Estado actual

| Capa | Estado |
|------|--------|
| Ruta `/admin/settings` | ❌ No existe en `admin-routing-module.ts` |
| Componente admin-settings | ❌ No existe |
| Backend SettingsController | ❌ No existe |
| Sidebar link | ✅ Ya apunta a `/admin/settings` |
| Backend AuthController | ✅ `POST /auth/admin/reset-password` |
| Backend UserProfileController | ✅ Existe (pero para perfil de usuario, no admin settings) |

## Backend disponible (endpoints existentes)

| Endpoint | Método | Notas |
|----------|--------|-------|
| `/api/usuarios` | GET | Lista todos los usuarios |
| `/api/usuarios/system/count` | GET | Conteo de usuarios |
| `/api/usuarios/system/health` | GET | Health check |
| `/api/auth/admin/reset-password` | POST | Reset password |
| `/api/cursos` | GET | Lista cursos |
| `/api/estudiantes` | GET | Lista estudiantes |
| `/api/docentes` | GET | Lista docentes |

## Propuesta: Secciones de Settings

### Tab 1: Perfil ✅ (sin backend nuevo)
- Nombre del administrador
- Email (readonly)
- Foto de perfil (placeholder, sin upload por ahora)
- **Backend:** usar datos del `AuthRepository.getCurrentUser()`

### Tab 2: Seguridad ✅ (sin backend nuevo)
- Cambiar contraseña actual
- **Backend:** usar `POST /auth/admin/reset-password` (ya existe)
- Inputs: contraseña actual (placeholder), nueva contraseña, confirmar
- Toggle show/hide como los demás modales

### Tab 3: Preferencias ⚠️ (mock, sin backend)
- Idioma del sistema (selector: Español, English)
- Zona horaria (selector)
- Tema (claro/automático) — por ahora solo "Claro" hardcoded
- **Backend:** NO existe endpoint. Usar local state / mock JSON

### Tab 4: Sistema ⚠️ (solo lectura, sin backend)
- Info del sistema: versión, estado de microservicios
- **Backend:** usar `/api/usuarios/system/health` y `/api/usuarios/system/count`
- Mostrar: total usuarios, total cursos, estado del gateway

## Archivos a crear/modificar

### 1. `admin-routing-module.ts` (MODIFICAR)
- Agregar ruta: `{ path: 'settings', loadComponent: () => import('./presentation/pages/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent) }`

### 2. `features/admin/presentation/pages/admin-settings/admin-settings.component.ts` (NUEVO)
- Standalone, signals, inject AuthRepository + HttpClient
- 4 tabs: perfil, seguridad, preferencias, sistema
- Cargar datos del usuario actual al iniciar
- `changePassword()` usando el service existente
- `loadSystemInfo()` usando endpoints de health/count

### 3. `features/admin/presentation/pages/admin-settings/admin-settings.component.html` (NUEVO)
- Header con icono ⚙️ + título
- Tab navigation (4 tabs)
- Tab content con forms consistentes con light theme
- Estilo: `bg-gray-50`, cards `bg-white border-slate-200 rounded-2xl`

### 4. `features/admin/presentation/pages/admin-settings/admin-settings.component.css` (NUEVO)
- Solo `@reference`

## Lo que NO se hace (requiere backend)
- Upload de foto de perfil
- Guardar preferencias de idioma/tema en BD
- Configuración de mantenimiento del sistema
- Logs de actividad del admin

## Estilo consistente
- Igual que user-management: `bg-gray-50`, `bg-white` cards, `border-slate-200`, `indigo` accents
- Inputs: `bg-slate-50 border-slate-200 rounded-xl`
- Labels: `text-xs font-bold text-slate-400 uppercase tracking-widest`
- Botones: `bg-indigo-600 hover:bg-indigo-500`
