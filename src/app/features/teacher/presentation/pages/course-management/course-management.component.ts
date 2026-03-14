import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
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
  id?: string;
  esExistente?: boolean;
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
type NotificationType = 'success' | 'error' | 'info';
type AssignMode = 'student' | 'usuario';

interface ProgramacionItem {
  id: string;
  cursoId: string;
  docenteId?: string;
  estado?: string;
}

interface AssignableUser {
  id: string;
  nombreCompleto: string;
  email: string;
  rolNombre: string;
}

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-management.component.html',
  styles: `
    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(-10px) translateX(14px);
      }
      to {
        opacity: 1;
        transform: translateY(0) translateX(0);
      }
    }

    @keyframes toastFadeOut {
      from {
        opacity: 1;
        transform: translateY(0) translateX(0);
      }
      to {
        opacity: 0;
        transform: translateY(-6px) translateX(8px);
      }
    }

    @keyframes toastProgress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    .toast-enter {
      animation: toastSlideIn 220ms ease-out;
    }

    .toast-leave {
      animation: toastFadeOut 170ms ease-in;
    }

    .toast-progress {
      animation-name: toastProgress;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }
  `,
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  courseId = signal<string>('');
  course = signal<TeacherCourseDetail | null>(null);
  students = signal<CourseStudent[]>([]);
  allTeacherStudents = signal<TeacherStudent[]>([]);
  modulos = signal<Modulo[]>([]);
  expandedModules = signal<Set<string>>(new Set());
  isLoading = signal(true);
  activeTab = signal<TabType>('overview');
  showAssignStudentModal = signal(false);
  assignMode = signal<AssignMode>('student');
  selectedStudentId = signal('');
  selectedUserId = signal('');
  userSearchTerm = signal('');
  assignableUsers = signal<AssignableUser[]>([]);
  loadingAssignableUsers = signal(false);
  canLoadAssignableUsers = signal(true);
  usuarioIdToAssign = signal('');
  isAssigningStudent = signal(false);

  // Computed values
  totalStudents = computed(() => this.course()?.totalAlumnos || 0);
  averageGrade = computed(() => this.course()?.promedioGeneral || 0);
  pendingEvaluations = computed(
    () => this.course()?.evaluaciones.filter((e) => e.estado === 'En Calificación').length || 0,
  );
  totalLecciones = computed(() => {
    return this.modulos().reduce((acc, m) => acc + m.lecciones.length, 0);
  });
  assignableStudents = computed(() => {
    const enrolled = new Set(this.students().map((s) => s.id.toLowerCase()));
    return this.allTeacherStudents().filter((s) => !enrolled.has(s.id.toLowerCase()));
  });
  filteredAssignableUsers = computed(() => {
    const term = this.userSearchTerm().trim().toLowerCase();
    const users = this.assignableUsers();

    if (!term) {
      return users;
    }

    return users.filter((u) => {
      const content = `${u.nombreCompleto} ${u.email}`.toLowerCase();
      return content.includes(term);
    });
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
  loadingQuestions = signal(false);
  questionsList: QuestionDraft[] = [];
  notification = signal<{ type: NotificationType; message: string } | null>(null);
  notificationClosing = signal(false);
  notificationDuration = signal(3500);
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const courseId = params['id'];
      this.courseId.set(courseId);
      console.log('🔍 [COURSE-MANAGEMENT] Received courseId from route:', courseId);
      this.loadCourseData();
    });
  }

  ngOnDestroy(): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
  }

  showNotification(type: NotificationType, message: string, duration = 3500): void {
    this.notificationClosing.set(false);
    this.notificationDuration.set(duration);
    this.notification.set({ type, message });

    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }

    this.notificationTimer = setTimeout(() => {
      this.closeNotification();
    }, duration);
  }

  closeNotification(): void {
    if (!this.notification() || this.notificationClosing()) {
      return;
    }

    this.notificationClosing.set(true);

    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }

    setTimeout(() => {
      this.notification.set(null);
      this.notificationClosing.set(false);
    }, 170);
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
        this.allTeacherStudents.set(allStudents);

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
      this.showNotification('success', 'Evaluación creada. Ahora puedes gestionar sus preguntas.');
      this.showCreateQuizzModal.set(false);
      await this.loadEvaluaciones();
      if (newId) {
        this.openQuestionEditor(String(newId), this.quizzForm.titulo);
      }
    } catch (err) {
      console.error('❌ [COURSE-MGMT] Error creando quizz:', err);
      this.showNotification('error', 'No se pudo crear la evaluación quizz.');
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
    this.questionsList = [];
    this.showQuestionEditor.set(true);
    this.loadExistingQuestions(evaluacionId);
  }

  private async loadExistingQuestions(evaluacionId: string): Promise<void> {
    this.loadingQuestions.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`)
      );

      const preguntas = response?.preguntas ?? response?.Preguntas ?? [];
      if (!Array.isArray(preguntas) || preguntas.length === 0) {
        this.questionsList = [this.createEmptyQuestion()];
        return;
      }

      this.questionsList = preguntas.map((p: any) => ({
        id: p.id ?? p.Id,
        esExistente: true,
        texto: p.texto ?? p.Texto ?? p.enunciado ?? p.Enunciado ?? '',
        puntos: Number(p.puntos ?? p.Puntos ?? p.puntaje ?? p.Puntaje ?? 10),
        explicacion: p.explicacion ?? p.Explicacion ?? '',
        opciones: (p.opciones ?? p.Opciones ?? []).map((o: any) => ({
          texto: o.texto ?? o.Texto ?? o.contenido ?? o.Contenido ?? '',
          esCorrecta: Boolean(o.esCorrecta ?? o.EsCorrecta ?? o.correcta ?? o.Correcta ?? false),
        })),
      }));
    } catch (err) {
      console.error('❌ [COURSE-MGMT] Error cargando preguntas existentes:', err);
      this.showNotification('error', 'No se pudieron cargar las preguntas de esta evaluación.');
      this.questionsList = [this.createEmptyQuestion()];
    } finally {
      this.loadingQuestions.set(false);
    }
  }

  private createEmptyQuestion(): QuestionDraft {
    return {
      esExistente: false,
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

  async removeQuestion(idx: number): Promise<void> {
    const question = this.questionsList[idx];
    if (!question) return;

    const evaluacionId = this.editingQuizzId();

    if (question.esExistente && question.id) {
      try {
        await firstValueFrom(
          this.http.delete(
            `${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas/${question.id}`
          )
        );
        console.log('✅ [COURSE-MGMT] Pregunta existente eliminada:', question.id);
        this.showNotification('success', 'Pregunta eliminada correctamente.');
      } catch (err) {
        console.error('❌ [COURSE-MGMT] Error eliminando pregunta existente:', err);
        this.showNotification('error', 'No se pudo eliminar la pregunta seleccionada.');
        return;
      }
    }

    this.questionsList = this.questionsList.filter((_, i) => i !== idx);

    if (this.questionsList.length === 0) {
      this.questionsList = [this.createEmptyQuestion()];
    }
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
    const existingQuestions = this.questionsList.filter(
      (q) => q.esExistente && q.id,
    ) as Array<QuestionDraft & { id: string }>;
    const newQuestionsWithOrder = this.questionsList
      .map((q, idx) => ({ q, orden: idx + 1 }))
      .filter(({ q }) => !q.esExistente);

    if (existingQuestions.length === 0 && newQuestionsWithOrder.length === 0) {
      this.showQuestionEditor.set(false);
      this.showNotification('info', 'No hay cambios para guardar.');
      return;
    }

    this.savingQuestions.set(true);
    try {
      for (const q of existingQuestions) {
        const updateBody = {
          texto: q.texto,
          puntos: q.puntos,
          respuestaCorrecta: null,
          explicacion: q.explicacion || null,
          imagenUrl: null,
          opciones: q.opciones.map((o, oIdx) => ({
            texto: o.texto,
            esCorrecta: o.esCorrecta,
            orden: oIdx + 1,
          })),
        };

        await firstValueFrom(
          this.http.put<any>(
            `${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas/${q.id}`,
            updateBody,
          ),
        );
      }

      for (const { q, orden } of newQuestionsWithOrder) {
        const createBody = {
          evaluacionId,
          tipoPregunta: 1, // OpcionMultiple
          texto: q.texto,
          puntos: q.puntos,
          orden,
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
            createBody
          )
        );
      }

      console.log(
        `✅ [COURSE-MGMT] Preguntas actualizadas: ${existingQuestions.length}, nuevas: ${newQuestionsWithOrder.length}`,
      );
      this.showNotification('success', 'Preguntas guardadas correctamente.');
      this.showQuestionEditor.set(false);
      await this.loadEvaluaciones();
    } catch (err) {
      console.error('❌ [COURSE-MGMT] Error guardando preguntas:', err);
      this.showNotification('error', 'Ocurrió un error al guardar las preguntas.');
    } finally {
      this.savingQuestions.set(false);
    }
  }

  openAssignStudentModal(): void {
    this.assignMode.set('student');
    this.selectedUserId.set('');
    this.userSearchTerm.set('');
    this.usuarioIdToAssign.set('');
    this.selectedStudentId.set(this.assignableStudents()[0]?.id ?? '');
    this.loadAssignableUsers();
    this.showAssignStudentModal.set(true);
  }

  closeAssignStudentModal(): void {
    this.showAssignStudentModal.set(false);
    this.isAssigningStudent.set(false);
  }

  async submitAssignStudent(): Promise<void> {
    if (this.isAssigningStudent()) {
      return;
    }

    this.isAssigningStudent.set(true);

    try {
      const programacionId = await this.resolveProgramacionIdForCurrentCourse();

      if (!programacionId) {
        this.showNotification('error', 'No se encontró una programación activa para este curso.');
        return;
      }

      const estudianteId = await this.resolveEstudianteIdToAssign();
      if (!estudianteId) {
        this.showNotification('error', 'No se pudo resolver el estudiante a matricular.');
        return;
      }

      await firstValueFrom(
        this.http.post<any>(`${environment.estudiantesApiUrl}/matricula`, {
          estudianteId,
          programacionId,
        }),
      );

      this.showNotification('success', 'Estudiante asignado al curso correctamente.');
      this.closeAssignStudentModal();
      this.loadCourseData();
    } catch (err) {
      console.error('❌ [COURSE-MGMT] Error asignando estudiante:', err);
      this.showNotification('error', this.extractApiErrorMessage(err, 'No se pudo asignar el estudiante al curso.'));
    } finally {
      this.isAssigningStudent.set(false);
    }
  }

  private async resolveProgramacionIdForCurrentCourse(): Promise<string | null> {
    const usuarioId = this.authService.getUserId();
    if (!usuarioId) {
      return null;
    }

    const teacherInfo = await this.teacherQuery.getTeacherInfo(usuarioId);
    const programacionesResponse = await firstValueFrom(
      this.http.get<any>(`${environment.estudiantesApiUrl}/programaciones?docenteId=${teacherInfo.id}`),
    );

    const collection = Array.isArray(programacionesResponse)
      ? programacionesResponse
      : Array.isArray(programacionesResponse?.value)
        ? programacionesResponse.value
        : [];

    const programaciones: ProgramacionItem[] = collection
      .map((p: any) => ({
        id: this.extractGuidLikeValue(p?.id),
        cursoId: this.extractGuidLikeValue(p?.cursoId),
        docenteId: this.extractGuidLikeValue(p?.docenteId),
        estado: String(p?.estado ?? ''),
      }))
      .filter((p: ProgramacionItem) => Boolean(p.id) && Boolean(p.cursoId));

    const normalizedCourseId = this.normalizeGuid(this.courseId());
    const found = programaciones.find((p) => this.normalizeGuid(p.cursoId) === normalizedCourseId);

    return found?.id ?? null;
  }

  private async resolveEstudianteIdToAssign(): Promise<string | null> {
    if (this.assignMode() === 'student') {
      const selected = this.selectedStudentId();
      return selected || null;
    }

    const selectedUserId = this.selectedUserId().trim();
    const usuarioId = (selectedUserId || this.usuarioIdToAssign()).trim();
    if (!this.isGuid(usuarioId)) {
      throw new Error('Ingresa un UsuarioId válido (GUID).');
    }

    const existingStudent = this.allTeacherStudents().find(
      (s) => this.normalizeGuid(s.usuarioId) === this.normalizeGuid(usuarioId),
    );
    if (existingStudent?.id) {
      return existingStudent.id;
    }

    // Si no existe perfil de estudiante, intentamos crearlo desde el usuarioId.
    const createdResponse = await firstValueFrom(
      this.http.post<any>(`${environment.estudiantesApiUrl}/estudiantes`, {
        usuarioId,
      }),
    );

    const createdId = this.extractGuidLikeValue(createdResponse?.id ?? createdResponse);
    return createdId || null;
  }

  private loadAssignableUsers(): void {
    this.loadingAssignableUsers.set(true);

    firstValueFrom(this.http.get<any>(`${environment.usuariosApiUrl}/usuarios`))
      .then((response) => {
        const rawUsers = Array.isArray(response)
          ? response
          : Array.isArray(response?.value)
            ? response.value
            : [];

        const enrolledUsuarioIds = new Set(
          this.allTeacherStudents()
            .filter((s) => s.cursos.includes(this.courseId()))
            .map((s) => this.normalizeGuid(s.usuarioId)),
        );

        const users = rawUsers
          .map((u: any) => {
            const id = this.extractGuidLikeValue(u?.id ?? u?.Id);
            const nombres = String(u?.nombresPersona ?? u?.NombresPersona ?? '').trim();
            const apellidoPaterno = String(u?.apellidoPaterno ?? u?.ApellidoPaterno ?? '').trim();
            const apellidoMaterno = String(u?.apellidoMaterno ?? u?.ApellidoMaterno ?? '').trim();
            const rolNombre = String(u?.rolNombre ?? u?.RolNombre ?? '').trim();
            const email = String(u?.email ?? u?.Email ?? u?.correoElectronico ?? '').trim();

            return {
              id,
              nombreCompleto: [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim(),
              email,
              rolNombre,
            } as AssignableUser;
          })
          .filter((u: AssignableUser) => {
            if (!u.id || !u.email) return false;
            if (this.normalizeGuid(u.id) === this.normalizeGuid(this.authService.getUserId() || '')) return false;
            if (enrolledUsuarioIds.has(this.normalizeGuid(u.id))) return false;
            return u.rolNombre.toLowerCase() === 'student';
          })
          .sort((a: AssignableUser, b: AssignableUser) =>
            `${a.nombreCompleto} ${a.email}`.localeCompare(`${b.nombreCompleto} ${b.email}`, 'es', {
              sensitivity: 'base',
            }),
          );

        this.assignableUsers.set(users);
        this.selectedUserId.set(users[0]?.id ?? '');
        this.canLoadAssignableUsers.set(true);
      })
      .catch((error) => {
        console.warn('⚠️ [COURSE-MGMT] No se pudo cargar usuarios para combobox:', error);
        this.assignableUsers.set([]);
        this.selectedUserId.set('');
        this.canLoadAssignableUsers.set(false);
      })
      .finally(() => {
        this.loadingAssignableUsers.set(false);
      });
  }

  private extractGuidLikeValue(value: any): string {
    if (!value) return '';

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value?.value === 'string') {
      return value.value;
    }

    if (typeof value?.id === 'string') {
      return value.id;
    }

    if (typeof value?.id?.value === 'string') {
      return value.id.value;
    }

    return '';
  }

  private normalizeGuid(value: string): string {
    return String(value || '').trim().toLowerCase();
  }

  private isGuid(value: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(String(value || '').trim());
  }

  private extractApiErrorMessage(error: any, fallback: string): string {
    const payload = error?.error;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload?.description) {
      return payload.description;
    }

    if (payload?.message) {
      return payload.message;
    }

    if (payload?.error?.description) {
      return payload.error.description;
    }

    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      return String(payload.errors[0]);
    }

    if (payload?.errors && typeof payload.errors === 'object') {
      const firstKey = Object.keys(payload.errors)[0];
      const firstError = firstKey ? payload.errors[firstKey] : null;
      if (Array.isArray(firstError) && firstError.length > 0) {
        return String(firstError[0]);
      }
      if (typeof firstError === 'string' && firstError.trim()) {
        return firstError;
      }
    }

    return fallback;
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

