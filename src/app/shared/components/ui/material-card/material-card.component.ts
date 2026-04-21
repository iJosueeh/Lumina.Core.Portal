import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileTypeIconComponent } from '../file-type-icon/file-type-icon.component';
import { ButtonComponent } from '../button/button.component';
import { Material } from '../../../../features/teacher/presentation/pages/materials-management/materials-management.component';

@Component({
  selector: 'app-material-card',
  standalone: true,
  imports: [CommonModule, FileTypeIconComponent, ButtonComponent],
  templateUrl: './material-card.component.html',
  styleUrl: './material-card.component.css'
})
export class MaterialCardComponent {
  @Input({ required: true }) material!: Material;
  @Output() edit = new EventEmitter<Material>();
  @Output() delete = new EventEmitter<string>();
}
