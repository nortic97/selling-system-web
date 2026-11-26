import { Component, input, signal } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-b2b-shell',
  imports: [Navbar, Sidebar],
  templateUrl: './b2b-shell.html',
  styleUrl: './b2b-shell.scss'
})
export class B2bShell {
  readonly variant = input<'owner' | 'employee'>('owner');
  readonly pageTitle = input<string>('Dashboard');
  readonly pageSubtitle = input<string>('');

  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
