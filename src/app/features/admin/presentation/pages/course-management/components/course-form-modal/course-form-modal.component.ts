import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';

import { ModalContainerComponent } from '../../../../../../../shared/components/ui/modal-container/modal-container.component';
import { FormFieldComponent } from '../../../../../../../shared/components/ui/form-field/form-field.component';
import { InputComponent } from '../../../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../../../shared/components/ui/select/select.component';
import { ButtonComponent } from '../../../../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-admin-course-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalContainerComponent, FormFieldComponent, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './course-form-modal.component.html',
  styleUrl: './course-form-modal.component.css'
})
export class CourseFormModalComponent {
  @Input({ required: true }) course!: AdminCourse;
  @Input() docentes: AdminDocente[] = [];
  @Input() isEditing = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<AdminCourse>();

  activeTab = 'general';
  tabs = [
    { id: 'general', label: 'Información General' },
    { id: 'modules', label: 'Contenido / Módulos' }
  ];

  statuses: ('PUBLISHED' | 'DRAFT' | 'ARCHIVED')[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

  setStatus(st: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'): void {
    this.course.status = st;
  }

  addModule(): void {
    const newModule = { titulo: '', orden: this.course.modules.length + 1 };
    this.course.modules = [...this.course.modules, newModule];
  }

  removeModule(idx: number): void {
    this.course.modules = this.course.modules.filter((_, i) => i !== idx);
  }
}
