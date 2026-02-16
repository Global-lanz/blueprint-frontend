import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConfirmService } from '../../services/confirm.service';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { ProjectsTableComponent } from '../../components/projects-table.component';
import { environment } from '../../../environments/environment';

interface Template {
  id: string;
  name: string;
  version: string;
}

interface ProjectStage {
  id: string;
  name: string;
  order: number;
  gemType: string;
  tasks: {
    id: string;
    completed: boolean;
    subtasks: { completed: boolean }[];
  }[];
}

interface Project {
  id: string;
  name: string;
  templateId: string;
  templateVersion: string;
  progress: number;
  createdAt: string;
  actualStartDate?: string;
  template?: Template;
  projectTasks?: any[];
  projectStages?: ProjectStage[];
  currentGem?: string;
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent, ProjectsTableComponent],
})
export class ProjectsComponent implements OnInit {
  private http = inject(HttpClient);
  private confirm = inject(ConfirmService);

  projects = signal<Project[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadProjects();
  }

  async loadProjects() {
    try {
      const data = await this.http.get<Project[]>(`${environment.apiUrl}/projects/my`).toPromise();
      this.projects.set(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProject(id: string) {
    const confirmed = await this.confirm.confirm(
      'Excluir Projeto',
      'Tem certeza que deseja excluir este projeto? Todos os dados serão perdidos permanentemente.',
      { type: 'danger', confirmText: 'Sim, excluir' }
    );

    if (!confirmed) return;

    try {
      await this.http.delete(`${environment.apiUrl}/projects/${id}`).toPromise();
      this.projects.set(this.projects().filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
