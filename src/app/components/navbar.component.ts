import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bp-navbar">
      <div class="bp-navbar-content">
        <a routerLink="/" class="bp-navbar-brand">BluePrint</a>
        
        <ul class="bp-navbar-nav" *ngIf="authService.isAuthenticated(); else loggedOut">
          <li><a routerLink="/home" routerLinkActive="active" class="bp-nav-link">Dashboard</a></li>
          <li><a routerLink="/projects" routerLinkActive="active" class="bp-nav-link">Meus Projetos</a></li>
          <li><a routerLink="/templates" routerLinkActive="active" class="bp-nav-link">Templates</a></li>
          <li *ngIf="authService.currentUser()?.role === 'ADMIN'">
            <a routerLink="/admin/templates" routerLinkActive="active" class="bp-nav-link">Gerenciar Templates</a>
          </li>
          <li><button (click)="logout()" class="bp-btn bp-btn-sm bp-btn-secondary">Sair</button></li>
        </ul>
        <ng-template #loggedOut>
          <ul class="bp-navbar-nav">
            <li><a routerLink="/login" class="bp-nav-link">Login</a></li>
          </ul>
        </ng-template>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
