import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

interface Template {
  id: string;
  name: string;
  version: string;
  description?: string;
  tasks: any[];
}

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CreateProjectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  template = signal<Template | null>(null);
  loading = signal(true);
  saving = signal(false);
  projectName = '';

  ngOnInit() {
    const templateId = this.route.snapshot.paramMap.get('templateId');
    if (templateId) {
      this.loadTemplate(templateId);
    }
  }

  async loadTemplate(id: string) {
    try {
      const data = await this.http.get<Template>(`${environment.apiUrl}/templates/${id}`).toPromise();
      this.template.set(data as Template);
      // Sugerir nome baseado no template
      this.projectName = `Meu ${data!.name}`;
    } catch (err) {
      console.error('Failed to load template:', err);
      this.toast.error('Erro ao carregar template');
      this.router.navigate(['/templates']);
    } finally {
      this.loading.set(false);
    }
  }

  countSubtasks(): number {
    if (!this.template()) return 0;
    return this.template()!.tasks.reduce((total, task) => total + (task.subtasks?.length || 0), 0);
  }

  async createProject() {
    if (!this.projectName.trim() || !this.template()) {
      this.toast.warning('Nome do projeto é obrigatório');
      return;
    }

    this.saving.set(true);
    try {
      const payload = {
        name: this.projectName.trim(),
        templateId: this.template()!.id
      };
      
      await this.http.post(`${environment.apiUrl}/projects`, payload).toPromise();
      this.toast.success('Projeto criado com sucesso!');
      this.router.navigate(['/projects']);
    } catch (err: any) {
      this.toast.error('Erro ao criar projeto: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/templates']);
  }
}
