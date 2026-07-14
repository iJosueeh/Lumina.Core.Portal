import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-grades-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grades-table.component.html',
  styleUrl: './grades-table.component.css'
})
export class GradesTableComponent {
  @Input({ required: true }) evaluaciones: any[] = [];
  @Input({ required: true }) calificaciones: any[] = [];
  @Input() isLoading = false;

  @Output() editEvaluation = new EventEmitter<any>();
  @Output() addEvaluation = new EventEmitter<void>();
}
