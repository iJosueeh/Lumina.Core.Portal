import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white border-b border-slate-200 z-20">
      <div class="max-w-7xl mx-auto px-6 py-8 md:py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="space-y-2">
          @if (badge) {
            <span class="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold uppercase tracking-widest">{{ badge }}</span>
          }
          <h1 class="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {{ title }}@if (titleHighlight) { <span class="text-indigo-600">{{ titleHighlight }}</span> }
          </h1>
          @if (subtitle) {
            <p class="text-slate-500 font-medium max-w-lg">{{ subtitle }}</p>
          }
        </div>
        <ng-content></ng-content>
      </div>
    </header>
  `
})
export class PageHeaderComponent {
  @Input() badge = '';
  @Input() title = '';
  @Input() titleHighlight = '';
  @Input() subtitle = '';
}
