import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white border-b border-slate-200 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div class="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
          @if (badge) {
            <span class="inline-flex items-center px-2.5 sm:px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold uppercase tracking-widest">{{ badge }}</span>
          }
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight break-words">
            {{ title }}@if (titleHighlight) { <span class="text-indigo-600">{{ titleHighlight }}</span> }
          </h1>
          @if (subtitle) {
            <p class="text-xs sm:text-sm text-slate-500 font-medium max-w-lg leading-relaxed">{{ subtitle }}</p>
          }
        </div>
        <div class="w-full md:w-auto flex flex-wrap items-center gap-3">
          <ng-content></ng-content>
        </div>
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
