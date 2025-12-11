import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsService, Project } from '../../services/projects.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <div class="bp-flex bp-justify-between bp-items-center bp-mb-2xl">
          <div>
            <h1>My Projects</h1>
            <p class="bp-text-muted">Manage and track your digital product projects</p>
          </div>
          <button 
            routerLink="/projects/new"
            class="bp-btn bp-btn-primary"
          >
            ✨ New Project
          </button>
        </div>

        <div class="bp-loading" *ngIf="loading()">
          <div class="bp-spinner"></div>
        </div>
        
        <div class="bp-card bp-text-center" *ngIf="!loading() && projects().length === 0">
          <div style="padding: 4rem 2rem;">
            <p style="font-size: 4rem; margin-bottom: 1rem;">📋</p>
            <h3>No projects yet</h3>
            <p class="bp-text-muted bp-mb-lg">Start your first project to begin building your digital product</p>
            <button 
              routerLink="/templates"
              class="bp-btn bp-btn-primary"
            >
              Browse Templates
            </button>
          </div>
        </div>
        
        <div class="bp-card" *ngIf="!loading() && projects().length > 0">
          <table class="bp-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let project of projects()">
                <td>
                  <strong>` + '{{ project.name }}' + `</strong>
                </td>
                <td>
                  <span class="bp-badge bp-badge-success">` + '{{ project.status }}' + `</span>
                </td>
                <td class="bp-text-muted">
                  ` + '{{ formatDate(project.createdAt) }}' + `
                </td>
                <td>
                  <div class="bp-progress">
                    <div 
                      class="bp-progress-bar" 
                      [style.width]="calculateProgress(project) + '%'"
                    ></div>
                  </div>
                </td>
                <td>
                  <div class="bp-flex bp-gap-sm">
                    <button 
                      [routerLink]="['/projects', project.id]"
                      class="bp-btn bp-btn-sm bp-btn-primary"
                    >
                      Open
                    </button>
                    <button 
                      (click)="deleteProject(project.id)"
                      class="bp-btn bp-btn-sm bp-btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ProjectsComponent implements OnInit {
  private projectsService = inject(ProjectsService);

  projects = signal<Project[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectsService.getMyProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        this.loading.set(false);
      },
    });
  }

  deleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    this.projectsService.delete(id).subscribe({
      next: () => {
        this.projects.set(this.projects().filter(p => p.id !== id));
      },
      error: (err) => console.error('Failed to delete project:', err),
    });
  }

  calculateProgress(project: Project): number {
    // Mock progress calculation - replace with real logic
    return Math.random() * 100;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
