import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
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
  tasks: Task[];
}

interface Project {
  id: string;
  name: string;
  templateVersion: string;
  projectStages: Stage[];
  projectTasks: Task[];
  template: {
    name: string;
    version: string;
  };
}

@Component({
  selector: 'app-project-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <div class="bp-loading" *ngIf="loading()">
          <div class="bp-spinner"></div>
        </div>

        <div *ngIf="!loading() && project()">
          <div class="bp-flex bp-justify-between bp-items-center bp-mb-2xl">
            <div>
              <h1>⚙️ Gerenciar Projeto</h1>
              <h3>{{ project()!.name }}</h3>
              <p class="bp-text-muted">
                Adicione, remova ou reorganize tarefas e subtarefas do projeto
              </p>
            </div>
            <div class="bp-flex bp-gap-md">
              <button class="bp-btn bp-btn-secondary" (click)="goToWork()">
                ✏️ Trabalhar
              </button>
              <button class="bp-btn bp-btn-secondary" (click)="goBack()">
                ← Voltar
              </button>
            </div>
          </div>

          <div class="bp-alert bp-alert-info bp-mb-lg">
            <strong>💡 Dica:</strong> Use esta área para ajustar a estrutura do seu projeto. As alterações não afetam o template original.
          </div>

          <!-- Stages -->
          <div *ngFor="let stage of project()!.projectStages; let si = index" class="bp-card bp-mb-lg" style="border-left: 4px solid #4f46e5;">
            <div class="bp-card-header" style="background: #f5f5ff;">
              <div class="bp-flex bp-justify-between bp-items-center">
                <h3 class="bp-card-title" style="color: #4f46e5;">📋 {{ stage.name }}</h3>
                <button 
                  type="button"
                  class="bp-btn bp-btn-sm bp-btn-primary" 
                  (click)="addTaskToStage(si)"
                >
                  + Adicionar Tarefa
                </button>
              </div>
              <p class="bp-text-muted bp-text-sm" *ngIf="stage.description">{{ stage.description }}</p>
            </div>
            <div class="bp-card-body">
              <!-- Tasks -->
              <div *ngFor="let task of stage.tasks; let ti = index" class="bp-card bp-mb-md">
                <div class="bp-card-header">
                  <div class="bp-flex bp-justify-between bp-items-center">
                    <h4 class="bp-card-title">Tarefa #{{ ti + 1 }}</h4>
                    <button 
                      type="button"
                      class="bp-btn bp-btn-sm bp-btn-error" 
                      (click)="removeTaskFromStage(si, ti)"
                    >
                      ✕ Remover
                    </button>
                  </div>
                </div>
                <div class="bp-card-body">
                  <div class="bp-form-group">
                    <label class="bp-label">Título da Tarefa *</label>
                    <input 
                      type="text" 
                      class="bp-input" 
                      [(ngModel)]="task.title"
                      placeholder="Ex: Definir público-alvo"
                    />
                  </div>

                  <div class="bp-form-group">
                    <label class="bp-label">Descrição</label>
                    <textarea 
                      class="bp-input" 
                      [(ngModel)]="task.description"
                      rows="2"
                      placeholder="Descreva o que deve ser feito nesta tarefa"
                    ></textarea>
                  </div>

                  <!-- Subtasks -->
                  <div class="bp-mb-md">
                    <div class="bp-flex bp-justify-between bp-items-center bp-mb-sm">
                      <label class="bp-label">Subtarefas</label>
                      <button 
                        type="button"
                        class="bp-btn bp-btn-sm bp-btn-secondary" 
                        (click)="addSubtaskToTask(si, ti)"
                      >
                        + Subtarefa
                      </button>
                    </div>

                    <div *ngFor="let subtask of task.subtasks; let sti = index" class="bp-flex bp-gap-sm bp-mb-sm">
                      <input 
                        type="text" 
                        class="bp-input" 
                        [(ngModel)]="subtask.description"
                        placeholder="Descrição da subtarefa"
                      />
                      <button 
                        type="button"
                        class="bp-btn bp-btn-sm bp-btn-error" 
                        (click)="removeSubtask(si, ti, sti)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <p *ngIf="stage.tasks.length === 0" class="bp-text-muted" style="text-align: center; padding: 2rem;">
                Nenhuma tarefa nesta etapa. Clique em "+ Adicionar Tarefa" para começar.
              </p>
            </div>
          </div>

          <div class="bp-flex bp-gap-md bp-mt-2xl">
            <button 
              class="bp-btn bp-btn-primary"
              (click)="saveChanges()"
              [disabled]="saving()"
            >
              {{ saving() ? "Salvando..." : "💾 Salvar Alterações" }}
            </button>
            <button 
              class="bp-btn bp-btn-secondary" 
              (click)="goBack()"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProjectManageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  projectId: string = '';
  project = signal<Project | null>(null);
  loading = signal(true);
  saving = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId = id;
      this.loadProject(id);
    }
  }

  async loadProject(id: string) {
    try {
      const data = await this.http.get<Project>(`${environment.apiUrl}/projects/${id}`).toPromise();
      this.project.set(data || null);
    } catch (err) {
      console.error('Failed to load project:', err);
      this.toast.error('Erro ao carregar projeto');
      this.router.navigate(['/projects']);
    } finally {
      this.loading.set(false);
    }
  }

  addTaskToStage(stageIndex: number) {
    const proj = this.project();
    if (!proj) return;
    
    const stage = proj.projectStages[stageIndex];
    stage.tasks.push({
      title: '',
      description: '',
      order: stage.tasks.length,
      subtasks: []
    });
    this.project.set({ ...proj });
  }

  async removeTaskFromStage(stageIndex: number, taskIndex: number) {
    const proj = this.project();
    if (!proj) return;
    
    const confirmed = await this.confirm.confirm(
      'Remover Tarefa',
      'Tem certeza que deseja remover esta tarefa? Esta ação não pode ser desfeita.',
      { type: 'danger', confirmText: 'Sim, remover' }
    );
    
    if (confirmed) {
      proj.projectStages[stageIndex].tasks.splice(taskIndex, 1);
      this.project.set({ ...proj });
    }
  }

  addSubtaskToTask(stageIndex: number, taskIndex: number) {
    const proj = this.project();
    if (!proj) return;
    
    proj.projectStages[stageIndex].tasks[taskIndex].subtasks.push({ description: '' });
    this.project.set({ ...proj });
  }

  removeSubtask(stageIndex: number, taskIndex: number, subtaskIndex: number) {
    const proj = this.project();
    if (!proj) return;
    
    proj.projectStages[stageIndex].tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
    this.project.set({ ...proj });
  }

  async saveChanges() {
    const proj = this.project();
    if (!proj) return;

    // Validar
    for (const stage of proj.projectStages) {
      for (const task of stage.tasks) {
        if (!task.title.trim()) {
          this.toast.warning('Todas as tarefas devem ter um título');
          return;
        }
        for (const subtask of task.subtasks) {
          if (!subtask.description.trim()) {
            this.toast.warning('Todas as subtarefas devem ter uma descrição');
            return;
          }
        }
      }
    }

    this.saving.set(true);
    try {
      await this.http.put(`${environment.apiUrl}/projects/${this.projectId}/structure`, {
        stages: proj.projectStages
      }).toPromise();
      this.toast.success('Alterações salvas com sucesso!');
      this.router.navigate(['/projects', this.projectId]);
    } catch (err: any) {
      this.toast.error('Erro ao salvar: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  goToWork() {
    this.router.navigate(['/projects', this.projectId]);
  }
}
