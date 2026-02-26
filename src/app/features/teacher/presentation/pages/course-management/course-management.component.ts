import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { TeacherStudentRepository } from '@features/teacher/domain/repositories/teacher-student.repository';
import { TeacherStudent } from '@features/teacher/domain/models/teacher-student.model';
import { AuthService } from '@core/services/auth.service';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';

interface EvaluacionApi {
  id: string;
  titulo: string;
  tipoEvaluacion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  totalPreguntas: number;
  puntajeMaximo: number;
}

interface QuestionDraft {
  texto: string;
  puntos: number;
  explicacion: string;
  opciones: { texto: string; esCorrecta: boolean }[];
}

interface TeacherCourseDetail {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  creditos: number;
  ciclo: string;
  totalAlumnos: number;
  alumnosActivos: number;
  alumnosInactivos: number;
  promedioGeneral: number;
  asistenciaPromedio: number;
  estadoCurso: 'Activo' | 'Finalizado' | 'Programado';
  coverImage: string;
  horario: any[];
  nivel?: string;
  modalidad?: string;
  duracion?: string;
  categoria?: string;
  instructorNombre?: string;
  stats: {
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    tareasEntregadas: number;
    tareasPendientes: number;
    promedioMasAlto: number;
    promedioMasBajo: number;
  };
  evaluaciones: Evaluacion[];
}

interface Evaluacion {
  id: string;
  nombre: string;
  tipo: string;
  peso: number;
  fechaLimite: string;
  estado: string;
  calificadas: number;
  pendientes: number;
  promedio: number;
}

interface Modulo {
  id: string;
  orden: number;
  titulo: string;
  descripcion: string;
  duracion: string;
  lecciones: Leccion[];
  completado: boolean;
  porcentajeCompletado: number;
}

interface Leccion {
  id: string;
  titulo: string;
  tipo: 'video' | 'lectura' | 'quiz' | 'tarea';
  duracion: string;
  completada: boolean;
}

interface CourseStudent {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  email: string;
  avatar: string;
  promedio: number;
  asistencia: number;
  tareasEntregadas: number;
  tareasPendientes: number;
  estado: string;
  ultimoAcceso: string;
}

type TabType = 'overview' | 'modulos' | 'estudiantes' | 'evaluaciones';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-management.component.html',
  styles: ``,
})
export class CourseManagementComponent implements OnInit {
  courseId = signal<string>('');
  course = signal<TeacherCourseDetail | null>(null);
  students = signal<CourseStudent[]>([]);
  modulos = signal<Modulo[]>([]);
  expandedModules = signal<Set<string>>(new Set());
  isLoading = signal(true);
  activeTab = signal<TabType>('overview');

  // Computed values
  totalStudents = computed(() => this.course()?.totalAlumnos || 0);
  averageGrade = computed(() => this.course()?.promedioGeneral || 0);
  pendingEvaluations = computed(
    () => this.course()?.evaluaciones.filter((e) => e.estado === 'En Calificación').length || 0,
  );
  totalLecciones = computed(() => {
    return this.modulos().reduce((acc, m) => acc + m.lecciones.length, 0);
  });

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseRepository = inject(TeacherCourseRepository);
  private studentRepository = inject(TeacherStudentRepository);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private teacherQuery = inject(TeacherQueryService);

  // ── Evaluaciones reales ──────────────────────────────────────────────────
  courseEvaluaciones = signal<EvaluacionApi[]>([]);
  isLoadingEvaluaciones = signal(false);

  // ── Modal: Crear Quizz ────────────────────────────────────────────────────
  showCreateQuizzModal = signal(false);
  quizzForm = {
    titulo: '',
    descripcion: '',
    fechaInicio: new Date().toISOString().slice(0, 16),
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    puntajeMaximo: 100,
  };

