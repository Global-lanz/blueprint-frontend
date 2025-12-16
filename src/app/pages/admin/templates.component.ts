import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

interface Subtask {
  description: string;
}

interface Task {
  title: string;
  description: string;
  subtasks: Subtask[];
}

interface TemplateForm {
  name: string;
  version: string;
  description: string;
  tasks: Task[];
}

@Component({
  selector: 'app-admin-templates',
  templateUrl: './templates.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AdminTemplatesComponent implements OnInit {
  http = inject(HttpClient);
  router = inject(Router);
  toast = inject(ToastService);
  
  templates = signal<any[]>([]);
  showCreateForm = false;
  saving = signal(false);
  
  templateForm: TemplateForm = {
    name: '',
    version: '1.0',
    description: '',
    tasks: []
  };

  async ngOnInit() {
    await this.loadTemplates();
  }

  async loadTemplates() {
    try {
      this.templates.set(await this.http.get<any[]>('/api/templates').toPromise() as any[]);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    }
  }

  addTask() {
    this.templateForm.tasks.push({
      title: '',
      description: '',
      subtasks: []
    });
  }

  removeTask(index: number) {
    this.templateForm.tasks.splice(index, 1);
  }

  addSubtask(taskIndex: number) {
    this.templateForm.tasks[taskIndex].subtasks.push({ description: '' });
  }

  removeSubtask(taskIndex: number, subtaskIndex: number) {
    this.templateForm.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
  }

  async createTemplate() {
    if (!this.templateForm.name || !this.templateForm.version) {
      this.toast.warning('Preencha os campos obrigatórios');
      return;
    }

    this.saving.set(true);
    try {
      await this.http.post('/api/templates', this.templateForm).toPromise();
      this.toast.success('Template criado com sucesso!');
      this.resetForm();
      this.showCreateForm = false;
      await this.loadTemplates();
    } catch (err: any) {
      this.toast.error('Erro ao criar template: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  resetForm() {
    this.templateForm = {
      name: '',
      version: '1.0',
      description: '',
      tasks: []
    };
  }

  viewTemplate(id: string) {
    this.router.navigate(['/templates', id]);
  }

  editTemplate(id: string) {
    this.router.navigate(['/admin/templates', id, 'edit']);
  }
}
