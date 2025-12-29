import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TemplatesService, Template } from '../../services/templates.service';
import { AuthService } from '../../services/auth.service';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './templates.component.html',
})
export class TemplatesComponent implements OnInit {
  private templatesService = inject(TemplatesService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  templates = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadTemplates();
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ADMIN';
  }

  loadTemplates() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/templates`).subscribe({
      next: (data) => {
        const filtered = this.isAdmin() ? data : data.filter(t => t.isActive);
        this.templates.set(filtered);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load templates:', err);
        this.loading.set(false);
      },
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
