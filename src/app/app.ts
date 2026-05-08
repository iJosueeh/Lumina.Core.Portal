import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from '@shared/components/ui/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('lumina-core-portal');
}