  // ── Modal: Editor de Preguntas ────────────────────────────────────────────
  showQuestionEditor = signal(false);
  editingQuizzId = signal('');
  editingQuizzTitle = signal('');
  savingQuestions = signal(false);
  questionsList: QuestionDraft[] = [];

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const courseId = params['id'];
      this.courseId.set(courseId);
      console.log('🔍 [COURSE-MANAGEMENT] Received courseId from route:', courseId);
      this.loadCourseData();
    });
  }

  loadCourseData(): void {
    this.isLoading.set(true);
    const usuarioId = this.authService.getUserId();

    const students$ = usuarioId
      ? this.studentRepository.getStudentsByTeacher(usuarioId).pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      courseData: this.courseRepository.getCourseById(this.courseId()),
      allStudents: students$,
    }).subscribe({
      next: ({ courseData, allStudents }) => {
        console.log('✅ [COURSE-MANAGEMENT] Course loaded:', courseData.titulo);

        // Filter students enrolled in this specific course
        const courseId = this.courseId();
        const enrolledStudents = allStudents.filter((s) =>
          s.cursos.includes(courseId),
        );

        const course: TeacherCourseDetail = {
          id: courseData.id,
          codigo: courseData.codigo,
          titulo: courseData.titulo,
          descripcion: courseData.descripcion || 'Sin descripción',
          creditos: courseData.creditos,
          ciclo: courseData.ciclo,
          totalAlumnos: enrolledStudents.length || courseData.totalAlumnos,
          alumnosActivos: enrolledStudents.length || courseData.alumnosActivos,
          alumnosInactivos: 0,
          promedioGeneral: courseData.promedioGeneral,
          asistenciaPromedio: courseData.asistenciaPromedio,
          estadoCurso: courseData.estadoCurso,
          coverImage: courseData.imagen || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
          horario: courseData.horario || [],
          nivel: courseData.nivel,
          modalidad: courseData.modalidad,
          duracion: courseData.duracion,
          categoria: courseData.categoria,
          instructorNombre: courseData.instructor?.nombre,
          stats: {
            aprobados: 0,
            reprobados: 0,
            enRiesgo: 0,
            tareasEntregadas: 0,
            tareasPendientes: 0,
            promedioMasAlto: 0,
            promedioMasBajo: 0,
          },
          evaluaciones: [],
        };
        this.course.set(course);

        // Map modules from API
        if (courseData.modulos && courseData.modulos.length > 0) {
          this.modulos.set(
            courseData.modulos.map((m, i) => this.mapApiModuloToModulo(m, i)),
          );
        } else {
          this.loadCourseModules();
        }

        // Set filtered students
        this.students.set(
          enrolledStudents.map((s) => this.mapTeacherStudentToCourseStudent(s)),
        );

        this.isLoading.set(false);
        this.loadEvaluaciones();
      },
      error: (error) => {
        console.error('❌ [COURSE-MANAGEMENT] Error loading course data:', error);
        this.isLoading.set(false);
      },
    });
  }

  async loadEvaluaciones(): Promise<void> {
    const courseId = this.courseId();
    if (!courseId) return;
    this.isLoadingEvaluaciones.set(true);
    try {
      const resp = await firstValueFrom(
        this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${courseId}`)
      );
      const mapped: EvaluacionApi[] = (resp.evaluaciones || []).map((e: any) => ({
        id: e.id,
        titulo: e.titulo,
        tipoEvaluacion: e.tipoEvaluacion ?? e.tipo ?? 'Quizz',
        fechaInicio: e.fechaInicio,
        fechaFin: e.fechaFin ?? e.fechaLimite,
        estado: e.estado ?? 'Pendiente',
        totalPreguntas: e.totalPreguntas ?? 0,
        puntajeMaximo: e.puntajeMaximo ?? 0,
      }));
      this.courseEvaluaciones.set(mapped);
      console.log(`✅ [COURSE-MGMT] ${mapped.length} evaluaciones cargadas`);
    } catch (err) {
      console.error('❌ [COURSE-MGMT] Error loading evaluaciones:', err);
    } finally {
      this.isLoadingEvaluaciones.set(false);
    }
  }

  private mapApiModuloToModulo(m: any, index: number): Modulo {
    const lecciones: Leccion[] = (m.lecciones || []).map(
      (titulo: string, i: number) => ({
        id: `${m.id || index}-${i}`,
        titulo,
        tipo: 'lectura' as const,
        duracion: '30 min',
        completada: false,
      }),
    );
    return {
      id: m.id || String(index + 1),
      orden: index + 1,
      titulo: m.titulo || `Módulo ${index + 1}`,
      descripcion: m.descripcion || '',
      duracion: `${Math.max(lecciones.length, 1) * 30} min`,
      completado: false,
      porcentajeCompletado: 0,
      lecciones,
    };
  }

  private mapTeacherStudentToCourseStudent(s: TeacherStudent): CourseStudent {
    const partes = s.nombreCompleto.trim().split(' ');
    const nombre = partes[0] || s.nombreCompleto;
    const apellidos = partes.slice(1).join(' ');
    const avatarName = encodeURIComponent(s.nombreCompleto.trim() || 'Estudiante');
    return {
      id: s.id,
      codigo: s.email || s.usuarioId.slice(0, 8).toUpperCase(),
      nombre,
      apellidos,
      email: s.email,
      avatar: `https://ui-avatars.com/api/?name=${avatarName}&background=0d9488&color=fff&size=128&bold=true`,
      promedio: 0,
      asistencia: 0,
      tareasEntregadas: 0,
      tareasPendientes: 0,
      estado: 'Activo',
      ultimoAcceso: new Date().toISOString(),
    };
  }

  loadCourseModules(): void {
    // Datos de respaldo para módulos
    this.modulos.set([
      {
        id: '1',
        orden: 1,
        titulo: 'Introducción al Curso',
        descripcion: 'Fundamentos y conceptos básicos para iniciar el aprendizaje',
        duracion: '2 horas',
        completado: true,
        porcentajeCompletado: 100,
        lecciones: [
          {
            id: '1-1',
            titulo: 'Bienvenida y presentación del curso',
            tipo: 'video',
            duracion: '15 min',
            completada: true,
          },
          {
            id: '1-2',
            titulo: 'Objetivos de aprendizaje',
            tipo: 'lectura',
            duracion: '10 min',
            completada: true,
          },
          {
            id: '1-3',
            titulo: 'Quiz de diagnóstico inicial',
            tipo: 'quiz',
            duracion: '20 min',
            completada: true,
          },
        ],
      },
      {
        id: '2',
        orden: 2,
        titulo: 'Conceptos Fundamentales',
        descripcion: 'Teoría y práctica de los conceptos core del curso',
        duracion: '4 horas',
        completado: false,
        porcentajeCompletado: 65,
        lecciones: [
          {
            id: '2-1',
            titulo: 'Fundamentos teóricos',
            tipo: 'video',
            duracion: '45 min',
            completada: true,
          },
          {
            id: '2-2',
            titulo: 'Ejemplos prácticos',
            tipo: 'video',
            duracion: '30 min',
            completada: true,
          },
          {
            id: '2-3',
            titulo: 'Ejercicios prácticos',
            tipo: 'tarea',
            duracion: '1 hora',
            completada: false,
          },
          {
            id: '2-4',
            titulo: 'Quiz de refuerzo',
            tipo: 'quiz',
            duracion: '25 min',
            completada: false,
          },
        ],
      },
      {
        id: '3',
        orden: 3,
        titulo: 'Aplicaciones Avanzadas',
        descripcion: 'Casos de uso reales y proyectos prácticos',
        duracion: '6 horas',
        completado: false,
        porcentajeCompletado: 30,
        lecciones: [
          {
            id: '3-1',
            titulo: 'Casos de estudio',
            tipo: 'video',
            duracion: '1 hora',
            completada: true,
          },
          {
            id: '3-2',
            titulo: 'Proyecto integrador',
            tipo: 'tarea',
            duracion: '3 horas',
            completada: false,
          },
          {
            id: '3-3',
            titulo: 'Evaluación final',
            tipo: 'quiz',
            duracion: '1 hora',
            completada: false,
          },
        ],
      },
    ]);
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      // Estados de evaluación
      'En Calificación': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pendiente: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      // Estados del curso
      Activo: 'bg-teal-900/40 text-teal-300 border border-teal-500/30',
      Finalizado: 'bg-gray-800/60 text-gray-300 border border-gray-500/30',
      Programado: 'bg-blue-900/40 text-blue-300 border border-blue-500/30',
    };
    return colors[estado] || 'bg-gray-800/60 text-gray-400 border border-gray-600/30';
  }

  getStudentStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      Activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Inactivo: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  // ── Quizz: Crear ────────────────────────────────────────────────────────
  openCreateQuizz(): void {
    this.quizzForm = {
      titulo: '',
      descripcion: '',
      fechaInicio: new Date().toISOString().slice(0, 16),
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      puntajeMaximo: 100,
    };
    this.showCreateQuizzModal.set(true);
  }

  async submitCreateQuizz(): Promise<void> {
    const usuarioId = this.authService.getUserId() || '';
    try {
      const teacherInfo = await this.teacherQuery.getTeacherInfo(usuarioId);
      const body = {
        cursoId: this.courseId(),
        docenteId: teacherInfo.id,
        titulo: this.quizzForm.titulo,
        descripcion: this.quizzForm.descripcion,
        fechaInicio: new Date(this.quizzForm.fechaInicio).toISOString(),
        fechaFin: new Date(this.quizzForm.fechaFin).toISOString(),
        puntajeMaximo: Number(this.quizzForm.puntajeMaximo),
        tipoEvaluacion: 4, // Quizz
      };
      const newId = await firstValueFrom(
        this.http.post<string>(`${environment.evaluacionesApiUrl}/evaluaciones`, body)
      );
      console.log('✅ [COURSE-MGMT] Quizz creado id:', newId);
      this.showCreateQuizzModal.set(false);
      await this.loadEvaluaciones();
      if (newId) {
        this.openQuestionEditor(String(newId), this.quizzForm.titulo);
      }
    } catch (err) {
      console.error('❌ [COURSE-MGMT] Error creando quizz:', err);
    }
  }

  // ── Quizz: Editor de Preguntas ───────────────────────────────────────────
  viewEvaluation(evaluationId: string): void {
    const ev = this.courseEvaluaciones().find((e) => e.id === evaluationId);
    this.openQuestionEditor(evaluationId, ev?.titulo ?? '');
  }

  openQuestionEditor(evaluacionId: string, titulo: string): void {
    this.editingQuizzId.set(evaluacionId);
    this.editingQuizzTitle.set(titulo);
    this.questionsList = [this.createEmptyQuestion()];
    this.showQuestionEditor.set(true);
  }

  private createEmptyQuestion(): QuestionDraft {
    return {
      texto: '',
      puntos: 10,
      explicacion: '',
      opciones: [
        { texto: '', esCorrecta: true },
        { texto: '', esCorrecta: false },
        { texto: '', esCorrecta: false },
        { texto: '', esCorrecta: false },
      ],
    };
  }

  addEmptyQuestion(): void {
    this.questionsList = [...this.questionsList, this.createEmptyQuestion()];
  }

  removeQuestion(idx: number): void {
    this.questionsList = this.questionsList.filter((_, i) => i !== idx);
  }

  setCorrectOpcion(qIdx: number, oIdx: number): void {
    this.questionsList[qIdx].opciones.forEach((o, i) => (o.esCorrecta = i === oIdx));
  }

  addOpcion(qIdx: number): void {
    this.questionsList[qIdx].opciones.push({ texto: '', esCorrecta: false });
  }

  removeOpcion(qIdx: number, oIdx: number): void {
    const q = this.questionsList[qIdx];
    q.opciones = q.opciones.filter((_, i) => i !== oIdx);
  }

  async submitQuestions(): Promise<void> {
    const evaluacionId = this.editingQuizzId();
    this.savingQuestions.set(true);
    try {
      for (let i = 0; i < this.questionsList.length; i++) {
        const q = this.questionsList[i];
        const body = {
          evaluacionId,
          tipoPregunta: 1, // OpcionMultiple
          texto: q.texto,
          puntos: q.puntos,
          orden: i + 1,
          explicacion: q.explicacion || null,
          respuestaCorrecta: null,
          opciones: q.opciones.map((o, oIdx) => ({
            texto: o.texto,
            esCorrecta: o.esCorrecta,
            orden: oIdx + 1,
          })),
        };
        await firstValueFrom(
          this.http.post<any>(
            `${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`,
            body
          )
        );
      }
      console.log(`✅ [COURSE-MGMT] ${this.questionsList.length} preguntas guardadas`);
      this.showQuestionEditor.set(false);
      await this.loadEvaluaciones();
    } catch (err) {
      console.error('❌ [COURSE-MGMT] Error guardando preguntas:', err);
    } finally {
      this.savingQuestions.set(false);
    }
  }

  viewStudentDetails(studentId: string): void {
    this.router.navigate(['/teacher/student', studentId]);
  }

  getLeccionIcon(tipo: string): string {
    const icons: Record<string, string> = {
      video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      lectura: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      quiz: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      tarea: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[tipo] || icons['lectura'];
  }

  getLeccionTypeLabel(tipo: string): string {
    const labels: Record<string, string> = {
      video: 'Video',
      lectura: 'Lectura',
      quiz: 'Evaluación',
      tarea: 'Tarea',
    };
    return labels[tipo] || tipo;
  }

  toggleModuleExpansion(moduleId: string): void {
    const current = new Set(this.expandedModules());
    if (current.has(moduleId)) {
      current.delete(moduleId);
    } else {
      current.add(moduleId);
    }
    this.expandedModules.set(current);
  }

  viewLeccion(leccionId: string): void {
    this.setActiveTab('materiales' as any);
  }

  goBack(): void {
    this.router.navigate(['/teacher/dashboard']);
  }
}

