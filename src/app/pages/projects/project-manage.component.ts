import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { environment } from '../../../environments/environment';
import { RichTextEditorComponent } from '../../components/rich-text-editor.component';
import { GemUtilsService } from '../../services/gem-utils.service';

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
  imports: [CommonModule, FormsModule, RichTextEditorComponent],
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
          <div *ngFor="let stage of project()!.projectStages; let si = index" 
               [id]="'stage-' + si"
               class="bp-card bp-mb-lg" 
               [style.borderLeft]="'4px solid ' + gemUtils.getGemColor(stage.gemType || 'ESMERALDA')">
            <div class="bp-card-header" style="background: #f5f5ff;">
              <div class="bp-flex bp-justify-between bp-items-center bp-gap-md">
                <div class="bp-flex bp-items-center bp-gap-sm" style="flex: 1;">
                  <div class="bp-flex bp-items-center bp-gap-xs" style="background: white; padding: 2px 8px; border-radius: 20px; border: 1px solid #e2e8f0;">
                    <span [innerHTML]="gemUtils.getGemIcon(stage.gemType || 'ESMERALDA', 20)"></span>
                    <select [(ngModel)]="stage.gemType" class="bp-input bp-input-sm" style="border: none; background: transparent; padding: 0; font-size: 0.75rem; width: auto; min-width: 100px;">
                      <option *ngFor="let gem of gems" [value]="gem">{{ gemUtils.getGemName(gem) }}</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    class="bp-input bp-input-sm" 
                    [(ngModel)]="stage.name"
                    [style.color]="gemUtils.getGemColor(stage.gemType || 'ESMERALDA')"
                    style="font-weight: bold; background: transparent; border: none; padding: 4px; width: 100%;"
                    placeholder="Nome da Etapa"
                  />
                </div>
                <div class="bp-flex bp-gap-sm">
                  <button 
                    type="button"
                    class="bp-btn bp-btn-sm bp-btn-secondary" 
                    (click)="moveStageUp(si)"
                    [disabled]="si === 0"
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button 
                    type="button"
                    class="bp-btn bp-btn-sm bp-btn-secondary" 
                    (click)="moveStageDown(si)"
                    [disabled]="si === project()!.projectStages.length - 1"
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button 
                    type="button"
                    class="bp-btn bp-btn-sm bp-btn-primary" 
                    (click)="addTaskToStage(si)"
                  >
                    + Tarefa
                  </button>
                  <button 
                    type="button"
                    class="bp-btn bp-btn-sm bp-btn-error" 
                    (click)="removeStage(si)"
                  >
                    ✕ Remover Etapa
                  </button>
                </div>
              </div>
              <div class="bp-mt-md">
                <label class="bp-label bp-text-sm" [style.color]="gemUtils.getGemColor(stage.gemType || 'ESMERALDA')">📝 Descrição da Etapa</label>
                <app-rich-text-editor 
                  [(ngModel)]="stage.description" 
                  placeholder="Descreva o que deve ser feito nesta etapa"
                ></app-rich-text-editor>
              </div>
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
                    <app-rich-text-editor 
                      [(ngModel)]="task.description"
                      placeholder="Descreva o que deve ser feito nesta tarefa"
                    ></app-rich-text-editor>
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

          <div class="bp-flex bp-justify-center bp-mb-2xl">
            <button 
              type="button"
              class="bp-btn bp-btn-secondary" 
              (click)="addStage()"
              style="border-style: dashed; border-width: 2px;"
            >
              ➕ Adicionar Nova Etapa de Projeto
            </button>
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
  public gemUtils = inject(GemUtilsService);

  projectId: string = '';
  project = signal<Project | null>(null);
  initialProjectStructure: Project | null = null;
  loading = signal(true);
  saving = signal(false);
  gems = ['ESMERALDA', 'RUBI', 'SAFIRA', 'DIAMANTE'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId = id;
      this.loadProject(id);
    }
  }

  async loadProject(id: string) {
    try {
      const data = await this.http.get<Project>(`${environment.apiUrl}/projects/${id}?t=${Date.now()}`).toPromise();
      this.project.set(data || null);
      if (data) {
        this.initialProjectStructure = JSON.parse(JSON.stringify(data));
      }
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

  addStage() {
    const proj = this.project();
    if (!proj) return;

    proj.projectStages.push({
      name: 'Nova Etapa',
      description: '',
      order: proj.projectStages.length,
      gemType: 'ESMERALDA',
      tasks: []
    });
    this.project.set({ ...proj });
  }

  async removeStage(stageIndex: number) {
    const proj = this.project();
    if (!proj) return;

    const confirmed = await this.confirm.confirm(
      'Remover Etapa',
      'Tem certeza que deseja remover esta etapa? Todos os dados preenchidos nela serão perdidos.',
      { type: 'danger', confirmText: 'Sim, remover' }
    );

    if (confirmed) {
      proj.projectStages.splice(stageIndex, 1);
      // Reorder
      proj.projectStages.forEach((s, i) => s.order = i);
      this.project.set({ ...proj });
    }
  }

  moveStageUp(index: number) {
    const proj = this.project();
    if (!proj || index === 0) return;

    const stages = [...proj.projectStages];
    [stages[index - 1], stages[index]] = [stages[index], stages[index - 1]];

    // Update order property
    stages.forEach((s, i) => s.order = i);

    this.project.set({ ...proj, projectStages: stages });
    this.scrollToStage(index - 1);
  }

  moveStageDown(index: number) {
    const proj = this.project();
    if (!proj || index === proj.projectStages.length - 1) return;

    const stages = [...proj.projectStages];
    [stages[index], stages[index + 1]] = [stages[index + 1], stages[index]];

    // Update order property
    stages.forEach((s, i) => s.order = i);

    this.project.set({ ...proj, projectStages: stages });
    this.scrollToStage(index + 1);
  }

  private scrollToStage(index: number) {
    setTimeout(() => {
      const element = document.getElementById(`stage-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        element.style.transition = 'background-color 0.5s';
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#f0f7ff';
        setTimeout(() => {
          element.style.backgroundColor = originalBg;
        }, 1000);
      }
    }, 100);
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

    // Identificar remoções para o resumo
    const removals = this.getRemovalsSummary();
    if (removals) {
      const confirmed = await this.confirm.confirm(
        'Confirmar Alterações',
        `As seguintes informações serão removidas permanentemente:\n\n${removals}\n\nDeseja continuar?`,
        { type: 'danger', confirmText: 'Sim, aplicar' }
      );
      if (!confirmed) return;
    }

    this.saving.set(true);
    try {
      await this.http.put(`${environment.apiUrl}/projects/${this.projectId}/structure`, {
        stages: proj.projectStages
      }).toPromise();

      // Update initial structure after success
      this.initialProjectStructure = JSON.parse(JSON.stringify(proj));

      this.toast.success('Alterações salvas com sucesso!');
      window.scrollTo(0, 0);
      this.router.navigate(['/projects', this.projectId]);
    } catch (err: any) {
      this.toast.error('Erro ao salvar: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  private getRemovalsSummary(): string {
    if (!this.initialProjectStructure || !this.project()) return '';

    const initialStages = this.initialProjectStructure.projectStages;
    const currentStages = this.project()!.projectStages;

    const removalLines: string[] = [];

    // Check for removals
    for (const iStage of initialStages) {
      const currentStage = currentStages.find(s => s.id === iStage.id);

      if (!currentStage && iStage.id) {
        // Stage was removed entirely
        removalLines.push(`• Etapa: ${iStage.name}`);
      } else if (currentStage) {
        // Stage exists, check for removed tasks within it
        for (const iTask of iStage.tasks) {
          const currentTask = currentStage.tasks.find(t => t.id === iTask.id);

          if (!currentTask && iTask.id) {
            // Task was removed from an existing stage
            removalLines.push(`• Etapa: ${iStage.name} ➔ Tarefa: ${iTask.title}`);
          } else if (currentTask) {
            // Task exists, check for removed subtasks within it
            for (const iSub of iTask.subtasks) {
              const currentSub = currentTask.subtasks.find(s => s.id === iSub.id);

              if (!currentSub && iSub.id) {
                // Subtask was removed from an existing task
                removalLines.push(`• Etapa: ${iStage.name} ➔ Tarefa: ${iTask.title} ➔ Subtarefa: ${iSub.description}`);
              }
            }
          }
        }
      }
    }

    return removalLines.join('\n');
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  goToWork() {
    this.router.navigate(['/projects', this.projectId]);
  }
}
