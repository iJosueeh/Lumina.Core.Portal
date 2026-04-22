import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabOption {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-tab-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-nav.component.html',
  styleUrl: './tab-nav.component.css'
})
export class TabNavComponent {
  tabs = input.required<TabOption[]>();
  activeTabId = input.required<string>();
  variant = input<'default' | 'ghost' | 'pills'>('default');
  
  onTabChange = output<string>();

  selectTab(id: string): void {
    if (this.activeTabId() !== id) {
      this.onTabChange.emit(id);
    }
  }
}
