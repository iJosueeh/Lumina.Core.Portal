# 🎓 Lumina Core Portal

Portal de gestión académica para estudiantes, profesores y administradores de Lumina.Core.

## 📋 Descripción

Este proyecto es la **Fase 2** de la plataforma Lumina.Core, enfocada en los portales de gestión para diferentes roles (Estudiante, Profesor, Administrador). Implementa una arquitectura **Feature-Sliced Clean Architecture** con Angular 21 y se conecta al microservicio de backend .NET.

## 🏗️ Arquitectura

```
src/app/
├── core/              # Servicios globales, interceptors
├── features/          # Features organizadas por dominio
│   └── auth/
│       ├── domain/           # Modelos e interfaces
│       ├── infrastructure/   # Implementaciones HTTP
│       ├── application/      # Casos de uso
│       └── presentation/     # Componentes UI
└── shared/            # Componentes y utilidades compartidas
```

### Path Aliases Configurados

- `@core/*` → `src/app/core/*`
- `@features/*` → `src/app/features/*`
- `@shared/*` → `src/app/shared/*`

## 🚀 Tecnologías

- **Angular 21** - Framework principal
- **TypeScript 5.9** - Lenguaje
- **Tailwind CSS v3** - Estilos
- **RxJS 7.8** - Programación reactiva
- **pnpm** - Gestor de paquetes
- **Zone.js** - Change detection

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo (puerto 4201)
pnpm start

# Build de producción
pnpm build
```

## 🔧 Configuración

### Variables de Entorno

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5004/api'  // URL de tu backend
};
```

### Backend Requerido

El frontend espera que el backend esté corriendo en `http://localhost:5004` con los siguientes endpoints:

#### Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "userInfo": {
    "id": "guid",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rolPrincipal": "ESTUDIANTE"
  }
}
```

## 🎨 Features Implementadas

### ✅ Autenticación
- Login con validación de formularios
- Selección de rol (Estudiante, Docente, Administrador)
- Gestión de JWT tokens
- Interceptor HTTP para autenticación automática
- Persistencia de sesión en localStorage

### 🎨 UI/UX
- Diseño split-screen responsive
- Dark mode ready (Tailwind CSS)
- Animaciones suaves
- Validación de formularios en tiempo real

## 🧪 Testing

```bash
# Ejecutar tests unitarios
pnpm test

# Tests con coverage
pnpm test:coverage
```

## 📱 Puertos

- **Frontend:** `http://localhost:4201`
- **Backend:** `http://localhost:5004`

## 🔐 Roles Soportados

| Rol Backend | Rol Frontend | Dashboard |
|-------------|--------------|-----------|
| `ESTUDIANTE` | `STUDENT` | `/student/dashboard` |
| `PROFESOR` / `DOCENTE` | `TEACHER` | `/teacher/dashboard` |
| `ADMIN` / `ADMINISTRADOR` | `ADMIN` | `/admin/dashboard` |

## 📂 Estructura de Features

Cada feature sigue la estructura:

```
features/
└── [feature-name]/
    ├── domain/           # Modelos, interfaces, repositorios abstractos
    ├── infrastructure/   # Implementaciones concretas (HTTP, storage)
    ├── application/      # Casos de uso, lógica de negocio
    └── presentation/     # Componentes, páginas, layouts
```

## 🛠️ Scripts Disponibles

```bash
pnpm start          # Servidor de desarrollo
pnpm build          # Build de producción
pnpm test           # Tests unitarios
pnpm lint           # Linter
```

## 📝 Próximos Pasos

- [ ] Dashboard de Estudiante
- [ ] Dashboard de Profesor
- [ ] Dashboard de Administrador
- [ ] Gestión de cursos
- [ ] Sistema de calificaciones
- [ ] Mensajería interna

## 👥 Autor

Desarrollado como parte del proyecto académico Lumina.Core

## 📄 Licencia

Este proyecto es privado y de uso educativo.
