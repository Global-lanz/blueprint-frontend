import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { GemAchievementModalComponent } from './gem-achievement-modal.component';
import { GemUtilsService } from '../services/gem-utils.service';

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
  status?: string;
  completed: boolean;
  subtasks: Subtask[];
  stageId?: string;
  stageName?: string;
  stageGemType?: string;
  link?: string;
}

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, GemAchievementModalComponent],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">{{ task?.title }}</h3>
            <p class="modal-subtitle" *ngIf="task?.stageName">
              <span *ngIf="task?.stageGemType" [innerHTML]="getGemIcon(task.stageGemType)" style="display: inline-flex; align-items: center; margin-right: 0.25rem; vertical-align: middle;"></span>
              {{ task.stageName }}
            </p>
          </div>
          <button class="modal-close" (click)="close()" title="Fechar">
            ✕
          </button>
        </div>

        <div class="modal-body">
          <div *ngIf="task?.description" class="task-description">
            <p>{{ task.description }}</p>
          </div>

          <!-- Task Link -->
          <div class="task-link-section" style="margin-bottom: 1.5rem;">
            <div *ngIf="!task?.link && !showTaskLinkForm">
              <button class="bp-btn bp-btn-sm bp-btn-secondary" (click)="showTaskLinkForm = true">
                🔗 Adicionar Link à Tarefa
              </button>
            </div>
            <div *ngIf="task?.link && !showTaskLinkForm" style="display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem; background: #f7fafc; border-radius: 0.375rem;">
              <span style="font-size: 0.875rem; color: #4a5568;">🔗</span>
              <a [href]="task.link" target="_blank" style="flex: 1; color: #3182ce; text-decoration: none; font-size: 0.875rem;">{{ task.link }}</a>
              <button class="bp-btn bp-btn-sm bp-btn-danger" (click)="removeTaskLink()" title="Remover">✖</button>
            </div>
            <div *ngIf="showTaskLinkForm" style="display: flex; gap: 0.5rem;">
              <input 
                type="url" 
                class="bp-input" 
                [(ngModel)]="tempTaskLink"
                placeholder="https://exemplo.com"
                style="flex: 1; font-size: 0.875rem;"
              />
              <button class="bp-btn bp-btn-sm bp-btn-primary" (click)="saveTaskLink()">✓</button>
              <button class="bp-btn bp-btn-sm bp-btn-secondary" (click)="cancelTaskLink()">✖</button>
            </div>
          </div>

          <div class="task-progress">
            <div class="progress-header">
              <span class="progress-label">Progresso</span>
              <span class="progress-count">
                {{ getCompletedCount() }}/{{ task?.subtasks.length || 0 }}
              </span>
            </div>
            <div class="progress-bar-container">
              <div 
                class="progress-bar-fill" 
                [style.width]="getProgressPercentage() + '%'"
              ></div>
            </div>
          </div>

          <div class="subtasks-list" *ngIf="task?.subtasks && task.subtasks.length > 0">
            <h4>Subtarefas</h4>
            <div *ngFor="let subtask of task.subtasks" class="subtask-item">
              <div class="subtask-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [checked]="subtask.completed"
                    (change)="toggleSubtask(subtask)"
                    class="checkbox-input"
                  />
                  <span [class.completed]="subtask.completed">
                    {{ subtask.description }}
                  </span>
                </label>
              </div>
              <div class="subtask-answer">
                <label class="answer-label">Resposta:</label>
                <textarea 
                  class="answer-textarea"
                  [(ngModel)]="subtask.answer"
                  (blur)="saveSubtaskAnswer(subtask)"
                  placeholder="Digite sua resposta aqui..."
                  rows="3"
                ></textarea>
              </div>
              
              <!-- Subtask Link -->
              <div class="subtask-link-section" style="margin-top: 0.5rem;">
                <div *ngIf="!subtask.link && !isEditingSubtaskLink(subtask.id)">
                  <button class="bp-btn bp-btn-sm bp-btn-secondary" (click)="startEditingSubtaskLink(subtask)" style="font-size: 0.75rem;">
                    🔗 Adicionar Link
                  </button>
                </div>
                <div *ngIf="subtask.link && !isEditingSubtaskLink(subtask.id)" style="display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem; background: #edf2f7; border-radius: 0.25rem;">
                  <span style="font-size: 0.75rem;">🔗</span>
                  <a [href]="subtask.link" target="_blank" style="flex: 1; color: #3182ce; text-decoration: none; font-size: 0.75rem;">{{ subtask.link }}</a>
                  <button class="bp-btn bp-btn-sm bp-btn-danger" (click)="removeSubtaskLink(subtask)" title="Remover" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">✖</button>
                </div>
                <div *ngIf="isEditingSubtaskLink(subtask.id)" style="display: flex; gap: 0.5rem;">
                  <input 
                    type="url" 
                    class="bp-input" 
                    [(ngModel)]="tempSubtaskLinks[subtask.id]"
                    placeholder="https://exemplo.com"
                    style="flex: 1; font-size: 0.75rem;"
                  />
                  <button class="bp-btn bp-btn-sm bp-btn-primary" (click)="saveSubtaskLink(subtask)" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">✓</button>
                  <button class="bp-btn bp-btn-sm bp-btn-secondary" (click)="cancelSubtaskLink(subtask.id)" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">✖</button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!task?.subtasks || task.subtasks.length === 0" class="no-subtasks">
            <p>Esta tarefa não possui subtarefas.</p>
          </div>
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
      max-width: 700px;
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
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      color: #1a202c;
    }

    .modal-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
      color: #718096;
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
    }

    .modal-close:hover {
      background: #f7fafc;
      color: #1a202c;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .task-description {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 0.5rem;
    }

    .task-description p {
      margin: 0;
      color: #4a5568;
      font-size: 0.875rem;
    }

    .task-progress {
      margin-bottom: 1.5rem;
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

    .subtasks-list h4 {
      font-size: 1rem;
      margin-bottom: 1rem;
      color: #2d3748;
    }

    .subtask-item {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }

    .subtask-header {
      margin-bottom: 0.75rem;
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
      font-size: 0.75rem;
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

    .no-subtasks {
      text-align: center;
      padding: 3rem 1rem;
      color: #a0aec0;
    }

    .no-subtasks p {
      margin: 0;
    }

    @media (max-width: 768px) {
      .modal-content {
        max-height: 100vh;
        border-radius: 0;
      }
    }
  `]
})
export class TaskDetailModalComponent {
  @Input() projectId: string = '';
  @Input() task: Task | null = null;
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<void>();

  showGemModal = false;
  newGemType: string | null = null;
  showTaskLinkForm = false;
  tempTaskLink = '';
  tempSubtaskLinks: { [key: string]: string } = {};
  editingSubtaskLinks: Set<string> = new Set();

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {}

  private gemUtils = inject(GemUtilsService);

  close() {
    this.closed.emit();
  }

  closeGemModal() {
    this.showGemModal = false;
    this.newGemType = null;
  }

  getCompletedCount(): number {
    if (!this.task?.subtasks) return 0;
    return this.task.subtasks.filter(s => s.completed).length;
  }

  getProgressPercentage(): number {
    if (!this.task?.subtasks || this.task.subtasks.length === 0) return 0;
    return (this.getCompletedCount() / this.task.subtasks.length) * 100;
  }

  async toggleSubtask(subtask: Subtask) {
    if (!this.projectId || !subtask.id) return;

    try {
      const response: any = await this.http.patch(`/api/projects/${this.projectId}/subtasks/${subtask.id}/toggle`, {}).toPromise();
      subtask.completed = !subtask.completed;
      this.toast.success(subtask.completed ? 'Subtarefa concluída!' : 'Subtarefa reaberta');
      
      // Verificar se houve mudança de insígnia
      if (response?.gemChange?.changed && response.gemChange.newGem) {
        this.newGemType = response.gemChange.newGem;
        this.showGemModal = true;
      }
      
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      this.toast.error('Erro ao atualizar subtarefa');
    }
  }

  async saveSubtaskAnswer(subtask: Subtask) {
    if (!this.projectId || !subtask.id) return;

    try {
      await this.http.patch(`/api/projects/${this.projectId}/subtasks/${subtask.id}/answer`, {
        answer: subtask.answer || ''
      }).toPromise();
      this.toast.success('Resposta salva!');
    } catch (err) {
      console.error('Failed to save answer:', err);
      this.toast.error('Erro ao salvar resposta');
    }
  }

  getGemIcon(gemType: string) {
    return this.gemUtils.getGemIcon(gemType, 18);
  }

  // Task Link Methods
  async saveTaskLink() {
    if (!this.projectId || !this.task?.id || !this.tempTaskLink) {
      this.toast.error('Link inválido');
      return;
    }

    if (!this.tempTaskLink.startsWith('http://') && !this.tempTaskLink.startsWith('https://')) {
      this.tempTaskLink = 'https://' + this.tempTaskLink;
    }

    try {
      await this.http.patch(`/api/projects/${this.projectId}/tasks/${this.task.id}/link`, {
        link: this.tempTaskLink
      }).toPromise();
      
      if (this.task) {
        this.task.link = this.tempTaskLink;
      }
      this.tempTaskLink = '';
      this.showTaskLinkForm = false;
      this.toast.success('Link adicionado à tarefa');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to save task link:', err);
      this.toast.error('Erro ao salvar link');
    }
  }

  cancelTaskLink() {
    this.tempTaskLink = '';
    this.showTaskLinkForm = false;
  }

  async removeTaskLink() {
    if (!this.projectId || !this.task?.id) return;

    try {
      await this.http.patch(`/api/projects/${this.projectId}/tasks/${this.task.id}/link`, {
        link: null
      }).toPromise();
      
      if (this.task) {
        this.task.link = undefined;
      }
      this.toast.success('Link removido');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to remove task link:', err);
      this.toast.error('Erro ao remover link');
    }
  }

  // Subtask Link Methods
  isEditingSubtaskLink(subtaskId: string): boolean {
    return this.editingSubtaskLinks.has(subtaskId);
  }

  startEditingSubtaskLink(subtask: Subtask) {
    this.tempSubtaskLinks[subtask.id] = subtask.link || '';
    this.editingSubtaskLinks.add(subtask.id);
  }

  cancelSubtaskLink(subtaskId: string) {
    delete this.tempSubtaskLinks[subtaskId];
    this.editingSubtaskLinks.delete(subtaskId);
  }

  async saveSubtaskLink(subtask: Subtask) {
    if (!this.projectId || !subtask.id) return;

    let link = this.tempSubtaskLinks[subtask.id];
    if (!link) {
      this.toast.error('Link inválido');
      return;
    }

    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      link = 'https://' + link;
    }

    try {
      await this.http.patch(`/api/projects/${this.projectId}/subtasks/${subtask.id}/link`, {
        link: link
      }).toPromise();
      
      subtask.link = link;
      delete this.tempSubtaskLinks[subtask.id];
      this.editingSubtaskLinks.delete(subtask.id);
      this.toast.success('Link adicionado à subtarefa');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to save subtask link:', err);
      this.toast.error('Erro ao salvar link');
    }
  }

  async removeSubtaskLink(subtask: Subtask) {
    if (!this.projectId || !subtask.id) return;

    try {
      await this.http.patch(`/api/projects/${this.projectId}/subtasks/${subtask.id}/link`, {
        link: null
      }).toPromise();
      
      subtask.link = undefined;
      this.toast.success('Link removido');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to remove subtask link:', err);
      this.toast.error('Erro ao remover link');
    }
  }
}
