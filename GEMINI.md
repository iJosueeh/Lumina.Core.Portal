# Contexto de Refactorización Front-End - Lumina Core

Este archivo contiene los estándares arquitectónicos y el progreso de la modernización del portal. **Debe ser leído al inicio de cada sesión para mantener la coherencia del código.**

## 📏 Reglas de Oro (Mandatorias)
1. **Límite de Líneas**: Ningún archivo TypeScript (`.ts`) debe exceder las **150-200 líneas**.
2. **Estructura de Componentes**: Regla estricta de **3 archivos** (HTML, CSS, TS) por componente.
3. **Reactividad**: Uso prioritario de **Angular Signals**.
4. **Directivas Modernas**: Uso exclusivo de `@if`, `@for`, `@empty` y `@switch`.
5. **Mocks Separados**: Los datos mock **NO** deben vivir en componentes `.ts`. Crear:
   - `infrastructure/mocks/{feature-name}.types.ts` → Interfaces
   - `infrastructure/mocks/{feature-name}.mock.ts` → Datos mock
   - Inyectar mediante `InjectionToken` para desacoplamiento
   - Objetivo final: Reemplazar mocks con servicio real sin cambiar componente

## 🏗️ Librería de UI Atómica (Disponibles en `shared/ui`)
- `ButtonComponent`, `SkeletonLoaderComponent`, `ModalContainerComponent`, `PaginationComponent`, `StatCardComponent`, `StatusBadgeComponent`.

