import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly usuariosApiUrl = environment.apiUrl;
  private readonly cursosApiUrl = environment.cursosApiUrl;

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<any> {
    return this.http.get<any>('/assets/mock-data/admin/dashboard.json');
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuariosApiUrl}/usuarios`).pipe(
      map(users => users.map(u => ({
        id: u.id ?? u.Id,
        fullName: `${u.nombresPersona ?? u.NombresPersona ?? ''} ${u.apellidoPaterno ?? u.ApellidoPaterno ?? ''} ${u.apellidoMaterno ?? u.ApellidoMaterno ?? ''}`.trim(),
        email: u.email ?? u.Email,
        username: u.username ?? u.Username,
        role: 'USER',
        status: (u.estado ?? u.Estado ?? 'Activo') === 'Activo' ? 'ACTIVE' : 'SUSPENDED',
        department: u.departamento ?? u.Departamento ?? '',
        pais: u.pais ?? u.Pais ?? '',
        fechaNacimiento: u.fechaNacimiento ?? u.FechaNacimiento
      }))),
      catchError(() => this.http.get<any[]>('/assets/mock-data/users/users.json'))
    );
  }

  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.cursosApiUrl}/cursos`).pipe(
      map(courses => courses.map(c => ({
        id: c.id ?? c.Id,
        name: c.titulo ?? c.Titulo ?? c.nombreCurso ?? '',
        code: c.codigo ?? c.Codigo ?? '',
        teacherName: c.instructorId ? `Docente ${String(c.instructorId).substring(0, 6)}` : 'Sin asignar',
        capacity: c.capacidad ?? c.Capacidad ?? 150,
        enrolled: c.matriculados ?? 0,
        status: c.estadoCurso ?? c.EstadoCurso ?? 'PUBLISHED',
        description: c.descripcion ?? c.Descripcion ?? '',
        ciclo: c.ciclo ?? c.Ciclo ?? '',
        creditos: c.creditos ?? c.Creditos ?? 3,
        categoria: c.categoria ?? c.Categoria ?? '',
        nivel: c.nivel ?? c.Nivel ?? '',
        duracion: c.duracion ?? c.Duracion ?? '',
        coverImage: c.imagen ?? c.Imagen ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070',
        modules: [],
        evaluaciones: []
      }))),
      catchError(() => this.http.get<any[]>('/assets/mock-data/courses/admin-courses.json'))
    );
  }

  // User Actions
  createUser(user: any): Observable<any> {
    const nameParts = (user.fullName ?? '').trim().split(' ');
    const body = {
      password: user.password ?? 'Temporal@1234',
      rol: user.role === 'TEACHER' ? 'Docente' : user.role === 'ADMIN' ? 'Admin' : 'Estudiante',
      apellidoPaterno: nameParts[1] ?? nameParts[0] ?? 'Sin',
      apellidoMaterno: nameParts[2] ?? 'Apellido',
      nombres: nameParts[0] ?? 'Nuevo',
      fechaNacimiento: user.fechaNacimiento ?? new Date('2000-01-01').toISOString(),
      correoElectronico: user.email,
      pais: user.pais ?? 'Peru',
      departamento: user.department ?? 'Lima',
      provincia: 'Lima',
      distrito: 'Lima',
      calle: '-'
    };
    return this.http.post<any>(`${this.usuariosApiUrl}/usuarios`, body);
  }

  updateUser(user: any): Observable<boolean> {
    console.log('Update User (local only — backend requires role GUID):', user);
    return of(true);
  }

  deleteUser(userId: string): Observable<boolean> {
    return this.http.delete(`${this.usuariosApiUrl}/usuarios/${userId}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Course Actions
  createCourse(course: any): Observable<any> {
    const body = {
      nombre: course.name,
      descripcion: course.description ?? '',
      capacidad: course.capacity ?? 150,
      nivel: course.nivel ?? 'Intermedio',
      duracion: course.duracion ?? `${course.creditos * 20} horas`,
      precio: course.precio ?? 0,
      imagenUrl: course.coverImage ?? '',
      categoria: course.categoria ?? 'General',
      instructorId: null,
      modulos: (course.modules ?? []).map((m: any) => ({
        titulo: m.title ?? m.titulo,
        descripcion: m.description ?? '',
        lecciones: m.topics ?? []
      })),
      requisitos: []
    };
    return this.http.post<any>(`${this.cursosApiUrl}/cursos`, body);
  }

  updateCourse(course: any): Observable<boolean> {
    console.log('Update Course (endpoint no disponible aún):', course);
    return of(true);
  }

  deleteCourse(courseId: string): Observable<boolean> {
    console.log('Delete Course (endpoint no disponible aún):', courseId);
    return of(true);
  }
}

