import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
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
  order?: number;
  completed: boolean;
  subtasks: Subtask[];
  link?: string;
  status?: string;
}

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="task-card">
      <div class="task-header" *ngIf="showHeader">
        <div class="task-title-row">
          <span class="task-number" *ngIf="taskNumber">{{ taskNumber }}</span>
          <h5 [class.completed]="task.completed">{{ task.title }}</h5>
        </div>
        <span class="task-progress-badge" [class.completed]="task.completed" *ngIf="showProgress">
          {{ task.completed ? '✓ Concluída' : getTaskProgress() }}
        </span>
      </div>

      <p class="task-description" *ngIf="task.description">
        {{ task.description }}
      </p>

      <!-- Task Link -->
      <div class="task-link-section" style="margin-bottom: 1rem;">
        <div *ngIf="!task.link && !editingTaskLink">
          <button class="bp-btn bp-btn-sm bp-btn-secondary" (click)="startEditingTaskLink()" style="font-size: 0.8rem;">
            🔗 Adicionar Link à Tarefa
          </button>
        </div>
        <div *ngIf="task.link && !editingTaskLink" style="display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem; background: #f7fafc; border-radius: 0.375rem;">
          <span style="font-size: 0.875rem; color: #4a5568;">🔗</span>
          <a [href]="task.link" target="_blank" style="flex: 1; color: #3182ce; text-decoration: none; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ task.link }}</a>
          <button class="bp-btn bp-btn-sm bp-btn-danger" (click)="removeTaskLink()" title="Remover" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">✖</button>
        </div>
        <div *ngIf="editingTaskLink" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <input 
            type="url" 
            class="bp-input" 
            [(ngModel)]="tempTaskLink"
            placeholder="https://exemplo.com"
            style="flex: 1; font-size: 0.875rem;"
          />
          <button class="bp-btn bp-btn-sm bp-btn-primary" (click)="saveTaskLink()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">✓</button>
          <button class="bp-btn bp-btn-sm bp-btn-secondary" (click)="cancelTaskLink()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">✖</button>
        </div>
      </div>

      <!-- Subtasks -->
      <div class="subtasks-section" *ngIf="task.subtasks && task.subtasks.length > 0">
        <div *ngFor="let subtask of task.subtasks" class="subtask-item">
          <div class="subtask-header">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                [checked]="subtask.completed"
                (change)="onToggleSubtask(subtask)"
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
              (blur)="onSubtaskAnswerChange(subtask)"
              placeholder="Digite sua resposta aqui..."
              rows="2"
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
              <a [href]="subtask.link" target="_blank" style="flex: 1; color: #3182ce; text-decoration: none; font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ subtask.link }}</a>
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
    </div>
  `,
  styles: [`
    .task-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.75rem;
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
      border-radius: 50%;
      width: 1.75rem;
      height: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .task-title-row h5 {
      margin: 0;
      font-size: 1rem;
      color: #1a202c;
      font-weight: 600;
    }

    .task-title-row h5.completed {
      text-decoration: line-through;
      color: #a0aec0;
    }

    .task-progress-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      background: #edf2f7;
      color: #4a5568;
      border-radius: 1rem;
      white-space: nowrap;
    }

    .task-progress-badge.completed {
      background: #c6f6d5;
      color: #22543d;
    }

    .task-description {
      font-size: 0.875rem;
      color: #4a5568;
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }

    .subtasks-section {
      margin-top: 0.75rem;
    }

    .subtask-item {
      padding: 0.75rem;
      background: #f7fafc;
      border-radius: 0.375rem;
      margin-bottom: 0.75rem;
    }

    .subtask-item:last-child {
      margin-bottom: 0;
    }

    .subtask-header {
      margin-bottom: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: start;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-input {
      margin-top: 0.125rem;
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .checkbox-label span {
      color: #2d3748;
      font-weight: 500;
      font-size: 0.875rem;
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

    .subtask-link-section {
      padding-left: 1.5rem;
    }
  `]
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() projectId!: string;
  @Input() showHeader = true;
  @Input() showProgress = true;
  @Input() taskNumber?: number;
  @Output() taskUpdated = new EventEmitter<void>();

  private http = inject(HttpClient);
  private toast = inject(ToastService);

  editingTaskLink = false;
  tempTaskLink = '';
  editingSubtaskLinks = new Set<string>();
  tempSubtaskLinks: { [subtaskId: string]: string } = {};

  getTaskProgress(): string {
    if (!this.task.subtasks || this.task.subtasks.length === 0) return 'Sem subtarefas';
    const completed = this.task.subtasks.filter(s => s.completed).length;
    return `${completed}/${this.task.subtasks.length} subtarefas`;
  }

  // Task link methods
  startEditingTaskLink() {
    this.tempTaskLink = this.task.link || '';
    this.editingTaskLink = true;
  }

  cancelTaskLink() {
    this.editingTaskLink = false;
    this.tempTaskLink = '';
  }

  async saveTaskLink() {
    const link = this.tempTaskLink?.trim();
    if (!link) {
      this.toast.error('Digite um link válido');
      return;
    }

    try {
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/tasks/${this.task.id}/link`, { link }).toPromise();
      this.task.link = link;
      this.editingTaskLink = false;
      this.tempTaskLink = '';
      this.toast.success('Link da tarefa salvo!');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to save task link:', err);
      this.toast.error('Erro ao salvar link da tarefa');
    }
  }

  async removeTaskLink() {
    try {
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/tasks/${this.task.id}/link`, { link: null }).toPromise();
      this.task.link = undefined;
      this.toast.success('Link da tarefa removido!');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to remove task link:', err);
      this.toast.error('Erro ao remover link da tarefa');
    }
  }

  // Subtask methods
  async onToggleSubtask(subtask: Subtask) {
    try {
      const response: any = await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/toggle`, {}).toPromise();
      subtask.completed = !subtask.completed;
      this.toast.success(subtask.completed ? 'Subtarefa concluída!' : 'Subtarefa reaberta');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      this.toast.error('Erro ao atualizar subtarefa');
    }
  }

  async onSubtaskAnswerChange(subtask: Subtask) {
    try {
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/answer`, {
        answer: subtask.answer || ''
      }).toPromise();
    } catch (err) {
      console.error('Failed to save subtask answer:', err);
    }
  }

  // Subtask link methods
  isEditingSubtaskLink(subtaskId: string): boolean {
    return this.editingSubtaskLinks.has(subtaskId);
  }

  startEditingSubtaskLink(subtask: Subtask) {
    this.tempSubtaskLinks[subtask.id] = subtask.link || '';
    this.editingSubtaskLinks.add(subtask.id);
  }

  cancelSubtaskLink(subtaskId: string) {
    this.editingSubtaskLinks.delete(subtaskId);
    delete this.tempSubtaskLinks[subtaskId];
  }

  async saveSubtaskLink(subtask: Subtask) {
    const link = this.tempSubtaskLinks[subtask.id]?.trim();
    if (!link) {
      this.toast.error('Digite um link válido');
      return;
    }

    try {
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/link`, { link }).toPromise();
      subtask.link = link;
      this.editingSubtaskLinks.delete(subtask.id);
      delete this.tempSubtaskLinks[subtask.id];
      this.toast.success('Link da subtarefa salvo!');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to save subtask link:', err);
      this.toast.error('Erro ao salvar link da subtarefa');
    }
  }

  async removeSubtaskLink(subtask: Subtask) {
    try {
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/link`, { link: null }).toPromise();
      subtask.link = undefined;
      this.toast.success('Link da subtarefa removido!');
      this.taskUpdated.emit();
    } catch (err) {
      console.error('Failed to remove subtask link:', err);
      this.toast.error('Erro ao remover link da subtarefa');
    }
  }
}