## ✅ Progreso y Estabilización (Sesión 28 de Abril 2026)
- **Admin Dashboard (Front-End)** - COMPLETADO EN ESPAÑOL ✅:
    - Redesigned completamente al tema dark (#020617) con glassmorphism effects
    - Migrado a Angular Signals (signal, computed, effect)
    - **GRÁFICO DINÁMICO**: SVG con curvas suaves calculadas en tiempo real
      - Datos para últimos 12 meses (enero-diciembre)
      - 2 series dinámicas: "Nuevos Registros" (cyan) y "Finalización Activa" (purple)
      - Método `generateCurvePath()` calcula rutas SVG con Quadratic Bézier curves
      - Normaliza datos al máximo valor para escalar correctamente
      - Labels dinámicas con nombres de meses (Ene, Feb, Mar, etc.)
    - **ESTADO DEL SISTEMA DINÁMICO**:
      - Solo 3 items relevantes: API Global, Base de Datos, Servicios Activos
      - Verifica dinámicamente si los backends están disponibles
      - Si disponible: muestra estado "success" con icono verde ✓
      - Si NO disponible: muestra estado "warning" con TODO amarillo ⚠
      - @switch renderiza iconos y colores dinámicamente según estado
      - Métodos: `getSystemStatus()`, `checkApiStatus()`, `checkDatabaseStatus()`, `checkServicesStatus()`
    - **ACTIVIDAD RECIENTE DINÁMICA**:
      - Si backend disponible: obtiene datos reales llamando `/api/estudiantes`
      - Si backend NO disponible: muestra 4 items "TODO" en amarillo indicando qué conectar
      - Cada TODO: "TODO: Obtener registro de estudiantes", "TODO: Obtener actualizaciones de cursos", etc.
      - Timestamps dinámicos en español con `getTimeAgo()`
      - Indicador visual: punto cyan = operacional, punto amarillo = TODO
      - Fallback automático a `buildRecentActivityTodo()` si API falla
    - **NUEVA ESTRUCTURA DE DATOS**:
      - Nueva interface `ChartData` con propiedades: title, subtitle, data[], period
      - Nueva interface `ChartDataPoint` con: month, newRegistrations, activeCompletion
      - `AdminDashboardData` ahora incluye `chartData?: ChartData`
    - **NUEVA REGLA**: Mocks separados en `infrastructure/mocks/`
      - `admin-dashboard.types.ts` → Interfaces (`DashboardStat`, `SystemStatus`, `RecentActivity`, `ChartData`, `ChartDataPoint`)
      - `admin-dashboard.mock.ts` → Datos mock
      - **API REAL INTEGRADA**: AdminDashboardApiService consume endpoints reales
      - Provider en app.config.ts usa servicio real (AdminDashboardApiService.getDashboardData())
    - **Textos 100% en Español**:
      - Estadísticas: ESTUDIANTES, DOCENTES, CURSOS, USUARIOS TOTALES
      - Gráfico: Nuevos Registros, Finalización Activa, Crecimiento Institucional
      - Estado del Sistema: API Global, Base de Datos, Servicios Activos (sin CDN ni rendimiento)
      - Actividad Reciente: Eventos dinámicos o TODOs configurables si backend falla
      - Botones: Año, Mes, Descargar Datos Completos
    - Sidebar actualizado con 6 opciones (Dashboard, Analytics, Institutions, Scholars, Archive, Reports)
    - **API Integration Strategy**:
      - Docentes: GET `/api/docente` ✅ con filtro por `role === 'Teacher'`
      - Cursos: GET `/api/cursos` ✅
      - Usuarios: GET `/api/usuarios` ✅
      - Estudiantes: GET `/api/estudiantes` ✅ (con fallback a 70% usuarios)
      - Estado del Sistema: Verifica disponibilidad con HEAD/GET requests a 3 endpoints
      - Actividad Reciente: Obtiene count de estudiantes y genera eventos dinámicos
      - **Trends Dinámicos**: Calculados en tiempo real basándose en proporciones:
        - Estudiantes: (estudiantes/usuarios) * 100 → ↑14%, ↑12%, ↑8%, ↑4%, ↑2%, →
        - Docentes: (docentes/usuarios) * 100 → ↑14%, ↑12%, ↑8%, ↑4%, ↑2%, →
        - Cursos: (cursos/estudiantes) → ↑8%, ↑4%, →
        - Usuarios Totales: basado en conteo → ↑14%, ↑10%, ↑8.2%, ↑4%
      - Fallback "TODO": Si backend no responde, muestra items amarillos configurables
      - Build exitoso sin errores ✅ [13.941 segundos]
- **Cursos (Backend)**: 
    - Implementado `DataSeeder` en MongoDB con lecciones detalladas.
    - **Cambio de Contrato**: Las lecciones ahora son objetos `{id, titulo, tipo, duracion}` en lugar de strings.
    - Corregida serialización de `Categoria` y `Nivel` (ya no llegan null).
- **Estudiantes (Backend)**:
    - Implementado endpoint `GET /api/estudiantes/aula-video/{courseId}`.
    - Mejorado `CursoService` para mapear dinámicamente propiedades de Cursos API (case-insensitive).
    - El estudiante de prueba (`estudiante@lumina.edu`) ahora tiene 4 cursos fijos asignados.
- **Portal (Front-End)**:
    - Agregada ruta `student/video-classroom/:id` en `app.routes.ts` para soporte de query params.
    - Actualizado `VideoClassroomService` para consumir el nuevo endpoint de Estudiantes.

## 🚀 Próximos Pasos (Pendientes Críticos)
1. **Depuración 404 Aula Video**: El endpoint `/estudiantes/api/estudiantes/aula-video/{id}` sigue fallando. 
    - *Hipótesis 1*: Conflicto de ruta en `EstudiantesController` con `cursos/{id}`.
    - *Hipótesis 2*: El Gateway (YARP) no está eliminando el prefijo correctamente tras la última actualización.
2. **Integración MinIO**: Verificar que las URLs de video generadas en el seeder apunten correctamente al storage o al proxy.
3. **Refactorización**: Continuar con `CourseDetail` y `MyCourses` del Student Module.

---
*Última actualización: 28 de abril de 2026 (Sesión de Refactorización Admin Dashboard + Regla de Mocks)*
