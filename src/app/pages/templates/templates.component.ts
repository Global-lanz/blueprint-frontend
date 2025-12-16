import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TemplatesService, Template } from '../../services/templates.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <div class="bp-mb-2xl">
          <h1>Biblioteca de Templates</h1>
          <p class="bp-text-muted">Escolha um template de projeto para iniciar seu trabalho</p>
        </div>

        <div class="bp-loading" *ngIf="loading()">
          <div class="bp-spinner"></div>
        </div>
        
        <div class="bp-card bp-text-center" *ngIf="!loading() && templates().length === 0">
          <div style="padding: 4rem 2rem;">
            <p style="font-size: 4rem; margin-bottom: 1rem;">📚</p>
            <h3>Nenhum template disponível</h3>
            <p class="bp-text-muted">Verifique novamente mais tarde ou entre em contato com o suporte</p>
          </div>
        </div>
        
        <div class="bp-grid bp-grid-3" *ngIf="!loading() && templates().length > 0">
          <div class="bp-card" *ngFor="let template of templates()">
            <div class="bp-card-header">
              <div class="bp-flex bp-justify-between bp-items-start">
                <h3 style="margin: 0; font-size: 1.25rem;">` + '{{ template.name }}' + `</h3>
                <span class="bp-badge bp-badge-primary">v` + '{{ template.version }}' + `</span>
              </div>
            </div>
            <div class="bp-card-body">
              <p class="bp-text-muted">` + '{{ template.description }}' + `</p>
              <div class="bp-flex bp-gap-sm bp-mb-md">
                <span class="bp-badge bp-badge-success" *ngIf="template.isActive">Ativo</span>
                <span class="bp-badge bp-badge-warning" *ngIf="!template.isActive">Inativo</span>
              </div>
              <p class="bp-text-muted" style="font-size: 0.875rem;">
                Atualizado: ` + '{{ formatDate(template.updatedAt) }}' + `
              </p>
            </div>
            <div class="bp-card-footer">
              <button 
                [routerLink]="['/templates', template.id]"
                class="bp-btn bp-btn-sm bp-btn-secondary"
              >
                Ver Detalhes
              </button>
              <button 
                [routerLink]="['/projects/create', template.id]"
                class="bp-btn bp-btn-sm bp-btn-primary"
                *ngIf="template.isActive"
              >
                ✨ Usar Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TemplatesComponent implements OnInit {
  private templatesService = inject(TemplatesService);
  private authService = inject(AuthService);

  templates = signal<Template[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadTemplates();
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ADMIN';
  }

  loadTemplates() {
    this.templatesService.getAll().subscribe({
      next: (data) => {
        // Filtrar apenas templates ativos para clientes
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
