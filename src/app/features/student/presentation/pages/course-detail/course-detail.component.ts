import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import {
  CourseDetail,
  Module,
  Lesson,
  CourseMaterial,
  MaterialType,
  Forum,
  ForumPost,
  ForumComment,
  Announcement,
  AnnouncementAttachment,
} from '@features/student/domain/models/course-detail.model';
import { Assignment } from '@features/student/domain/models/assignment.model';

type TabType = 'description' | 'content' | 'materials' | 'forum' | 'announcements' | 'grades';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-detail.component.html',
  styles: ``,
})
export class CourseDetailComponent implements OnInit {
  activeTab: TabType = 'content';
  courseId: string = '';

  tabs = [
    { id: 'description' as TabType, label: 'Descripción', icon: 'document' },
    { id: 'content' as TabType, label: 'Contenido', icon: 'book' },
    { id: 'grades' as TabType, label: 'Calificaciones', icon: 'chart' },
  ];

  course: CourseDetail = {} as CourseDetail;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.params['id'] || '1';
    this.loadCourseData();
  }

  loadCourseData(): void {
    this.http
      .get<CourseDetail[]>('/assets/mock-data/courses/course-details.json')
      .pipe(
        map((courses) => {
          const found = courses.find((c) => c.id === this.courseId);
          if (found) {
            return found;
          }
          console.warn(
            `Course ${this.courseId} not found in mock data. Returning first course as fallback.`,
          );
          return courses[0];
        }),
      )
      .subscribe({
        next: (data) => {
          this.course = data;
          console.log('Course data loaded:', this.course);
        },
        error: (err) => {
          console.error('Error loading course data:', err);
        },
      });
  }

  upcomingAssignments: Assignment[] = [
    {
      id: '1',
      titulo: 'Proyecto: Landing Page',
      cursoNombre: 'Desarrollo Web Full Stack',
      fechaLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      esUrgente: false,
      mes: 'OCT',
      dia: 15,
    },
    {
      id: '2',
      titulo: 'Quiz: Modelo de Caja',
      cursoNombre: 'Desarrollo Web Full Stack',
      fechaLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      esUrgente: false,
      mes: 'OCT',
      dia: 22,
    },
  ];

  // Signals para tab Materiales
  activeFilter = signal<MaterialType | 'all'>('all');
  searchQuery = signal('');

  // Tipos de materiales para filtros
  materialTypes: MaterialType[] = ['video', 'pdf', 'code', 'link', 'document'];

  // Computed: materiales filtrados
  filteredMaterials = computed(() => {
    let materials = this.course.materials;

    // Filtrar por tipo
    if (this.activeFilter() !== 'all') {
      materials = materials.filter((m) => m.type === this.activeFilter());
    }

    // Filtrar por búsqueda
    const query = this.searchQuery().toLowerCase();
    if (query) {
      materials = materials.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.moduleName.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query),
      );
    }

    return materials;
  });

  // Computed: materiales agrupados por módulo
  groupedMaterials = computed(() => {
    const materials = this.filteredMaterials();
    const grouped: { [key: string]: { moduleName: string; materials: CourseMaterial[] } } = {};

    materials.forEach((material) => {
      if (!grouped[material.moduleId]) {
        grouped[material.moduleId] = {
          moduleName: material.moduleName,
          materials: [],
        };
      }
      grouped[material.moduleId].materials.push(material);
    });

    return Object.values(grouped);
  });

  // Signals para tab Foros
  selectedForum = signal<Forum | null>(null);
  selectedPost = signal<ForumPost | null>(null);

  // Computed: posts del foro seleccionado
  postsInSelectedForum = computed(() => {
    const forum = this.selectedForum();
    if (!forum) return [];
    return this.course.forumPosts.filter((p) => p.forumId === forum.id);
  });

  // Computed: comentarios del post seleccionado
  commentsInSelectedPost = computed(() => {
    const post = this.selectedPost();
    if (!post) return [];
    return this.course.forumComments.filter((c) => c.postId === post.id && !c.parentCommentId);
  });

  // ========== ANUNCIOS ==========
  // Signal para búsqueda de anuncios
  announcementSearchQuery = signal('');

  // Signal para filtro de prioridad
  announcementPriorityFilter = signal<'all' | 'high' | 'medium' | 'low'>('all');

  // Computed: anuncios filtrados y ordenados
  filteredAnnouncements = computed(() => {
    let announcements = this.course.announcements;

    // Filtrar por prioridad
    if (this.announcementPriorityFilter() !== 'all') {
      announcements = announcements.filter((a) => a.priority === this.announcementPriorityFilter());
    }

    // Filtrar por búsqueda
    const query = this.announcementSearchQuery().toLowerCase();
    if (query) {
      announcements = announcements.filter(
        (a) => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query),
      );
    }

    // Ordenar: pinned primero, luego por fecha descendente
    return announcements.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  });

  // Computed: próxima lección no completada
  nextLesson = computed(() => {
    for (const module of this.course.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.isCompleted && !lesson.isLocked) {
          return lesson;
        }
      }
    }
    return null;
  });

  setTab(tab: TabType): void {
    this.activeTab = tab;
  }

  expandedModules = new Set<string>();

  toggleModule(module: Module): void {
    module.isExpanded = !module.isExpanded;
    if (module.isExpanded) {
      this.expandedModules.add(module.id);
    } else {
      this.expandedModules.delete(module.id);
    }
  }

  getLessonIcon(type: string): string {
    const icons: Record<string, string> = {
      video: 'play-circle',
      reading: 'document-text',
      quiz: 'clipboard-document-check',
      assignment: 'pencil-square',
    };
    return icons[type] || 'document';
  }

  getTypeIcon(type: string): string {
    return this.getLessonIcon(type);
  }

  startLesson(lesson: Lesson): void {
    if (lesson.isLocked) {
      return;
    }

    // Simular inicio de lección
    const lessonType =
      lesson.type === 'video'
        ? 'video'
        : lesson.type === 'reading'
          ? 'lectura'
          : lesson.type === 'quiz'
            ? 'quiz'
            : 'tarea';

    const message = lesson.isCompleted
      ? `Revisando ${lessonType}: "${lesson.title}"\n\nDuración: ${lesson.duration}\n\nEn una implementación completa, esto abriría el contenido de la lección en un modal o nueva página.`
      : `Iniciando ${lessonType}: "${lesson.title}"\n\nDuración: ${lesson.duration}\n\nEn una implementación completa, esto abriría el contenido de la lección en un modal o nueva página.`;

    alert(message);

    // Marcar como completada si no lo estaba
    if (!lesson.isCompleted) {
      lesson.isCompleted = true;
    }
  }

  continueCurrentLesson(): void {
    const next = this.nextLesson();
    if (next) {
      this.startLesson(next);
    } else {
      alert('¡Felicidades! Has completado todas las lecciones disponibles.');
    }
  }

  // Métodos para tab Materiales
  filterByType(type: MaterialType | 'all'): void {
    this.activeFilter.set(type);
  }

  searchMaterials(query: string): void {
    this.searchQuery.set(query);
  }

  countByType(type: MaterialType): number {
    return this.course.materials.filter((m) => m.type === type).length;
  }

  downloadMaterial(material: CourseMaterial): void {
    console.log('Downloading:', material.title);
    // Simular descarga
    window.open(material.url, '_blank');
  }

  previewMaterial(material: CourseMaterial): void {
    console.log('Previewing:', material.title);
    // Abrir en modal o nueva ventana
    window.open(material.url, '_blank');
  }

  getMaterialIcon(type: MaterialType): string {
    const icons: Record<MaterialType, string> = {
      video:
        'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      pdf: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      document:
        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[type];
  }

  getMaterialColor(type: MaterialType): string {
    const colors: Record<MaterialType, string> = {
      video: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      pdf: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      code: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      link: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
      document: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    };
    return colors[type];
  }

  getMaterialTypeLabel(type: MaterialType): string {
    const labels: Record<MaterialType, string> = {
      video: 'Video',
      pdf: 'PDF',
      code: 'Código',
      link: 'Enlace',
      document: 'Documento',
    };
    return labels[type];
  }

  // Métodos para tab Foros
  selectForum(forum: Forum): void {
    this.selectedForum.set(forum);
    this.selectedPost.set(null);
  }

  selectPost(post: ForumPost): void {
    this.selectedPost.set(post);
  }

  backToForums(): void {
    this.selectedForum.set(null);
    this.selectedPost.set(null);
  }

  backToPosts(): void {
    this.selectedPost.set(null);
  }

  likePost(post: ForumPost): void {
    post.likes++;
  }

  likeComment(comment: ForumComment): void {
    comment.likes++;
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    if (days < 7) return `hace ${days}d`;
    if (weeks < 4) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  searchAnnouncements(query: string): void {
    this.announcementSearchQuery.set(query);
  }
  // Filtrar por prioridad
  filterAnnouncementsByPriority(priority: 'all' | 'high' | 'medium' | 'low'): void {
    this.announcementPriorityFilter.set(priority);
  }
  // Like announcement (toggle)
  likeAnnouncement(announcement: Announcement): void {
    if (announcement.isLiked) {
      announcement.likes--;
      announcement.isLiked = false;
    } else {
      announcement.likes++;
      announcement.isLiked = true;
    }
  }
  // Obtener clase CSS del badge de prioridad
  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    };
    return classes[priority] || '';
  }
  // Obtener label de prioridad
  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      high: 'Alta Prioridad',
      medium: 'Media Prioridad',
      low: 'Baja Prioridad',
    };
    return labels[priority] || '';
  }
  // Obtener icono de adjunto (path SVG)
  getAttachmentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      image:
        'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      document:
        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    };
    return icons[type] || icons['document'];
  }
  // Descargar adjunto
  downloadAttachment(attachment: AnnouncementAttachment): void {
    window.open(attachment.url, '_blank');
  }
  getPromedioColor(promedio: number): string {
    if (promedio >= 17) return 'text-green-600 dark:text-green-400 font-bold';
    if (promedio >= 14) return 'text-blue-600 dark:text-blue-400 font-bold';
    if (promedio >= 11) return 'text-yellow-600 dark:text-yellow-400 font-bold';
    return 'text-red-600 dark:text-red-400 font-bold';
  }
  // Obtener badge de estado
  getEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      Completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pendiente: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return badges[estado] || 'bg-gray-100 text-gray-700';
  }
  // Mostrar nota o "--" si está pendiente
  getNotaDisplay(nota: number, estado: string): string {
    return estado === 'Pendiente' ? '--' : nota.toFixed(1);
  }

  getStatusIcon(estado: string): string {
    const icons: { [key: string]: string } = {
      Completado: 'check-circle',
      Pendiente: 'clock',
    };
    return icons[estado] || 'information-circle';
  }

  hasRelatedMaterials(lesson: Lesson): boolean {
    return this.course.materials?.some((m) => m.lessonId === lesson.id) || false;
  }

  getMaterialsForLesson(lessonId: string): CourseMaterial[] {
    return this.course.materials?.filter((m) => m.lessonId === lessonId) || [];
  }

  getTotalLessons(): number {
    return (
      this.course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
    );
  }
}
