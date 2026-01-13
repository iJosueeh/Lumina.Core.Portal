# Mock Data - Portal Estudiantil Lumina

Este directorio contiene datos estáticos (mock data) para probar el portal estudiantil sin necesidad de conectar a los microservicios backend.

## 📁 Archivos Disponibles

### 1. `student.mock.ts`

**Contenido:**

- Usuario estudiante completo (`MOCK_STUDENT_USER`)
- 5 cursos con calificaciones (`MOCK_STUDENT_GRADES`)
- Estadísticas generales (`MOCK_STUDENT_STATS`)
- Perfil detallado del estudiante (`MOCK_STUDENT_PROFILE`)

**Datos del estudiante:**

- **Nombre:** María Fernanda Rodríguez García
- **Email:** maria.rodriguez@lumina.edu.pe
- **Código:** EST-2021-001234
- **Carrera:** Ingeniería de Software
- **Ciclo:** 7
- **Promedio General:** 16.4

**Cursos incluidos:**

1. Desarrollo Web Full Stack (En Curso - 17.5)
2. Base de Datos Relacionales (En Curso - 16.2)
3. Programación Orientada a Objetos (Aprobado - 18.0)
4. Arquitectura de Software (En Curso - 15.8)
5. Algoritmos y Estructuras de Datos (En Riesgo - 14.5)

### 2. `courses.mock.ts`

**Contenido:**

- Detalles completos de 2 cursos con módulos y lecciones
- Progreso de cada módulo
- Estado de lecciones (completadas/pendientes)

**Cursos detallados:**

1. **Desarrollo Web Full Stack**
   - 4 módulos, 75% completado
   - Incluye HTML/CSS, JavaScript, React, Backend

2. **Base de Datos Relacionales**
   - 4 módulos, 90% completado
   - Incluye Fundamentos, SQL Básico, SQL Avanzado, Proyecto

### 3. `announcements-resources.mock.ts`

**Contenido:**

- 5 anuncios del sistema, cursos y generales
- 6 recursos educativos (PDFs, videos, código, libros)
- 6 categorías de recursos

---

## 🚀 Cómo Usar

### Opción 1: Importar directamente en componentes

```typescript
import {
  getMockStudentUser,
  getMockStudentGrades
} from '@app/core/mock-data/student.mock';

// En tu componente
ngOnInit() {
  this.user = getMockStudentUser();
  this.grades = getMockStudentGrades();
}
```

### Opción 2: Crear un servicio mock

```typescript
// auth-mock.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { mockLogin } from '@app/core/mock-data/student.mock';

@Injectable({
  providedIn: 'root',
})
export class AuthMockService {
  login(email: string, password: string): Observable<User> {
    const user = mockLogin(email, password);
    return of(user!);
  }
}
```

### Opción 3: Usar en guards y interceptors

```typescript
// auth.guard.ts
import { getMockStudentUser } from '@app/core/mock-data/student.mock';

canActivate(): boolean {
  // Para desarrollo, siempre retornar true con usuario mock
  if (environment.useMockData) {
    localStorage.setItem('currentUser', JSON.stringify(getMockStudentUser()));
    return true;
  }
  // Lógica normal de autenticación
  return this.authService.isAuthenticated();
}
```

---

## 🔧 Configuración en Environment

Agrega una flag en `environment.ts`:

```typescript
export const environment = {
  production: false,
  useMockData: true, // ← Activar datos mock
  // ... otras configuraciones
};
```

---

## 📝 Funciones Helper Disponibles

### Student Mock

```typescript
getMockStudentUser(): User
getMockStudentGrades(): CourseGrade[]
getMockStudentStats(): GradeStats
getMockStudentProfile(): StudentProfile
mockLogin(email: string, password: string): User | null
```

### Courses Mock

```typescript
getMockCourseDetail(courseId: string): CourseDetail | undefined
getAllMockCourseDetails(): CourseDetail[]
```

### Announcements & Resources Mock

```typescript
getMockAnnouncements(): Announcement[]
getMockAnnouncementsByType(tipo): Announcement[]
getMockResources(): Resource[]
getMockFeaturedResources(): Resource[]
getMockResourcesByCategory(category): Resource[]
getMockResourceCategories(): ResourceCategory[]
```

---

## 🎯 Casos de Uso

### 1. Login Automático

```typescript
// login.component.ts
onSubmit() {
  if (environment.useMockData) {
    const user = mockLogin(this.email, this.password);
    this.router.navigate(['/student/dashboard']);
  } else {
    this.authService.login(this.email, this.password).subscribe(...);
  }
}
```

### 2. Dashboard de Estudiante

```typescript
// dashboard.component.ts
ngOnInit() {
  if (environment.useMockData) {
    this.stats = getMockStudentStats();
    this.grades = getMockStudentGrades();
  } else {
    this.loadDataFromAPI();
  }
}
```

### 3. Detalle de Curso

```typescript
// course-detail.component.ts
ngOnInit() {
  const courseId = this.route.snapshot.params['id'];

  if (environment.useMockData) {
    this.course = getMockCourseDetail(courseId);
  } else {
    this.courseService.getCourseDetail(courseId).subscribe(...);
  }
}
```

---

## ⚠️ Notas Importantes

1. **Solo para desarrollo:** Estos datos son para pruebas locales. No usar en producción.

2. **IDs consistentes:** Los IDs de cursos en `student.mock.ts` coinciden con los de `courses.mock.ts` para los primeros 2 cursos.

3. **Fechas dinámicas:** Algunas fechas usan `new Date()` para simular datos recientes.

4. **Token mock:** El token JWT es ficticio y solo sirve para desarrollo local.

5. **Credenciales:** `mockLogin()` acepta cualquier email/password para facilitar pruebas.

---

## 🔄 Actualizar Datos

Para agregar más datos mock:

1. Edita los archivos en `src/app/core/mock-data/`
2. Mantén la estructura de interfaces existentes
3. Actualiza las funciones helper si es necesario
4. Documenta los cambios en este README

---

## ✅ Checklist de Integración

- [ ] Agregar `useMockData: true` en `environment.ts`
- [ ] Importar funciones mock en componentes
- [ ] Agregar condicionales `if (environment.useMockData)`
- [ ] Probar login con datos mock
- [ ] Verificar navegación entre páginas
- [ ] Validar que los datos se muestran correctamente
- [ ] Cambiar a `useMockData: false` para producción

---

## 📚 Recursos Adicionales

- **Modelos TypeScript:** `src/app/features/student/domain/models/`
- **Servicios:** `src/app/features/student/application/`
- **Componentes:** `src/app/features/student/presentation/`

---

**Última actualización:** 12 de enero de 2024
**Versión:** 1.0.0
