import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumb-container" *ngIf="breadcrumbs().length > 0">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <a routerLink="/" class="breadcrumb-link">🏠 Início</a>
        </li>
        <li 
          *ngFor="let breadcrumb of breadcrumbs(); let last = last" 
          class="breadcrumb-item"
          [class.active]="last"
        >
          <span class="breadcrumb-separator">/</span>
          <a 
            *ngIf="!last" 
            [routerLink]="breadcrumb.url" 
            class="breadcrumb-link"
          >
            {{ breadcrumb.label }}
          </a>
          <span *ngIf="last" class="breadcrumb-current">
            {{ breadcrumb.label }}
          </span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-container {
      background: #f8f9fa;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .breadcrumb {
      display: flex;
      flex-wrap: wrap;
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
      gap: 0.5rem;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .breadcrumb-separator {
      color: #6b7280;
      user-select: none;
    }

    .breadcrumb-link {
      color: #4f46e5;
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb-link:hover {
      color: #4338ca;
      text-decoration: underline;
    }

    .breadcrumb-current {
      color: #6b7280;
      font-weight: 500;
    }

    .breadcrumb-item.active {
      color: #6b7280;
    }
  `]
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs = signal<Breadcrumb[]>([]);

  // Mapeamento de rotas para labels legíveis
  private routeLabels: { [key: string]: string } = {
    'home': 'Dashboard',
    'projects': 'Projetos',
    'templates': 'Templates',
    'admin': 'Admin',
    'users': 'Usuários',
    'settings': 'Configurações',
    'login': 'Login',
    'manage': 'Gerenciar',
    'create': 'Criar',
    'edit': 'Editar'
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.breadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));
      });

    // Build initial breadcrumbs
    this.breadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeSegments = child.snapshot.url.map(segment => segment.path);
      
      // Process each segment separately
      for (const segment of routeSegments) {
        if (segment !== '') {
          url += `/${segment}`;
          
          // Get label from route data or use default mapping
          const label = child.snapshot.data['breadcrumb'] || this.getLabel(segment);
          
          // Only add if we have a label (IDs return empty string)
          if (label) {
            breadcrumbs.push({
              label,
              url
            });
          }
        }
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private getLabel(segment: string): string {
    // Check if it's a known route
    if (this.routeLabels[segment]) {
      return this.routeLabels[segment];
    }

    // Check if it's an ID (UUID or CUID) - não mostrar no breadcrumb
    const idRegex = /^[a-z0-9]{20,}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (idRegex.test(segment)) {
      return ''; // Retorna vazio para IDs não serem exibidos
    }

    // Capitalize first letter
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }
}
