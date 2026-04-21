import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ModalContainerComponent } from '../../../../../../../shared/components/ui/modal-container/modal-container.component';
import { FormFieldComponent } from '../../../../../../../shared/components/ui/form-field/form-field.component';
import { InputComponent } from '../../../../../../../shared/components/ui/input/input.component';
import { ButtonComponent } from '../../../../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-evaluation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalContainerComponent, FormFieldComponent, InputComponent, ButtonComponent],
  templateUrl: './evaluation-modal.component.html',
  styleUrl: './evaluation-modal.component.css'
})
export class EvaluationModalComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() isEdit = false;
  @Input() isSaving = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
}
