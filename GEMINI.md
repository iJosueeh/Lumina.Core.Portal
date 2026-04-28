# Contexto de Refactorización Front-End - Lumina Core

Este archivo contiene los estándares arquitectónicos y el progreso de la modernización del portal. **Debe ser leído al inicio de cada sesión para mantener la coherencia del código.**

## 📏 Reglas de Oro (Mandatorias)
1. **Límite de Líneas**: Ningún archivo TypeScript (`.ts`) debe exceder las **150-200 líneas**.
2. **Estructura de Componentes**: Regla estricta de **3 archivos** (HTML, CSS, TS) por componente.
3. **Reactividad**: Uso prioritario de **Angular Signals**.
4. **Directivas Modernas**: Uso exclusivo de `@if`, `@for`, `@empty` y `@switch`.

## 🏗️ Librería de UI Atómica (Disponibles en `shared/ui`)
- `ButtonComponent`, `SkeletonLoaderComponent`, `ModalContainerComponent`, `PaginationComponent`, `StatCardComponent`, `StatusBadgeComponent`.

## ✅ Progreso y Estabilización (Sesión 24 de Abril 2026)
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
*Última actualización: 24 de abril de 2026 (Sesión de Estabilización de Data y Aula de Video)*
