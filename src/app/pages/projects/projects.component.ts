import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Template {
  id: string;
  name: string;
  version: string;
}

interface Project {
  id: string;
  name: string;
  templateId: string;
  templateVersion: string;
  progress: number;
  createdAt: string;
  template?: Template;
  projectTasks?: any[];
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ProjectsComponent implements OnInit {
  private http = inject(HttpClient);

  projects = signal<Project[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadProjects();
  }

  async loadProjects() {
    try {
      const data = await this.http.get<Project[]>('/api/projects/my').toPromise();
      this.projects.set(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProject(id: string) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

    try {
      await this.http.delete(`/api/projects/${id}`).toPromise();
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
