import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TemplatesService, Template } from '../../services/templates.service';
import { ProjectsService, Project } from '../../services/projects.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <!-- Hero Section -->
        <div class="bp-text-center bp-mb-2xl">
          <h1>Welcome back, ` + "{{ user()?.name || 'User' }}" + ` 👋</h1>
          <p class="bp-text-muted" style="font-size: 1.125rem;">
            Build your digital products with confidence using our structured templates
          </p>
        </div>

        <!-- Stats Cards -->
        <div class="bp-grid bp-grid-3 bp-mb-2xl">
          <div class="bp-card bp-text-center">
            <h3 class="bp-text-primary" style="font-size: 2.5rem; margin: 0;">` + '{{ projects().length }}' + `</h3>
            <p class="bp-text-muted">Active Projects</p>
          </div>
          <div class="bp-card bp-text-center">
            <h3 class="bp-text-primary" style="font-size: 2.5rem; margin: 0;">` + '{{ templates().length }}' + `</h3>
            <p class="bp-text-muted">Available Templates</p>
          </div>
          <div class="bp-card bp-text-center">
            <h3 class="bp-text-success" style="font-size: 2.5rem; margin: 0;">` + '{{ completedCount() }}' + `</h3>
            <p class="bp-text-muted">Completed Tasks</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bp-card bp-mb-2xl">
          <div class="bp-card-header">
            <h3 class="bp-card-title">Quick Actions</h3>
          </div>
          <div class="bp-flex bp-gap-md bp-flex-wrap">
            <button 
              routerLink="/projects/new" 
              class="bp-btn bp-btn-primary"
            >
              ✨ Start New Project
            </button>
            <button 
              routerLink="/templates" 
              class="bp-btn bp-btn-secondary"
            >
              📚 Browse Templates
            </button>
            <button 
              routerLink="/projects" 
              class="bp-btn bp-btn-secondary"
            >
              📊 View All Projects
            </button>
          </div>
        </div>

        <!-- Recent Projects -->
        <div class="bp-card bp-mb-2xl">
          <div class="bp-card-header">
            <div class="bp-flex bp-justify-between bp-items-center">
              <h3 class="bp-card-title">Recent Projects</h3>
              <a routerLink="/projects" class="bp-btn bp-btn-sm bp-btn-secondary">View All</a>
            </div>
          </div>

          <div class="bp-loading" *ngIf="loadingProjects()">
            <div class="bp-spinner"></div>
          </div>
          
          <div class="bp-text-center bp-text-muted" style="padding: 3rem;" *ngIf="!loadingProjects() && projects().length === 0">
            <p style="font-size: 3rem; margin-bottom: 1rem;">📋</p>
            <h4>No projects yet</h4>
            <p>Start your first project from a template to begin your journey!</p>
            <button routerLink="/templates" class="bp-btn bp-btn-primary bp-mt-lg">
              Browse Templates
            </button>
          </div>
          
          <div class="bp-grid bp-grid-2" *ngIf="!loadingProjects() && projects().length > 0">
            <div class="bp-card" style="box-shadow: var(--bp-shadow-sm);" *ngFor="let project of projects().slice(0, 4)">
              <div class="bp-flex bp-justify-between bp-items-start bp-mb-md">
                <h4 style="margin: 0;">` + '{{ project.name }}' + `</h4>
                <span class="bp-badge bp-badge-success">` + '{{ project.status }}' + `</span>
              </div>
              <p class="bp-text-muted bp-mb-md">
                Created ` + '{{ formatDate(project.createdAt) }}' + `
              </p>
              <div class="bp-flex bp-gap-md">
                <button 
                  [routerLink]="['/projects', project.id]" 
                  class="bp-btn bp-btn-sm bp-btn-primary"
                >
                  Open
                </button>
                <button class="bp-btn bp-btn-sm bp-btn-secondary">
                  View Progress
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Available Templates -->
        <div class="bp-card">
          <div class="bp-card-header">
            <div class="bp-flex bp-justify-between bp-items-center">
              <h3 class="bp-card-title">Available Templates</h3>
              <a routerLink="/templates" class="bp-btn bp-btn-sm bp-btn-secondary">View All</a>
            </div>
          </div>

          <div class="bp-loading" *ngIf="loadingTemplates()">
            <div class="bp-spinner"></div>
          </div>
          
          <div class="bp-text-center bp-text-muted" style="padding: 3rem;" *ngIf="!loadingTemplates() && templates().length === 0">
            <p style="font-size: 3rem; margin-bottom: 1rem;">📚</p>
            <h4>No templates available</h4>
            <p>Contact an administrator to create templates.</p>
          </div>
          
          <div class="bp-grid bp-grid-3" *ngIf="!loadingTemplates() && templates().length > 0">
            <div class="bp-card" style="box-shadow: var(--bp-shadow-sm);" *ngFor="let template of templates().slice(0, 6)">
              <div class="bp-flex bp-justify-between bp-items-start bp-mb-md">
                <h5 style="margin: 0;">` + '{{ template.name }}' + `</h5>
                <span class="bp-badge bp-badge-primary">v` + '{{ template.version }}' + `</span>
              </div>
              <p class="bp-text-muted bp-mb-lg">
                ` + '{{ template.description }}' + `
              </p>
              <button 
                [routerLink]="['/templates', template.id]" 
                class="bp-btn bp-btn-sm bp-btn-primary"
                style="width: 100%;"
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
export class HomeComponent implements OnInit {
  private templatesService = inject(TemplatesService);
  private projectsService = inject(ProjectsService);
  private authService = inject(AuthService);

  templates = signal<Template[]>([]);
  projects = signal<Project[]>([]);
  user = signal<User | null>(null);
  loadingTemplates = signal(true);
  loadingProjects = signal(true);
  completedCount = signal(0);

  ngOnInit() {
    this.loadUser();
    this.loadTemplates();
    this.loadProjects();
  }

  loadUser() {
    this.authService.getMe().subscribe({
      next: (user) => this.user.set(user),
      error: (err) => console.error('Failed to load user:', err),
    });
  }

  loadTemplates() {
    this.templatesService.getAll().subscribe({
      next: (data) => {
        this.templates.set(data);
        this.loadingTemplates.set(false);
      },
      error: (err) => {
        console.error('Failed to load templates:', err);
        this.loadingTemplates.set(false);
      },
    });
  }

  loadProjects() {
    this.projectsService.getMyProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.loadingProjects.set(false);
        // Calculate completed tasks (mock for now)
        this.completedCount.set(Math.floor(data.length * 2.5));
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        this.loadingProjects.set(false);
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}
