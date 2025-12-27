import { Component, inject, signal } from '@angular/core';
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
        <a routerLink="/" class="bp-navbar-brand">
          <img src="assets/favicon.png" alt="BluePrint Logo" class="bp-navbar-logo" />
          <span>BluePrint</span>
        </a>
        
        <ul class="bp-navbar-nav" *ngIf="authService.isAuthenticated(); else loggedOut">
          <li><a routerLink="/home" routerLinkActive="active" class="bp-nav-link">Dashboard</a></li>
          <li><a routerLink="/projects" routerLinkActive="active" class="bp-nav-link">Meus Projetos</a></li>
          <li><a routerLink="/templates" routerLinkActive="active" class="bp-nav-link">Templates</a></li>
          <li *ngIf="authService.currentUser()?.role === 'ADMIN'" class="dropdown" [class.is-open]="adminMenuOpen()">
            <button class="bp-nav-link dropdown-toggle" (click)="toggleAdminMenu($event)">
              ⚙️ Admin
            </button>
            <ul class="dropdown-menu" [class.show]="adminMenuOpen()">
              <li><a routerLink="/admin/users" (click)="closeAdminMenu()" class="dropdown-item">👥 Usuários</a></li>
              <li><a routerLink="/admin/settings" (click)="closeAdminMenu()" class="dropdown-item">⚙️ Configurações</a></li>
            </ul>
          </li>
          <li><button (click)="logout()" class="bp-btn bp-btn-sm logout-btn">Sair</button></li>
        </ul>
        <ng-template #loggedOut>
          <!-- Navbar vazio quando deslogado - tela inicial já é o login -->
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .bp-navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bp-navbar-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .dropdown {
      position: relative;
    }

    .dropdown-toggle {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
    }

    .arrow {
      font-size: 0.7rem;
      transition: transform 0.2s ease;
      display: inline-block;
    }

    .dropdown.is-open .arrow {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.75rem);
      left: 0;
      background: #f2f2f2;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 0.5rem;
      min-width: 220px;
      list-style: none;
      z-index: 9999;
      margin: 0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
    }

    .dropdown-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-item {
      display: block;
      padding: 0.75rem 1rem;
      color: #374151;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.15s ease;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .dropdown-item:hover {
      background: #F3F4F6;
      color: #6B46C1;
    }

    .dropdown-menu li {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .logout-btn {
      background: white !important;
      color: var(--bp-primary) !important;
      border: 2px solid var(--bp-primary) !important;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: var(--bp-primary) !important;
      color: white !important;
      border-color: var(--bp-primary) !important;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  adminMenuOpen = signal(false);

  toggleAdminMenu(event: Event) {
    event.stopPropagation();
    this.adminMenuOpen.set(!this.adminMenuOpen());
    
    if (this.adminMenuOpen()) {
      // Close menu when clicking outside
      setTimeout(() => {
        document.addEventListener('click', () => this.closeAdminMenu(), { once: true });
      });
    }
  }

  closeAdminMenu() {
    this.adminMenuOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
