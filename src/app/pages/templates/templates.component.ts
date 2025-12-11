import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TemplatesService, Template } from '../../services/templates.service';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <div class="bp-mb-2xl">
          <h1>Template Library</h1>
          <p class="bp-text-muted">Choose a template to start your digital product journey</p>
        </div>

        <div class="bp-loading" *ngIf="loading()">
          <div class="bp-spinner"></div>
        </div>
        
        <div class="bp-card bp-text-center" *ngIf="!loading() && templates().length === 0">
          <div style="padding: 4rem 2rem;">
            <p style="font-size: 4rem; margin-bottom: 1rem;">📚</p>
            <h3>No templates available yet</h3>
            <p class="bp-text-muted">Check back later or contact support</p>
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
                <span class="bp-badge bp-badge-success" *ngIf="template.isActive">Active</span>
                <span class="bp-badge bp-badge-warning" *ngIf="!template.isActive">Inactive</span>
              </div>
              <p class="bp-text-muted" style="font-size: 0.875rem;">
                Updated: ` + '{{ formatDate(template.updatedAt) }}' + `
              </p>
            </div>
            <div class="bp-card-footer">
              <button 
                [routerLink]="['/templates', template.id]"
                class="bp-btn bp-btn-sm bp-btn-secondary"
              >
                View Details
              </button>
              <button 
                [routerLink]="['/projects/new', template.id]"
                class="bp-btn bp-btn-sm bp-btn-primary"
              >
                Use Template
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

  templates = signal<Template[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.templatesService.getAll().subscribe({
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
