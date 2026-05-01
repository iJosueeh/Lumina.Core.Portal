import { Component, EventEmitter, Input, OnInit, Output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth.service';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { NotificationService } from '@shared/services/notification.service';
import { AssignableUser, AssignMode } from '@shared/models/course-management.models';
import { TeacherStudent } from '@features/teacher/domain/models/teacher-student.model';

@Component({
  selector: 'app-assign-student-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-student-modal.component.html',
  styleUrl: './assign-student-modal.component.css'
})
export class AssignStudentModalComponent implements OnInit {
  @Input({ required: true }) courseId!: string;
  @Input({ required: true }) currentStudents: any[] = [];
  @Input({ required: true }) allTeacherStudents: TeacherStudent[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onAssigned = new EventEmitter<void>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private teacherQuery = inject(TeacherQueryService);
  private notificationService = inject(NotificationService);

  assignMode = signal<AssignMode>('student');
  selectedStudentId = '';
  selectedUserId = signal('');
  userSearchTerm = '';
  usuarioIdToAssign = '';
  isAssigning = signal(false);
  loadingAssignableUsers = signal(false);
  assignableUsers = signal<AssignableUser[]>([]);

  assignableStudents = computed(() => {
    const enrolled = new Set(this.currentStudents.map(s => s.id.toLowerCase()));
    return this.allTeacherStudents.filter(s => !enrolled.has(s.id.toLowerCase()));
  });

  filteredAssignableUsers = computed(() => {
    const term = this.userSearchTerm.trim().toLowerCase();
    const users = this.assignableUsers();
    if (!term) return users;
    return users.filter(u => {
      const content = `${u.nombreCompleto} ${u.email}`.toLowerCase();
      return content.includes(term);
    });
  });

  ngOnInit(): void {
    if (this.assignableStudents().length > 0) {
      this.selectedStudentId = this.assignableStudents()[0].id;
    }
    this.loadAssignableUsers();
  }

  canSubmit(): boolean {
    if (this.assignMode() === 'student') return !!this.selectedStudentId;
    return !!this.selectedUserId() || !!this.usuarioIdToAssign;
  }

  private loadAssignableUsers(): void {
    this.loadingAssignableUsers.set(true);
    firstValueFrom(this.http.get<any>(`${environment.usuariosApiUrl}/usuarios`))
      .then(response => {
        const rawUsers = Array.isArray(response) ? response : Array.isArray(response?.value) ? response.value : [];
        const enrolledUsuarioIds = new Set(
          this.allTeacherStudents.filter(s => s.cursos.includes(this.courseId)).map(s => this.normalizeGuid(s.usuarioId))
        );

        const users = rawUsers
          .map((u: any) => ({
            id: this.extractGuidLikeValue(u?.id ?? u?.Id),
            nombreCompleto: [u?.nombresPersona, u?.apellidoPaterno, u?.apellidoMaterno].filter(Boolean).join(' ').trim(),
            email: String(u?.email ?? u?.Email ?? u?.correoElectronico ?? '').trim(),
            rolNombre: String(u?.rolNombre ?? u?.RolNombre ?? '').trim(),
          }))
          .filter((u: any) => {
            if (!u.id || !u.email) return false;
            if (this.normalizeGuid(u.id) === this.normalizeGuid(this.authService.getUserId() || '')) return false;
            if (enrolledUsuarioIds.has(this.normalizeGuid(u.id))) return false;
            return u.rolNombre.toLowerCase() === 'student';
          });

        this.assignableUsers.set(users);
        if (users.length > 0) this.selectedUserId.set(users[0].id);
      })
      .catch(() => this.assignableUsers.set([]))
      .finally(() => this.loadingAssignableUsers.set(false));
  }

  async submitAssign(): Promise<void> {
    this.isAssigning.set(true);
    try {
      const programacionId = await this.resolveProgramacionId();
      if (!programacionId) throw new Error('No se encontró programación activa.');

      const estudianteId = await this.resolveEstudianteId();
      if (!estudianteId) throw new Error('No se pudo resolver el estudiante.');

      await firstValueFrom(this.http.post(`${environment.estudiantesApiUrl}/matricula`, { estudianteId, programacionId }));
      this.notificationService.show('success', 'Estudiante asignado correctamente.');
      this.onAssigned.emit();
      this.onClose.emit();
    } catch (err: any) {
      this.notificationService.show('error', err.message || 'Error al asignar estudiante.');
    } finally {
      this.isAssigning.set(false);
    }
  }

  private async resolveProgramacionId(): Promise<string | null> {
    const usuarioId = this.authService.getUserId();
    if (!usuarioId) return null;
    const teacherInfo = await this.teacherQuery.getTeacherInfo(usuarioId);
    const resp = await firstValueFrom(this.http.get<any>(`${environment.estudiantesApiUrl}/programaciones?docenteId=${teacherInfo.id}`));
    const collection = Array.isArray(resp) ? resp : Array.isArray(resp?.value) ? resp.value : [];
    const found = collection.find((p: any) => this.normalizeGuid(p?.cursoId) === this.normalizeGuid(this.courseId));
    return found?.id || null;
  }

  private async resolveEstudianteId(): Promise<string | null> {
    if (this.assignMode() === 'student') return this.selectedStudentId;
    const userId = (this.selectedUserId() || this.usuarioIdToAssign).trim();
    const existing = this.allTeacherStudents.find(s => this.normalizeGuid(s.usuarioId) === this.normalizeGuid(userId));
    if (existing) return existing.id;
    const created = await firstValueFrom(this.http.post<any>(`${environment.estudiantesApiUrl}/estudiantes`, { usuarioId: userId }));
    return this.extractGuidLikeValue(created?.id ?? created);
  }

  private normalizeGuid(v: string) { return String(v || '').trim().toLowerCase(); }
  private extractGuidLikeValue(v: any) { return v?.value || v?.id || v || ''; }
}
