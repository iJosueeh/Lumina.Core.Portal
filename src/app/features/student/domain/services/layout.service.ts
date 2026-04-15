import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

/**
 * Service to manage layout visibility state across the student portal.
 * Controls sidebar visibility for different page contexts.
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  /**
   * Signal to control sidebar visibility.
   * Set to true to hide the sidebar, false to show it.
   */
  readonly isSidebarHidden = signal(false);

  constructor() {}

  /**
   * Hide the sidebar (typically when entering full-screen experiences like video classroom)
   */
  hideSidebar(): void {
    this.isSidebarHidden.set(true);
  }

  /**
   * Show the sidebar (restore default navigation)
   */
  showSidebar(): void {
    this.isSidebarHidden.set(false);
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(): void {
    this.isSidebarHidden.set(!this.isSidebarHidden());
  }
}
