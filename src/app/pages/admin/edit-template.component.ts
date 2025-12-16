import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

interface Subtask {
  id?: string;
  description: string;
}

interface Task {
  id?: string;
  title: string;
  description: string;
  order: number;
  subtasks: Subtask[];
}

interface Stage {
  id?: string;
  name: string;
  description?: string;
  order: number;
  tasks: Task[];
}

interface TemplateForm {
  name: string;
  version: string;
  description: string;
  stages: Stage[];
  tasks: Task[];
}

@Component({
  selector: 'app-edit-template',
  templateUrl: './edit-template.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class EditTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  templateId: string = '';
  loading = signal(true);
  saving = signal(false);
  
  templateForm: TemplateForm = {
    name: '',
    version: '1.0',
    description: '',
    stages: [],
    tasks: []
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateId = id;
      this.loadTemplate(id);
    }
  }

  async loadTemplate(id: string) {
    try {
      const data = await this.http.get<any>(`/api/templates/${id}`).toPromise();
      this.templateForm = {
        name: data.name,
        version: data.version,
        description: data.description || '',
        stages: (data.stages || []).map((stage: any) => ({
          id: stage.id,
          name: stage.name,
          description: stage.description || '',
          order: stage.order,
          tasks: (stage.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            order: t.order || 0,
            subtasks: (t.subtasks || []).map((s: any) => ({
              id: s.id,
              description: s.description
            }))
          }))
        })),
        tasks: (data.tasks || []).filter((t: any) => !t.stageId).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          order: t.order || 0,
          subtasks: (t.subtasks || []).map((s: any) => ({
            id: s.id,
            description: s.description
          }))
        }))
      };
    } catch (err) {
      console.error('Failed to load template:', err);
      this.toast.error('Erro ao carregar template');
      this.router.navigate(['/admin/templates']);
    } finally {
      this.loading.set(false);
    }
  }

  addStage() {
    this.templateForm.stages.push({
      name: '',
      description: '',
      order: this.templateForm.stages.length,
      tasks: []
    });
  }

  removeStage(index: number) {
    this.templateForm.stages.splice(index, 1);
    // Reorder remaining stages
    this.templateForm.stages.forEach((stage, i) => stage.order = i);
  }

  addTaskToStage(stageIndex: number) {
    const stage = this.templateForm.stages[stageIndex];
    stage.tasks.push({
      title: '',
      description: '',
      order: stage.tasks.length,
      subtasks: []
    });
  }

  removeTaskFromStage(stageIndex: number, taskIndex: number) {
    this.templateForm.stages[stageIndex].tasks.splice(taskIndex, 1);
  }

  addTask() {
    this.templateForm.tasks.push({
      title: '',
      description: '',
      order: this.templateForm.tasks.length,
      subtasks: []
    });
  }

  removeTask(index: number) {
    this.templateForm.tasks.splice(index, 1);
  }

  addSubtaskToStageTask(stageIndex: number, taskIndex: number) {
    this.templateForm.stages[stageIndex].tasks[taskIndex].subtasks.push({ description: '' });
  }

  removeSubtaskFromStageTask(stageIndex: number, taskIndex: number, subtaskIndex: number) {
    this.templateForm.stages[stageIndex].tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
  }

  addSubtask(taskIndex: number) {
    this.templateForm.tasks[taskIndex].subtasks.push({ description: '' });
  }

  removeSubtask(taskIndex: number, subtaskIndex: number) {
    this.templateForm.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
  }

  async saveTemplate() {
    if (!this.templateForm.name || !this.templateForm.version) {
      this.toast.warning('Preencha os campos obrigatórios');
      return;
    }

    this.saving.set(true);
    try {
      await this.http.put(`/api/templates/${this.templateId}`, this.templateForm).toPromise();
      this.toast.success('Template atualizado com sucesso!');
      this.router.navigate(['/admin/templates']);
    } catch (err: any) {
      this.toast.error('Erro ao atualizar template: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/admin/templates']);
  }
}
