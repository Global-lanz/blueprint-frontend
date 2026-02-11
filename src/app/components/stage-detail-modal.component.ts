import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { GemAchievementModalComponent } from './gem-achievement-modal.component';
import { GemUtilsService } from '../services/gem-utils.service';
import { TaskCardComponent } from './task-card.component';
import { HtmlRendererComponent } from './html-renderer.component';
import { environment } from '../../environments/environment';

interface Subtask {
  id: string;
  description: string;
  answer?: string;
  completed: boolean;
  link?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
  subtasks: Subtask[];
  link?: string;
}

interface Stage {
  id: string;
  name: string;
  description?: string;
  order: number;
  gemType?: string;
  tasks: Task[];
}

@Component({
  selector: 'app-stage-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, GemAchievementModalComponent, TaskCardComponent, HtmlRendererComponent],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="stage-header-content">
            <div class="stage-title-row">
              <span class="gem-icon" *ngIf="stage?.gemType" [innerHTML]="getGemIcon(stage.gemType)"></span>
              <h3 class="modal-title">{{ stage?.name }}</h3>
            </div>
            <div class="stage-meta">
              <!-- Badge removed -->
            </div>
          </div>
          <button class="modal-close" (click)="close()" title="Fechar">
            ✕
          </button>
        </div>

        <div class="modal-body">
          <!-- Stage Description -->
          <div class="stage-description" *ngIf="stage?.description">
            <app-html-renderer [content]="stage.description"></app-html-renderer>
          </div>

          <!-- Progress Overview -->
          <div class="stage-progress">
            <div class="progress-header">
              <span class="progress-label">Progresso da Etapa</span>
              <span class="progress-count">
                {{ getCompletedTasksCount() }}/{{ stage?.tasks?.length || 0 }} tarefas
              </span>
            </div>
            <div class="progress-bar-container">
              <div 
                class="progress-bar-fill" 
                [style.width]="getStageProgressPercentage() + '%'"
              ></div>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="tasks-list" *ngIf="stage?.tasks && stage.tasks.length > 0">
            <h4>Tarefas</h4>
            
            <app-task-card
              *ngFor="let task of stage.tasks; let i = index"
              [task]="task"
              [projectId]="projectId"
              [taskNumber]="i + 1"
              [showHeader]="true"
              [showProgress]="true"
              (taskUpdated)="onTaskUpdated()"
            ></app-task-card>
          </div>

          <div *ngIf="!stage?.tasks || stage.tasks.length === 0" class="no-tasks">
            <p>Esta etapa não possui tarefas.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-save" (click)="saveAllAnswers()">
            💾 Salvar Respostas
          </button>
        </div>
      </div>
    </div>

    <app-gem-achievement-modal
      [isOpen]="showGemModal"
      [gemType]="newGemType"
      (closeModal)="closeGemModal()"
    ></app-gem-achievement-modal>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: start;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    }

    .stage-header-content {
      flex: 1;
    }

    .stage-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .gem-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .modal-title {
      margin: 0;
      font-size: 1.5rem;
      color: #1a202c;
    }

    .stage-meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-left: 2.5rem;
    }

    .stage-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: #6B46C1;
      color: white;
      border-radius: 0.25rem;
      font-weight: 600;
    }

    .gem-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: #4299E1;
      color: white;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #718096;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .modal-close:hover {
      background: #e2e8f0;
      color: #1a202c;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f7fafc;
      border-radius: 0 0 12px 12px;
      display: flex;
      justify-content: flex-end;
    }

    .btn-save {
      background: linear-gradient(135deg, #0e3b33 0%, #0a2b25 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn-save:hover {
      background: linear-gradient(135deg, #0a2b25 0%, #0e3b33 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .stage-description {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f7fafc;
      border-left: 3px solid #6B46C1;
      border-radius: 0.375rem;
    }

    .stage-description p {
      margin: 0;
      color: #4a5568;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .stage-progress {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 0.5rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .progress-label {
      font-weight: 600;
      color: #2d3748;
    }

    .progress-count {
      color: #718096;
    }

    .progress-bar-container {
      height: 0.5rem;
      background: #e2e8f0;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--bp-primary) 0%, var(--bp-primary-light) 100%);
      transition: width 0.3s ease;
    }

    .tasks-list h4 {
      font-size: 1rem;
      margin-bottom: 1rem;
      color: #2d3748;
    }

    .task-card {
      margin-bottom: 1rem;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      transition: border-color 0.2s;
    }

    .task-card:hover {
      border-color: #cbd5e0;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.5rem;
      gap: 1rem;
    }

    .task-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .task-number {
      background: #6B46C1;
      color: white;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .task-header h5 {
      margin: 0;
      font-size: 1rem;
      color: #2d3748;
    }

    .task-header h5.completed {
      text-decoration: line-through;
      color: #a0aec0;
    }

    .task-progress-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: #e2e8f0;
      color: #4a5568;
      border-radius: 0.25rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .task-progress-badge.completed {
      background: #48BB78;
      color: white;
    }

    .task-description {
      margin: 0.5rem 0 0 0;
      padding-left: 2rem;
      font-size: 0.875rem;
      color: #718096;
    }

    .subtasks-section {
      margin-top: 0.75rem;
      padding-left: 2rem;
    }

    .subtask-item {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
    }

    .subtask-header {
      margin-bottom: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: start;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .checkbox-input {
      margin-top: 0.125rem;
      cursor: pointer;
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .checkbox-label span {
      color: #2d3748;
      font-weight: 500;
    }

    .checkbox-label span.completed {
      text-decoration: line-through;
      color: #a0aec0;
    }

    .subtask-answer {
      padding-left: 1.5rem;
    }

    .answer-label {
      display: block;
      font-size: 0.7rem;
      color: #718096;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .answer-textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #cbd5e0;
      border-radius: 0.375rem;
      font-family: inherit;
      font-size: 0.875rem;
      resize: vertical;
      transition: border-color 0.2s;
    }

    .answer-textarea:focus {
      outline: none;
      border-color: #6B46C1;
      box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
    }

    .no-tasks {
      text-align: center;
      padding: 3rem 1rem;
      color: #a0aec0;
    }

    .no-tasks p {
      margin: 0;
    }

    @media (max-width: 768px) {
      .modal-content {
        max-height: 100vh;
        border-radius: 0;
      }

      .stage-title-row {
        flex-direction: column;
        align-items: start;
      }

      .stage-meta {
        margin-left: 0;
      }
    }
  `]
})
export class StageDetailModalComponent {
  @Input() projectId: string = '';
  @Input() stage: Stage | null = null;
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() stageUpdated = new EventEmitter<void>();

  showGemModal = false;
  newGemType: string | null = null;

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) { }

  private gemUtils = inject(GemUtilsService);

  close() {
    this.closed.emit();
  }

  closeGemModal() {
    this.showGemModal = false;
    this.newGemType = null;
  }

  getGemIcon(gemType: string) {
    return this.gemUtils.getGemIcon(gemType, 24);
  }

  getGemName(gemType: string): string {
    return this.gemUtils.getGemName(gemType);
  }

  getCompletedTasksCount(): number {
    if (!this.stage?.tasks) return 0;
    return this.stage.tasks.filter(t => t.completed).length;
  }

  getStageProgressPercentage(): number {
    if (!this.stage?.tasks || this.stage.tasks.length === 0) return 0;
    return (this.getCompletedTasksCount() / this.stage.tasks.length) * 100;
  }

  onTaskUpdated() {
    this.stageUpdated.emit();
  }

  async toggleSubtask(subtask: Subtask) {
    if (!this.projectId || !subtask.id) return;

    try {
      const response: any = await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/toggle`, {}).toPromise();
      subtask.completed = !subtask.completed;

      // Recalcular se a tarefa está completa
      this.updateTaskCompletion();

      this.toast.success(subtask.completed ? 'Subtarefa concluída!' : 'Subtarefa reaberta');

      // Verificar se houve mudança de insígnia
      if (response?.gemChange?.changed && response.gemChange.newGem) {
        this.newGemType = response.gemChange.newGem;
        this.showGemModal = true;
      }

      this.stageUpdated.emit();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      this.toast.error('Erro ao atualizar subtarefa');
    }
  }

  updateTaskCompletion() {
    if (!this.stage?.tasks) return;

    // Atualizar o status de conclusão de cada tarefa baseado nas subtarefas
    this.stage.tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        const allCompleted = task.subtasks.every(s => s.completed);
        task.completed = allCompleted;
      }
    });
  }

  async saveAllAnswers() {
    if (!this.projectId || !this.stage?.tasks) return;

    try {
      const promises: Promise<any>[] = [];

      // Coletar todas as subtarefas de todas as tarefas
      for (const task of this.stage.tasks) {
        for (const subtask of task.subtasks || []) {
          if (subtask.id) {
            promises.push(
              this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/answer`, {
                answer: subtask.answer || ''
              }).toPromise()
            );
          }
        }
      }

      await Promise.all(promises);
      this.toast.success('Todas as respostas foram salvas!');
    } catch (err) {
      console.error('Failed to save answers:', err);
      this.toast.error('Erro ao salvar respostas');
    }
  }
}
