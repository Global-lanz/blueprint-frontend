import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TemplatesService, Template } from '../../services/templates.service';
import { AuthService } from '../../services/auth.service';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { HtmlRendererComponent } from '../../components/html-renderer.component';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BreadcrumbComponent, HtmlRendererComponent],
  templateUrl: './templates.component.html',
})
export class TemplatesComponent implements OnInit {
  private templatesService = inject(TemplatesService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  templates = signal<any[]>([]);
  loading = signal(true);
  showInactive = signal(false); // Filtro padrão: apenas ativos

  ngOnInit() {
    this.loadTemplates();
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ADMIN';
  }

  loadTemplates() {
    this.loading.set(true);
    const includeInactive = this.isAdmin() && this.showInactive();
    const url = `${environment.apiUrl}/templates${includeInactive ? '?includeInactive=true' : ''}`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.templates.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load templates:', err);
        this.loading.set(false);
      },
    });
  }

  toggleFilter() {
    this.showInactive.set(!this.showInactive());
    this.loadTemplates();
  }

  clearFilters() {
    this.showInactive.set(false);
    this.loadTemplates();
  }

  toggleTemplateActive(template: any, event: Event) {
    event.stopPropagation();
    this.http.patch(`${environment.apiUrl}/templates/${template.id}/toggle-active`, {}).subscribe({
      next: () => {
        this.loadTemplates();
      },
      error: (err) => {
        console.error('Failed to toggle template status:', err);
      }
    });
  }

  createNewTemplate() {
    this.router.navigate(['/admin/templates/create']);
  }

  viewTemplate(id: string) {
    this.router.navigate(['/templates', id]);
  }

  editTemplate(id: string) {
    this.router.navigate(['/admin/templates/edit', id]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
