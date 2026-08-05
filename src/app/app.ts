import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from '@shared/components/ui/notification-toast/notification-toast.component';
import { ThemeService } from '@core/services/theme.service';
import { SiteConfigService } from '@core/services/site-config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('lumina-core-portal');

  constructor() {
    // Inject services to ensure they initialize on app startup
    inject(ThemeService);
    inject(SiteConfigService);
  }
}
