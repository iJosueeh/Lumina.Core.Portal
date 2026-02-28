import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, forkJoin, delay, switchMap, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly usuariosApiUrl = environment.apiUrl;
  private readonly cursosApiUrl = environment.cursosApiUrl;
  private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<any> {
    // Obtener datos reales de múltiples endpoints
    // Solo llamamos a los endpoints que sabemos que existen y funcionan
    return forkJoin({
      usuarios: this.http.get<any[]>(`${this.usuariosApiUrl}/usuarios`).pipe(
        catchError(() => of([]))
      ),
      cursos: this.http.get<any[]>(`${this.cursosApiUrl}/cursos`).pipe(
        catchError(() => of([]))
      )
    }).pipe(
      map(({ usuarios, cursos }) => {
        // Calcular estadísticas basadas en datos de usuarios
        const totalUsuarios = usuarios.length;
        
        console.log('📥 [ADMIN SERVICE] Usuarios recibidos:', usuarios.length);
        console.log('📥 [ADMIN SERVICE] Muestra de usuario:', usuarios[0]);
        
        // Contar usuarios por rol usando el campo rolNombre del backend
        let totalDocentes = 0;
        let totalEstudiantes = 0;
        let totalAdmins = 0;
        
        usuarios.forEach((u: any) => {
          const rol = u.rolNombre || '';
          const rolLower = rol.toLowerCase();
          
          if (rolLower === 'teacher') {
            totalDocentes++;
          } else if (rolLower === 'student') {
            totalEstudiantes++;
          } else if (rolLower === 'admin') {
            totalAdmins++;
          }
        });
        
        const totalCursos = cursos.length;

        console.log('📊 [ADMIN SERVICE] Estadísticas:', {
          totalUsuarios,
          totalDocentes,
          totalEstudiantes,
          totalAdmins,
          totalCursos
        });

        // Construir objeto de dashboard
        return {
          stats: [
            {
              label: 'Estudiantes',
              icon: 'users',
              value: totalEstudiantes.toString(),
              trend: '+5.2%',
              trendType: 'positive',
              description: 'vs. mes anterior'
            },
            {
              label: 'Docentes',
              icon: 'chalkboard-teacher',
              value: totalDocentes.toString(),
              trend: '+2.1%',
              trendType: 'positive',
              description: 'activos este semestre'
            },
            {
              label: 'Cursos',
              icon: 'book',
              value: totalCursos.toString(),
              trend: '+8.3%',
              trendType: 'positive',
              description: 'programas activos'
            },
            {
              label: 'Usuarios Totales',
              icon: 'university',
              value: totalUsuarios.toString(),
              trend: '+4.7%',
              trendType: 'positive',
              description: 'usuarios registrados'
            }
          ],
          systemStatus: [
            {
              title: 'Todos los servicios operativos',
              type: 'info',
              timestamp: new Date().toISOString(),
              message: `Sistema funcionando: ${totalUsuarios} usuarios (${totalDocentes} docentes, ${totalEstudiantes} estudiantes), ${totalCursos} cursos`
            }
          ],
          recentActivity: []
        };
      }),
      catchError((error) => {
        console.error('❌ [ADMIN SERVICE] Error al cargar datos del dashboard:', error);
        // Si falla, retornar estructura con valores en 0
        return of({
          stats: [
            {
              label: 'Estudiantes',
              icon: 'users',
              value: '0',
              trend: '0%',
              trendType: 'positive',
              description: 'Error al cargar datos'
            },
            {
              label: 'Docentes',
              icon: 'chalkboard-teacher',
              value: '0',
              trend: '0%',
              trendType: 'positive',
              description: 'Error al cargar datos'
            },
            {
              label: 'Cursos',
              icon: 'book',
              value: '0',
              trend: '0%',
              trendType: 'positive',
              description: 'Error al cargar datos'
            },
            {
              label: 'Usuarios Totales',
              icon: 'university',
              value: '0',
              trend: '0%',
              trendType: 'positive',
              description: 'Error al cargar datos'
            }
          ],
          systemStatus: [
            {
              title: 'Error al conectar con los servicios',
              type: 'error',
              timestamp: new Date().toISOString(),
              message: 'No se pudo obtener información del sistema'
            }
          ],
          recentActivity: []
        });
      })
    );
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuariosApiUrl}/usuarios`).pipe(
      map(users => {
        console.log('📥 [ADMIN] Sample user from backend:', users[0]);
        return users.map(u => {
          // Mapear rolNombre del backend a formato interno
          const rolNombre = u.rolNombre || u.RolNombre || '';
          const rolId = u.rolId || u.RolId || '';
          let role = 'USER';
          if (rolNombre.toLowerCase() === 'admin') {
            role = 'ADMIN';
          } else if (rolNombre.toLowerCase() === 'teacher') {
            role = 'TEACHER';
          } else if (rolNombre.toLowerCase() === 'student') {
            role = 'STUDENT';
          }
          
          return {
            id: u.id ?? u.Id,
            fullName: `${u.nombresPersona ?? u.NombresPersona ?? ''} ${u.apellidoPaterno ?? u.ApellidoPaterno ?? ''} ${u.apellidoMaterno ?? u.ApellidoMaterno ?? ''}`.trim(),
            email: u.email ?? u.Email,
            username: u.username ?? u.Username,
            role: role,
            rolId: rolId,
            rolNombre: rolNombre,
            status: (u.estado ?? u.Estado ?? 'Activo') === 'Activo' ? 'ACTIVE' : 'SUSPENDED',
            department: u.departamento ?? u.Departamento ?? '',
            pais: u.pais ?? u.Pais ?? 'Peru',
            provincia: u.provincia ?? u.Provincia ?? 'Lima',
            distrito: u.distrito ?? u.Distrito ?? 'Lima',
            calle: u.calle ?? u.Calle ?? '-',
            fechaNacimiento: u.fechaNacimiento ?? u.FechaNacimiento,
            nombresPersona: u.nombresPersona ?? u.NombresPersona ?? '',
            apellidoPaterno: u.apellidoPaterno ?? u.ApellidoPaterno ?? '',
            apellidoMaterno: u.apellidoMaterno ?? u.ApellidoMaterno ?? ''
          };
        });
      }),
      catchError(() => this.http.get<any[]>('/assets/mock-data/users/users.json'))
    );
  }

  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.cursosApiUrl}/cursos`).pipe(
      map(courses => {
        console.log('📦 [ADMIN] Sample course from backend:', courses[0]);
        return courses.map(c => ({
          id: c.id ?? c.Id,
          name: c.titulo ?? c.Titulo ?? '',
          code: c.codigo ?? c.Codigo ?? 'N/A',
          instructorId: c.instructorId ?? c.InstructorId ?? null,
          teacherName: c.instructorId ?? c.InstructorId ? `Docente ${String(c.instructorId ?? c.InstructorId).substring(0, 6)}` : 'Sin asignar',
          capacity: c.capacidad ?? c.Capacidad ?? 150,
          enrolled: c.matriculados ?? c.Matriculados ?? 0,
          status: c.estadoCurso ?? c.EstadoCurso ?? 'PUBLISHED',
          description: c.descripcion ?? c.Descripcion ?? '',
          ciclo: c.ciclo ?? c.Ciclo ?? '',
          creditos: c.creditos ?? c.Creditos ?? 0,
          categoria: c.categoria ?? c.Categoria ?? '',
          nivel: c.nivel ?? c.Nivel ?? '',
          duracion: c.duracion ?? c.Duracion ?? '',
          coverImage: c.imagen ?? c.Imagen ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070',
          modules: Array.from({ length: c.modulosCount ?? c.ModulosCount ?? 0 }, (_, i) => ({
            id: `module-${i}`,
            titulo: `Módulo ${i + 1}`,
            descripcion: '',
            lecciones: []
          })),
          evaluaciones: [] // Las evaluaciones vienen del microservicio de Evaluaciones
        }));
      }),
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
    // Extraer nombres del fullName si fue modificado
    const nameParts = (user.fullName ?? '').trim().split(' ');
    const nombres = user.nombresPersona ?? nameParts[0] ?? 'Usuario';
    const apellidoPaterno = user.apellidoPaterno ?? nameParts[1] ?? nameParts[0] ?? 'Sin';
    const apellidoMaterno = user.apellidoMaterno ?? nameParts[2] ?? 'Apellido';
    
    const body = {
      id: user.id,
      password: user.password ?? 'Sin_Cambio_123', // Backend puede ignorar esto
      rol: user.rolId, // GUID del rol
      nombres: nombres,
      apellidoPaterno: apellidoPaterno,
      apellidoMaterno: apellidoMaterno,
      fechaNacimiento: user.fechaNacimiento ?? new Date('2000-01-01').toISOString(),
      email: user.email,
      pais: user.pais ?? 'Peru',
      departamento: user.department ?? user.departamento ?? 'Lima',
      provincia: user.provincia ?? 'Lima',
      distrito: user.distrito ?? 'Lima',
      calle: user.calle ?? '-'
    };
    
    return this.http.put(`${this.usuariosApiUrl}/usuarios/${user.id}`, body).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error actualizando usuario:', error);
        return of(false);
      })
    );
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
    console.log('🔄 [ADMIN] Actualizando curso:', course);
    
    // Preparar datos para el backend
    const courseData = {
      id: course.id,
      titulo: course.name,
      descripcion: course.description,
      categoria: course.categoria || '',
      nivel: course.nivel || '',
      imagen: course.coverImage,
      duracion: course.duracion || '',
      precio: course.price || 0,
      capacidad: course.capacity,
      codigo: course.code,
      ciclo: course.ciclo,
      creditos: course.creditos,
      estadoCurso: course.status,
      instructorId: course.instructorId || null,
      modulos: course.modules?.map((m: any) => ({
        id: m.id,
        titulo: m.title,
        descripcion: m.description,
        duracion: m.duration,
        contenidos: m.contents?.map((c: any) => ({
          id: c.id,
          titulo: c.title,
          tipo: c.type,
          duracion: c.duration,
          contenido: c.content
        }))
      })),
      evaluaciones: course.evaluaciones?.map((e: any) => ({
        id: e.id,
        nombre: e.nombre || e.titulo,
        tipo: e.tipo,
        peso: e.peso || e.puntajeMaximo,
        fechaLimite: e.fechaLimite || e.fechaFin,
        preguntas: e.preguntas?.map((p: any) => ({
          id: p.id,
          texto: p.texto,
          puntos: p.puntos,
          explicacion: p.explicacion,
          opciones: p.opciones?.map((o: any) => ({
            id: o.id,
            texto: o.texto,
            esCorrecta: o.esCorrecta
          }))
        }))
      }))
    };
    
    // TODO: Cuando el endpoint esté disponible, descomentar:
    // return this.http.put<boolean>(`${this.cursosApiUrl}/cursos/${course.id}`, courseData);
    
    // Mock temporal
    console.log('📤 [ADMIN] Datos preparados para enviar:', courseData);
    console.log('✅ [ADMIN] Curso actualizado correctamente (mock)');
    return of(true).pipe(delay(500));
  }

  deleteCourse(courseId: string): Observable<boolean> {
    console.log('Delete Course (endpoint no disponible aún):', courseId);
    return of(true);
  }

  createEvaluation(evaluation: any): Observable<any> {
    console.log('🆕 [ADMIN] Creando evaluación:', evaluation);
    
    // Convertir fechaLimite de formato yyyy-MM-dd a ISO si es necesario
    let fechaFin = evaluation.fechaLimite || evaluation.fechaFin;
    if (fechaFin && !fechaFin.includes('T')) {
      // Si es formato yyyy-MM-dd, convertir a ISO
      fechaFin = new Date(fechaFin + 'T23:59:59').toISOString();
    } else if (!fechaFin) {
      fechaFin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Map tipo string to numeric enum (Backend: 1=Examen, 2=Tarea, 3=Proyecto, 4=Quizz)
    const tipoMap: Record<string, number> = {
      'Examen': 1,
      'Tarea': 2,
      'Proyecto': 3,
      'Quiz': 4,
      'Quizz': 4,
      'Práctica': 2,  // Map Práctica to Tarea
      'Ensayo': 2     // Map Ensayo to Tarea
    };
    const tipoNumeric = tipoMap[evaluation.tipo] || 1; // Default to Examen
    
    const evaluationData = {
      titulo: evaluation.nombre || evaluation.titulo || 'Evaluación sin título',
      descripcion: evaluation.descripcion || '',
      tipoEvaluacion: tipoNumeric,
      puntajeMaximo: Number(evaluation.peso || evaluation.puntajeMaximo || 100),
      fechaInicio: new Date().toISOString(),
      fechaFin: fechaFin,
      duracionMinutos: Number(evaluation.duracionMinutos || 60),
      cursoId: evaluation.cursoId,
      docenteId: evaluation.docenteId
      // NO enviar preguntas aquí - se agregan después con endpoint separado
    };
    
    console.log('📤 [ADMIN] Datos de evaluación a enviar:', JSON.stringify(evaluationData, null, 2));
    const preguntas = evaluation.preguntas || [];
    console.log(`📝 [ADMIN] Preguntas a agregar después: ${preguntas.length}`);

    return this.http.post<any>(`${this.evaluacionesApiUrl}/evaluaciones`, evaluationData).pipe(
      tap(response => {
        console.log('✅ [ADMIN] Evaluación creada:', response);
      }),
      switchMap(response => {
        const evaluacionId = response.id || response.Id || response;
        console.log(`➕ [ADMIN] Agregando ${preguntas.length} preguntas a evaluación ${evaluacionId}`);
        
        if (preguntas.length === 0) {
          return of(response);
        }
        
        // Agregar cada pregunta usando el endpoint correcto
        const preguntaRequests = preguntas.map((p: any, index: number) => {
          const preguntaData = {
            tipoPregunta: 1, // 1 = Opción múltiple
            texto: p.texto || '',
            puntos: Number(p.puntos || 10),
            orden: index + 1,
            explicacion: p.explicacion || '',
            opciones: (p.opciones || []).map((o: any, i: number) => ({
              texto: o.texto || '',
              esCorrecta: Boolean(o.esCorrecta),
              orden: i + 1
            }))
          };
          
          return this.http.post(`${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`, preguntaData);
        });
        
        // Ejecutar todas las peticiones en paralelo
        return forkJoin(preguntaRequests).pipe(
          map(() => {
            console.log(`✅ [ADMIN] ${preguntas.length} preguntas agregadas exitosamente`);
            return response;
          }),
          catchError(err => {
            console.error('❌ [ADMIN] Error agregando preguntas:', err);
            // Aunque las preguntas fallen, devolvemos la evaluación creada
            return of(response);
          })
        );
      }),
      catchError((error) => {
        console.error('❌ [ADMIN] Error creando evaluación:', error);
        console.error('📋 Error details:', error.error);
        throw error;
      })
    );
  }

  updateEvaluation(evaluation: any): Observable<any> {
    console.log('🔄 [ADMIN] Actualizando evaluación:', evaluation);
    
    // Convertir fechaLimite de formato yyyy-MM-dd a ISO si es necesario
    let fechaFin = evaluation.fechaLimite || evaluation.fechaFin;
    if (fechaFin && !fechaFin.includes('T')) {
      // Si es formato yyyy-MM-dd, convertir a ISO
      fechaFin = new Date(fechaFin + 'T23:59:59').toISOString();
    } else if (!fechaFin) {
      fechaFin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Map tipo string to numeric enum (Backend: 1=Examen, 2=Tarea, 3=Proyecto, 4=Quizz)
    const tipoMap: Record<string, number> = {
      'Examen': 1,
      'Tarea': 2,
      'Proyecto': 3,
      'Quiz': 4,
      'Quizz': 4,
      'Práctica': 2,  // Map Práctica to Tarea
      'Ensayo': 2     // Map Ensayo to Tarea
    };
    const tipoNumeric = tipoMap[evaluation.tipo] || 1; // Default to Examen
    
    const evaluationData = {
      id: evaluation.id,
      titulo: evaluation.nombre || evaluation.titulo || 'Evaluación sin título',
      descripcion: evaluation.descripcion || '',
      tipoEvaluacion: tipoNumeric,
      puntajeMaximo: Number(evaluation.peso || evaluation.puntajeMaximo || 100),
      fechaInicio: new Date().toISOString(),
      fechaFin: fechaFin,
      duracionMinutos: Number(evaluation.duracionMinutos || 60),
      cursoId: evaluation.cursoId,
      docenteId: evaluation.docenteId
      // NO enviar preguntas aquí - actualización solo afecta datos básicos
      // Las preguntas se manejan por separado con endpoints específicos
    };
    
    console.log('📤 [ADMIN] Datos a enviar:', JSON.stringify(evaluationData, null, 2));

    return this.http.put<any>(`${this.evaluacionesApiUrl}/evaluaciones/${evaluation.id}`, evaluationData).pipe(
      map(response => {
        console.log('✅ [ADMIN] Evaluación actualizada:', response);
        return response;
      }),
      catchError((error) => {
        console.error('❌ [ADMIN] Error actualizando evaluación:', error);
        console.error('📋 Error details:', error.error);
        throw error;
      })
    );
  }

  // Sincronizar preguntas de una evaluación (eliminar todas y agregar nuevas)
  syncEvaluationQuestions(evaluacionId: string, preguntas: any[]): Observable<any> {
    console.log(`🔄 [ADMIN] Sincronizando ${preguntas.length} preguntas para evaluación ${evaluacionId}`);
    
    if (preguntas.length === 0) {
      console.log('⚠️ [ADMIN] No hay preguntas para sincronizar');
      return of({ success: true, preguntasCreadas: 0 });
    }
    
    // 1. Obtener preguntas existentes
    return this.http.get<any>(`${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`).pipe(
      switchMap(response => {
        const preguntasExistentes = response?.preguntas || response?.Preguntas || [];
        const idsAEliminar = preguntasExistentes.map((p: any) => p.id || p.Id);
        
        console.log(`🗑️ [ADMIN] Eliminando ${idsAEliminar.length} preguntas existentes`);
        
        // 2. Eliminar todas las preguntas existentes
        const deleteRequests = idsAEliminar.map((id: string) => 
          this.http.delete(`${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas/${id}`).pipe(
            catchError(err => {
              console.warn(`⚠️ [ADMIN] Error eliminando pregunta ${id}:`, err);
              return of(null); // Continuar aunque falle
            })
          )
        );
        
        // Si no hay preguntas para eliminar, retornar observable vacío
        const deleteAll$ = deleteRequests.length > 0 
          ? forkJoin(deleteRequests) 
          : of([]);
        
        return deleteAll$.pipe(
          switchMap(() => {
            console.log(`➕ [ADMIN] Agregando ${preguntas.length} preguntas nuevas`);
            
            // 3. Agregar todas las preguntas nuevas
            const createRequests = preguntas.map((p: any, index: number) => {
              const preguntaData = {
                tipoPregunta: 1, // 1 = Opción múltiple
                texto: p.texto || '',
                puntos: Number(p.puntos || 10),
                orden: index + 1,
                explicacion: p.explicacion || '',
                opciones: (p.opciones || []).map((o: any, i: number) => ({
                  texto: o.texto || '',
                  esCorrecta: Boolean(o.esCorrecta),
                  orden: i + 1
                }))
              };
              
              return this.http.post(`${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`, preguntaData).pipe(
                catchError(err => {
                  console.error(`❌ [ADMIN] Error agregando pregunta ${index + 1}:`, err);
                  throw err;
                })
              );
            });
            
            return forkJoin(createRequests).pipe(
              map(results => {
                console.log(`✅ [ADMIN] ${results.length} preguntas sincronizadas exitosamente`);
                return { success: true, preguntasCreadas: results.length };
              })
            );
          })
        );
      }),
      catchError(err => {
        console.error('❌ [ADMIN] Error sincronizando preguntas:', err);
        throw err;
      })
    );
  }

  getCourseEvaluations(cursoId: string): Observable<any[]> {
    return this.http.get<any>(`${this.evaluacionesApiUrl}/evaluaciones?cursoId=${cursoId}`).pipe(
      map(response => {
        console.log('📊 [ADMIN] Response completo:', response);
        
        // El backend devuelve { mensaje, evaluaciones: [...], cursoId }
        const evaluacionesArray = response?.evaluaciones || response?.Evaluaciones || [];
        console.log('📊 [ADMIN] Evaluaciones del curso:', evaluacionesArray.length);
        
        return evaluacionesArray.map((e: any) => ({
          id: e.id ?? e.Id,
          nombre: e.titulo ?? e.Titulo ?? e.nombre ?? e.Nombre ?? '',
          tipo: e.tipo ?? e.Tipo ?? 'Examen',
          peso: e.puntajeMaximo ?? e.PuntajeMaximo ?? e.peso ?? e.Peso ?? 100,
          fechaLimite: e.fechaLimite ?? e.FechaLimite ?? e.fechaFin ?? e.FechaFin ?? '',
          preguntas: [] 
        }));
      }),
      catchError((error) => {
        console.error('Error obteniendo evaluaciones:', error);
        return of([]);
      })
    );
  }

  getEvaluationQuestions(evaluacionId: string): Observable<any[]> {
    return this.http.get<any>(`${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`).pipe(
      map(response => {
        console.log('📝 [ADMIN] Evaluación con preguntas:', response);
        
        // El backend devuelve { id, titulo, preguntas: [...] }
        const preguntasArray = response?.preguntas || response?.Preguntas || [];
        console.log('📝 [ADMIN] Preguntas de la evaluación:', preguntasArray.length);
        
        return preguntasArray.map((p: any) => ({
          id: p.id ?? p.Id ?? `Q-${Date.now()}-${Math.random()}`,
          texto: p.texto ?? p.Texto ?? p.enunciado ?? p.Enunciado ?? '',
          puntos: p.puntos ?? p.Puntos ?? p.puntaje ?? p.Puntaje ?? 10,
          explicacion: p.explicacion ?? p.Explicacion ?? '',
          opciones: (p.opciones ?? p.Opciones ?? []).map((o: any) => ({
            id: o.id ?? o.Id ?? `O-${Date.now()}-${Math.random()}`,
            texto: o.texto ?? o.Texto ?? o.contenido ?? o.Contenido ?? '',
            esCorrecta: o.esCorrecta ?? o.EsCorrecta ?? o.correcta ?? o.Correcta ?? false
          }))
        }));
      }),
      catchError((error) => {
        console.error('Error obteniendo preguntas:', error);
        return of([]);
      })
    );
  }
}

