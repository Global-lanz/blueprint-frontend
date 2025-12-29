import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../../services/toast.service';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { environment } from '../../../environments/environment';

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
  gemType?: string;
  tasks: Task[];
}

interface TemplateForm {
  name: string;
  description: string;
  stages: Stage[];
  tasks: Task[];
}

@Component({
  selector: 'app-edit-template',
  templateUrl: './edit-template.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
})
export class EditTemplateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  templateId: string = '';
  loading = signal(true);
  saving = signal(false);
  expandedStages = signal<Set<number>>(new Set());
  isActive = signal(true);
  
  templateForm: TemplateForm = {
    name: '',
    description: '',
    stages: [],
    tasks: []
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateId = id;
      this.loadTemplate(id);
    } else {
      // Modo de criação - não precisa carregar
      this.loading.set(false);
    }
  }

  async loadTemplate(id: string) {
    try {
      const data = await this.http.get<any>(`${environment.apiUrl}/templates/${id}`).toPromise();
      this.isActive.set(data.isActive ?? true);
      this.templateForm = {
        name: data.name,
        description: data.description || '',
        stages: (data.stages || []).map((stage: any) => ({
          id: stage.id,
          name: stage.name,
          description: stage.description || '',
          order: stage.order,
          gemType: stage.gemType || 'ESMERALDA',
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
      
      // Auto-expand all stages when loading
      const allIndices = new Set(this.templateForm.stages.map((_, index) => index));
      this.expandedStages.set(allIndices);
    } catch (err) {
      console.error('Failed to load template:', err);
      this.toast.error('Erro ao carregar template');
      this.router.navigate(['/admin/templates']);
    } finally {
      this.loading.set(false);
    }
  }

  addStage() {
    const newIndex = this.templateForm.stages.length;
    this.templateForm.stages.push({
      name: '',
      description: '',
      order: newIndex,
      gemType: 'ESMERALDA',
      tasks: []
    });
    // Auto-expand the new stage
    const expanded = this.expandedStages();
    expanded.add(newIndex);
    this.expandedStages.set(new Set(expanded));
  }

  toggleStage(index: number) {
    const expanded = this.expandedStages();
    if (expanded.has(index)) {
      expanded.delete(index);
    } else {
      expanded.add(index);
    }
    this.expandedStages.set(new Set(expanded));
  }

  isStageExpanded(index: number): boolean {
    return this.expandedStages().has(index);
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
    if (!this.templateForm.name) {
      this.toast.warning('Preencha os campos obrigatórios');
      return;
    }

    this.saving.set(true);
    try {
      if (this.templateId) {
        // Modo de edição
        await this.http.put(`${environment.apiUrl}/templates/${this.templateId}`, this.templateForm).toPromise();
        this.toast.success('Template atualizado com sucesso!');
      } else {
        // Modo de criação
        await this.http.post(`${environment.apiUrl}/templates`, this.templateForm).toPromise();
        this.toast.success('Template criado com sucesso!');
      }
      this.router.navigate(['/templates']);
    } catch (err: any) {
      this.toast.error('Erro ao salvar template: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/templates']);
  }

  async toggleActive() {
    if (!this.templateId) return;
    
    const action = this.isActive() ? 'desativar' : 'ativar';
    const actionPast = this.isActive() ? 'desativado' : 'ativado';

    try {
      const updated = await this.http.patch<any>(
        `${environment.apiUrl}/templates/${this.templateId}/toggle-active`,
        {}
      ).toPromise();
      
      this.isActive.set(updated.isActive);
      this.toast.success(`Template ${actionPast} com sucesso!`);
    } catch (err: any) {
      this.toast.error('Erro ao alterar status: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    }
  }

  getGemName(gemType: string): string {
    const names: { [key: string]: string } = {
      'ESMERALDA': 'Esmeralda',
      'RUBI': 'Rubi',
      'SAFIRA': 'Safira',
      'DIAMANTE': 'Diamante'
    };
    return names[gemType] || gemType;
  }

  gemTypes = [
    { value: 'ESMERALDA', label: 'Esmeralda' },
    { value: 'RUBI', label: 'Rubi' },
    { value: 'SAFIRA', label: 'Safira' },
    { value: 'DIAMANTE', label: 'Diamante' }
  ];

  getGemIcon(gemType: string): SafeHtml {
    const colors: { [key: string]: { fill: string; shine: string } } = {
      'ESMERALDA': { fill: '#10B981', shine: '#34D399' },
      'RUBI': { fill: '#EF4444', shine: '#F87171' },
      'SAFIRA': { fill: '#3B82F6', shine: '#60A5FA' },
      'DIAMANTE': { fill: '#E5E7EB', shine: '#F9FAFB' }
    };
    const color = colors[gemType] || colors['DIAMANTE'];
    const svg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="${color.fill}" stroke="#1a202c" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 2L21 9L12 12L3 9L12 2Z" fill="${color.shine}" opacity="0.6"/>
      <line x1="3" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
      <line x1="21" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
    </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
