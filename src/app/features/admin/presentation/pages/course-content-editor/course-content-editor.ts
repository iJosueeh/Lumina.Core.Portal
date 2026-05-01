import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

// Services & Infrastructure
import { AdminCourseService } from '@features/admin/infrastructure/services/admin-course.service';

// Shared Components
import { ClassroomPlayerComponent } from '@shared/components/features/classroom/classroom-player/classroom-player.component';
import { ClassroomPlaylistComponent, ClassroomLesson } from '@shared/components/features/classroom/classroom-playlist/classroom-playlist.component';
import { ClassroomHeaderComponent } from '@shared/components/features/classroom/classroom-header/classroom-header.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-course-content-editor',
  standalone: true,
  imports: [
    ClassroomPlayerComponent,
    ClassroomPlaylistComponent,
    ClassroomHeaderComponent,
    SkeletonLoaderComponent,
    ButtonComponent
  ],
  templateUrl: './course-content-editor.html',
  styles: [`
    :host { display: block; background-color: #020617; min-height: 100vh; }
  `]
})
export class CourseContentEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminCourseService);

  courseId = signal('');
  selectedLessonId = signal<string | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isUploading = signal(false);
  
  classroomData = signal<any>(null);
  
  sections = computed(() => this.classroomData()?.sections || []);
  allLessons = computed(() => this.sections().flatMap((s: any) => s.videos));
  
  activeLesson = computed(() => {
    const all = this.allLessons();
    const selected = this.selectedLessonId();
    return all.find((v: any) => v.lessonId === selected) || all[0] || null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadClassroomData();
    }
  }

  async loadClassroomData() {
    this.isLoading.set(true);
    try {
      const data = await lastValueFrom(this.adminService.getAdminClassroom(this.courseId()));
      this.classroomData.set(data);
    } catch (error) {
      console.error('Error loading classroom data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  handleSaveAll(): void {
    this.isSaving.set(true);
    this.adminService.saveClassroom(this.courseId(), this.sections()).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert('✅ ¡Todos los cambios han sido guardados en MongoDB!');
      },
      error: () => {
        this.isSaving.set(false);
        alert('❌ Error al guardar los cambios.');
      }
    });
  }

  handleEditVideo(): void {
    const lesson = this.activeLesson();
    if (!lesson) return;
    const newUrl = prompt('Ingresa la nueva URL del video (YouTube o MinIO):', lesson.videoUrl);
    if (newUrl !== null) {
        this.updateLessonData(lesson.lessonId, { videoUrl: newUrl });
    }
  }

  handleUploadVideo(file: File): void {
    const lesson = this.activeLesson();
    if (!lesson) return;

    this.isUploading.set(true);
    this.adminService.uploadVideo(file).subscribe({
      next: (url) => {
        this.updateLessonData(lesson.lessonId, { videoUrl: url });
        this.isUploading.set(false);
        alert('¡Video subido con éxito a MinIO!');
      },
      error: () => {
        this.isUploading.set(false);
        alert('Fallo al subir video.');
      }
    });
  }

  handleEditLesson(lesson: any): void {
    const newTitle = prompt('Nuevo título de la lección:', lesson.title);
    if (newTitle) {
        this.updateLessonData(lesson.lessonId, { title: newTitle });
    }
  }

  handleInputTitle(event: any): void {
    const lesson = this.activeLesson();
    if (lesson) {
      this.updateLessonData(lesson.lessonId, { title: event.target.value });
    }
  }

  handleInputUrl(event: any): void {
    const lesson = this.activeLesson();
    if (lesson) {
      this.updateLessonData(lesson.lessonId, { videoUrl: event.target.value });
    }
  }

  handleAddLesson(sectionTitle: string): void {
    alert(`Añadiendo nueva lección a la sección: ${sectionTitle}`);
  }

  private updateLessonData(lessonId: string, changes: Partial<ClassroomLesson>): void {
    const current = this.classroomData();
    if (!current) return;
    const updated = {
      ...current,
      sections: current.sections.map((s: any) => ({
        ...s,
        videos: s.videos.map((v: any) => v.lessonId === lessonId ? { ...v, ...changes } : v)
      }))
    };
    this.classroomData.set(updated);
  }

  goBack(): void { this.router.navigate(['/admin/courses']); }
}
