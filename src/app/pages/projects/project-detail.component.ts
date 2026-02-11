import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { TaskDetailModalComponent } from '../../components/task-detail-modal.component';
import { StageDetailModalComponent } from '../../components/stage-detail-modal.component';
import { GemUtilsService } from '../../services/gem-utils.service';
import { HtmlRendererComponent } from '../../components/html-renderer.component';
import { environment } from '../../../environments/environment';

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
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  subtasks: Subtask[];
  stageId?: string;
  stageName?: string;
  stageGemType?: string;
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

interface Project {
  id: string;
  name: string;
  templateVersion: string;
  progress: number;
  projectStages: Stage[];
  projectTasks: Task[];
  currentGem?: string;
  status?: string;
  price?: string;
  currency?: string;
  saleStartDate?: string;
  links?: { [key: string]: string };
  template: {
    name: string;
    version: string;
    description: string;
  };
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, TaskDetailModalComponent, StageDetailModalComponent, HtmlRendererComponent],
  styles: [`
    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }

    .detail-value {
      padding: 0.5rem;
      border-radius: 6px;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .detail-value:hover {
      border-color: #e5e7eb;
      background: #f9fafb;
    }

    .links-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .link-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f9fafb;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      font-size: 0.875rem;
    }

    .link-name {
      font-weight: 600;
      color: #374151;
      min-width: 100px;
    }

    .link-url {
      flex: 1;
      color: #3b82f6;
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .link-url:hover {
      text-decoration: underline;
    }

    .add-link-form {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem;
      background: #f0f9ff;
      border-radius: 4px;
      border: 2px dashed #3b82f6;
    }

    .kanban-board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      min-height: 400px;
    }

    .kanban-column {
      background: #f9fafb;
      border-radius: 8px;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .kanban-header {
      padding: 1rem;
      border-bottom: 2px solid;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kanban-header h4 {
      margin: 0;
      font-size: 1rem;
    }

    .kanban-tasks {
      padding: 1rem;
      flex: 1;
      overflow-y: auto;
      max-height: 600px;
    }

    .kanban-task {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s;
    }

    .kanban-task:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .kanban-task.task-done {
      opacity: 0.7;
    }

    .kanban-task.task-done .kanban-task-title {
      text-decoration: line-through;
    }

    .kanban-task-title {
      margin: 0 0 0.5rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--bp-gray-900);
    }

    .kanban-task-description {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      color: var(--bp-gray-600);
      line-height: 1.4;
    }

    .kanban-task-footer {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .stages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .stage-button {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      position: relative;
      overflow: hidden;
    }

    .stage-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--bp-primary) 0%, var(--bp-primary-light) 100%);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }

    .stage-button:hover {
      border-color: var(--bp-primary);
      box-shadow: 0 4px 12px rgba(14, 59, 51, 0.15);
      transform: translateY(-2px);
    }

    .stage-button:hover::before {
      transform: scaleX(1);
    }

    .stage-button-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    .stage-gem-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }

    .stage-button-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #1a202c;
      flex: 1;
    }

    .stage-button-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
    }

    .stage-button-badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      background: #6B46C1;
      color: white;
      border-radius: 0.25rem;
      font-weight: 600;
    }

    .stage-gem-badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      background: #4299E1;
      color: white;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .stage-button-stats {
      display: flex;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: #718096;
    }

    .stage-stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .stage-progress-bar {
      margin-top: 0.4rem;
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      overflow: hidden;
    }

    .stage-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--bp-primary) 0%, var(--bp-primary-light) 100%);
      transition: width 0.3s ease;
      border-radius: 3px;
    }

    @media (max-width: 768px) {
      .kanban-board {
        grid-template-columns: 1fr;
      }

      .stages-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <app-breadcrumb></app-breadcrumb>
        
        <div class="bp-loading" *ngIf="loading()">
          <div class="bp-spinner"></div>
        </div>

        <div *ngIf="!loading() && project()">
          <!-- Fixed Save/Cancel Buttons -->
          <div *ngIf="hasUnsavedChanges" style="position: fixed; top: 80px; right: 2rem; z-index: 999; display: flex; gap: 0.5rem; background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <button class="bp-btn bp-btn-primary" (click)="saveAllChanges()">
              💾 Salvar Alterações
            </button>
            <button class="bp-btn bp-btn-secondary" (click)="cancelAllChanges()">
              ✖️ Cancelar
            </button>
          </div>

          <div class="bp-flex bp-justify-between bp-items-center bp-mb-2xl">
            <div style="flex: 1;">
              <div class="project-name-section" (click)="startEditingField('name')">
                <h1 style="cursor: pointer; margin: 0;">
                  <span *ngIf="!editingName">{{ formData.name }}</span>
                  <input 
                    *ngIf="editingName"
                    type="text" 
                    class="bp-input" 
                    [(ngModel)]="formData.name"
                    (blur)="stopEditingField('name')"
                    (input)="markAsChanged()"
                    style="font-size: 2rem; font-weight: bold; padding: 0.25rem; border: 2px solid #667eea;"
                    (keyup.enter)="stopEditingField('name')"
                  />
                </h1>
              </div>
              <div class="description-content">
              <app-html-renderer [content]="project()?.template?.description || ''"></app-html-renderer>
            </div>
              <p class="bp-text-muted">
                Baseado em: {{ project()!.template.name }}
              </p>
            </div>
            <button class="bp-btn bp-btn-secondary" (click)="goBack()">
              ← Voltar
            </button>
          </div>

          <!-- Project Details -->
          <div class="bp-card bp-mb-lg">
            <div class="bp-card-body" style="padding: 1rem;">
              <h4 style="margin-bottom: 1rem; font-size: 1.1rem;">📊 Detalhes do Projeto</h4>

              <!-- Progress Bar -->
              <div style="margin-bottom: 1rem;">
                <div class="bp-flex bp-justify-between bp-items-center" style="margin-bottom: 0.5rem;">
                  <strong style="font-size: 0.9rem;">Progresso</strong>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span *ngIf="getCurrentGem()" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.7rem; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 15px; border: 2px solid #e2e8f0;">
                      <span [innerHTML]="getGemIcon(getCurrentGem()!.gemType)" style="display: inline-flex;"></span>
                      <span style="font-weight: 600; color: #2d3748; font-size: 0.8rem;">Você é {{ getCurrentGem()!.name }}</span>
                    </span>
                    <span class="bp-badge bp-badge-primary" style="font-size: 0.85rem;">{{ project()!.progress.toFixed(0) }}%</span>
                  </div>
                </div>
                <div class="bp-progress" style="height: 16px;">
                  <div 
                    class="bp-progress-bar" 
                    [style.width]="project()!.progress + '%'"
                  ></div>
                </div>
              </div>

              <div class="details-grid">
                <!-- Price -->
                <div class="detail-item">
                  <label class="detail-label">💰 Preço</label>
                  <div style="cursor: pointer;">
                    <div *ngIf="!editingPrice" class="detail-value" (click)="startEditingField('price')" style="font-size: 0.875rem;">
                      <span *ngIf="formData.price">
                        {{ getCurrencySymbol(formData.currency) }} {{ formData.price }}
                      </span>
                      <span *ngIf="!formData.price" class="bp-text-muted" style="font-size: 0.8rem;">Clique para definir</span>
                    </div>
                    <div *ngIf="editingPrice" style="display: flex; gap: 0.25rem; align-items: center;">
                      <select class="bp-input" [(ngModel)]="formData.currency" (change)="markAsChanged()" style="max-width: 70px; font-size: 0.8rem; padding: 0.25rem;">
                        <option *ngFor="let curr of currencies" [value]="curr.code">{{ curr.symbol }}</option>
                      </select>
                      <input 
                        #priceInput
                        type="text" 
                        class="bp-input" 
                        [(ngModel)]="formData.price"
                        (input)="markAsChanged()"
                        (keyup.enter)="stopEditingField('price')"
                        (keyup.escape)="cancelEditingField('price')"
                        placeholder="0.00"
                        style="flex: 1; font-size: 0.8rem; padding: 0.25rem;"
                      />
                      <button class="bp-btn bp-btn-sm bp-btn-primary" (click)="stopEditingField('price')" title="Confirmar" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        ✓
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Sale Start Date -->
                <div class="detail-item">
                  <label class="detail-label">📅 Data de Início de Venda</label>
                  <div (click)="startEditingField('saleDate')" style="cursor: pointer;">
                    <div *ngIf="!editingSaleDate" class="detail-value" style="font-size: 0.875rem;">
                      <span *ngIf="formData.saleStartDate">{{ formatDate(formData.saleStartDate) }}</span>
                      <span *ngIf="!formData.saleStartDate" class="bp-text-muted" style="font-size: 0.8rem;">Clique para definir</span>
                    </div>
                    <input 
                      *ngIf="editingSaleDate"
                      type="date" 
                      class="bp-input" 
                      [(ngModel)]="formData.saleStartDate"
                      (blur)="stopEditingField('saleDate')"
                      (change)="markAsChanged()"
                      style="border: 2px solid #667eea; font-size: 0.8rem; padding: 0.25rem;"
                    />
                  </div>
                </div>

                <!-- Status -->
                <div class="detail-item">
                  <label class="detail-label">📍 Status</label>
                  <div style="cursor: pointer;">
                    <select 
                      class="bp-input" 
                      [(ngModel)]="formData.status" 
                      (change)="markAsChanged()"
                      [style.borderLeft]="'4px solid ' + getStatusColor(formData.status)"
                      style="font-size: 0.8rem; padding: 0.25rem;"
                    >
                      <option *ngFor="let status of statuses" [value]="status.value">
                        {{ status.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Links -->
                <div class="detail-item" style="grid-column: 1 / -1;">
                  <label class="detail-label">🔗 Links Úteis</label>
                  <div class="links-container">
                    <div *ngFor="let link of getLinksArray()" class="link-item">
                      <span class="link-name">{{ link.name }}:</span>
                      <a [href]="link.url" target="_blank" class="link-url">{{ link.url }}</a>
                      <button class="bp-btn bp-btn-sm bp-btn-danger" (click)="removeLink(link.name)" title="Remover" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        ✖️
                      </button>
                    </div>
                    <div *ngIf="getLinksArray().length === 0 && !showAddLinkForm" class="bp-text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">
                      Nenhum link adicionado
                    </div>
                    <button 
                      *ngIf="!showAddLinkForm" 
                      class="bp-btn bp-btn-primary bp-btn-sm" 
                      (click)="showAddLinkForm = true"
                      style="margin-top: 0.5rem; align-self: flex-start; padding: 0.4rem 0.8rem; font-size: 0.85rem;"
                    >
                      + Adicionar Link
                    </button>
                    <div *ngIf="showAddLinkForm" class="add-link-form">
                      <input 
                        type="text" 
                        class="bp-input" 
                        [(ngModel)]="newLinkName"
                        placeholder="Nome (ex: Hotmart)"
                        style="flex: 1; font-size: 0.85rem; padding: 0.4rem;"
                      />
                      <input 
                        type="url" 
                        class="bp-input" 
                        [(ngModel)]="newLinkUrl"
                        placeholder="URL (ex: https://hotmart.com/...)"
                        style="flex: 2; font-size: 0.85rem; padding: 0.4rem;"
                      />
                      <button class="bp-btn bp-btn-primary bp-btn-sm" (click)="addLink()" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;">
                        ✓
                      </button>
                      <button class="bp-btn bp-btn-secondary bp-btn-sm" (click)="cancelAddLink()" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;">
                        ✖
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stages Buttons -->
          <div class="bp-card bp-mb-lg">
            <div class="bp-card-header">
              <div class="bp-flex bp-justify-between bp-items-center">
                <h3 class="bp-card-title">🎯 Etapas do Projeto</h3>
                <span class="bp-badge bp-badge-primary">{{ project()!.projectStages.length }} etapas</span>
              </div>
            </div>
            <div class="bp-card-body">
              <div class="stages-grid">
                <button 
                  *ngFor="let stage of project()!.projectStages" 
                  class="stage-button"
                  (click)="openStageModal(stage)"
                >
                  <div class="stage-button-header">
                    <span class="stage-gem-icon" *ngIf="stage.gemType" [innerHTML]="getGemIcon(stage.gemType)"></span>
                    <h4 class="stage-button-title" style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                      {{ stage.name }}
                    </h4>  </div>
                  <div class="stage-button-stats">
                    <span class="stage-stat">
                      📝 {{ stage.tasks.length }} tarefa{{ stage.tasks.length !== 1 ? 's' : '' }}
                    </span>
                    <span class="stage-stat">
                      ✓ {{ getCompletedTasksInStage(stage) }} concluída{{ getCompletedTasksInStage(stage) !== 1 ? 's' : '' }}
                    </span>
                  </div>
                  <div class="stage-progress-bar">
                    <div class="stage-progress-fill" [style.width]="getStageProgress(stage) + '%'"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Minhas Tarefas -->
          <div class="bp-card bp-mb-lg">
            <div class="bp-card-header">
              <div class="bp-flex bp-justify-between bp-items-center">
                <h3 class="bp-card-title">📋 Minhas Tarefas</h3>
                <span class="bp-badge bp-badge-primary">{{ getAllTasks().length }} tarefas</span>
              </div>
            </div>
            <div class="bp-card-body">
              <div class="kanban-board">
                <!-- TODO Column -->
                <div class="kanban-column">
                  <div class="kanban-header" style="background: #fee; border-color: #fcc;">
                    <h4>🔴 Para Iniciar</h4>
                    <span class="bp-badge bp-badge-secondary">{{ getTasksByStatus('TODO').length }}</span>
                  </div>
                  <div class="kanban-tasks">
                    <div 
                      *ngFor="let task of getTasksByStatus('TODO')" 
                      class="kanban-task"
                      (click)="openTaskModal(task)"
                    >
                      <h5 class="kanban-task-title">{{ task.title }}</h5>

                      <div class="kanban-task-footer">
                        <span class="bp-badge bp-badge-secondary bp-text-sm" *ngIf="task.stageName">
                          <span *ngIf="task.stageGemType" [innerHTML]="getGemIcon(task.stageGemType)" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                          {{ task.stageName }}
                        </span>
                        <span class="bp-badge bp-badge-info bp-text-sm">
                          {{ getCompletedSubtasksCount(task) }}/{{ task.subtasks.length }}
                        </span>
                      </div>
                    </div>
                    <p *ngIf="getTasksByStatus('TODO').length === 0" class="bp-text-muted bp-text-center" style="padding: 2rem;">
                      Nenhuma tarefa
                    </p>
                  </div>
                </div>

                <!-- IN_PROGRESS Column -->
                <div class="kanban-column">
                  <div class="kanban-header" style="background: #fef3c7; border-color: #fde68a;">
                    <h4>🟡 Em Progresso</h4>
                    <span class="bp-badge bp-badge-secondary">{{ getTasksByStatus('IN_PROGRESS').length }}</span>
                  </div>
                  <div class="kanban-tasks">
                    <div 
                      *ngFor="let task of getTasksByStatus('IN_PROGRESS')" 
                      class="kanban-task"
                      (click)="openTaskModal(task)"
                    >
                      <h5 class="kanban-task-title">{{ task.title }}</h5>

                      <div class="kanban-task-footer">
                        <span class="bp-badge bp-badge-secondary bp-text-sm" *ngIf="task.stageName">
                          <span *ngIf="task.stageGemType" [innerHTML]="getGemIcon(task.stageGemType)" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                          {{ task.stageName }}
                        </span>
                        <span class="bp-badge bp-badge-info bp-text-sm">
                          {{ getCompletedSubtasksCount(task) }}/{{ task.subtasks.length }}
                        </span>
                      </div>
                    </div>
                    <p *ngIf="getTasksByStatus('IN_PROGRESS').length === 0" class="bp-text-muted bp-text-center" style="padding: 2rem;">
                      Nenhuma tarefa
                    </p>
                  </div>
                </div>

                <!-- DONE Column -->
                <div class="kanban-column">
                  <div class="kanban-header" style="background: #d1fae5; border-color: #a7f3d0;">
                    <h4>🟢 Finalizadas</h4>
                    <span class="bp-badge bp-badge-secondary">{{ getTasksByStatus('DONE').length }}</span>
                  </div>
                  <div class="kanban-tasks">
                    <div 
                      *ngFor="let task of getTasksByStatus('DONE')" 
                      class="kanban-task task-done"
                      (click)="openTaskModal(task)"
                    >
                      <h5 class="kanban-task-title">{{ task.title }}</h5>

                      <div class="kanban-task-footer">
                        <span class="bp-badge bp-badge-secondary bp-text-sm" *ngIf="task.stageName">
                          <span *ngIf="task.stageGemType" [innerHTML]="getGemIcon(task.stageGemType)" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                          {{ task.stageName }}
                        </span>
                        <span class="bp-badge bp-badge-success bp-text-sm">
                          {{ getCompletedSubtasksCount(task) }}/{{ task.subtasks.length }}
                        </span>
                      </div>
                    </div>
                    <p *ngIf="getTasksByStatus('DONE').length === 0" class="bp-text-muted bp-text-center" style="padding: 2rem;">
                      Nenhuma tarefa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Task Detail Modal -->
        <app-task-detail-modal
          [projectId]="projectId"
          [task]="selectedTask()"
          [isOpen]="isTaskModalOpen()"
          (closed)="closeTaskModal()"
          (taskUpdated)="onTaskUpdated()"
        ></app-task-detail-modal>

        <!-- Stage Detail Modal -->
        <app-stage-detail-modal
          [projectId]="projectId"
          [stage]="selectedStage()"
          [isOpen]="isStageModalOpen()"
          (closed)="closeStageModal()"
          (stageUpdated)="onStageUpdated()"
        ></app-stage-detail-modal>
      </div>
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private gemUtils = inject(GemUtilsService);

  projectId: string = '';
  project = signal<Project | null>(null);
  loading = signal(true);
  selectedTask = signal<Task | null>(null);
  selectedStage = signal<Stage | null>(null);
  isTaskModalOpen = signal(false);
  isStageModalOpen = signal(false);

  // Editing state
  editingName = false;
  editingPrice = false;
  editingSaleDate = false;
  editingLinks = false;
  hasUnsavedChanges = false;
  showAddLinkForm = false;

  // Form data
  formData = {
    name: '',
    status: 'ATIVO',
    price: '',
    currency: 'BRL',
    saleStartDate: '',
    links: {} as { [key: string]: string }
  };

  newLinkName = '';
  newLinkUrl = '';

  currencies = [
    { code: 'BRL', symbol: 'R$', name: 'Real' },
    { code: 'USD', symbol: '$', name: 'Dólar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'Libra' }
  ];

  statuses = [
    { value: 'ATIVO', label: 'Ativo', color: '#10B981' },
    { value: 'INATIVO', label: 'Inativo', color: '#EF4444' }
  ];

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
      this.initializeFormData(data);
    } catch (err) {
      console.error('Failed to load project:', err);
      this.toast.error('Erro ao carregar projeto');
      this.router.navigate(['/projects']);
    } finally {
      this.loading.set(false);
    }
  }

  initializeFormData(project: Project | undefined) {
    if (!project) return;
    this.formData = {
      name: project.name || '',
      status: project.status || 'ATIVO',
      price: project.price || '',
      currency: project.currency || 'BRL',
      saleStartDate: project.saleStartDate || '',
      links: project.links || {}
    };
  }

  startEditingField(field: string) {
    if (field === 'name') this.editingName = true;
    if (field === 'price') this.editingPrice = true;
    if (field === 'saleDate') this.editingSaleDate = true;

    setTimeout(() => {
      if (field === 'price') {
        const priceInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
        if (priceInput) priceInput.focus();
      } else {
        const input = document.querySelector(`input:not([type="checkbox"]):focus, input:not([type="checkbox"])[type="text"], input:not([type="checkbox"])[type="date"], input:not([type="checkbox"])[type="url"]`) as HTMLInputElement;
        if (input) input.focus();
      }
    }, 0);
  }

  stopEditingField(field: string) {
    if (field === 'name') this.editingName = false;
    if (field === 'price') this.editingPrice = false;
    if (field === 'saleDate') this.editingSaleDate = false;
  }

  cancelEditingField(field: string) {
    // Restaurar valor original
    const project = this.project();
    if (!project) return;

    if (field === 'name') {
      this.formData.name = project.name;
      this.editingName = false;
    }
    if (field === 'price') {
      this.formData.price = project.price || '';
      this.formData.currency = project.currency || 'BRL';
      this.editingPrice = false;
    }
    if (field === 'saleDate') {
      this.formData.saleStartDate = project.saleStartDate || '';
      this.editingSaleDate = false;
    }
  }

  markAsChanged() {
    this.hasUnsavedChanges = true;
  }

  async saveAllChanges() {
    try {
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/details`, {
        name: this.formData.name,
        status: this.formData.status,
        price: this.formData.price || null,
        currency: this.formData.currency,
        saleStartDate: this.formData.saleStartDate || null,
        links: this.formData.links
      }).toPromise();

      // Atualizar o projeto
      const currentProject = this.project();
      if (currentProject) {
        this.project.set({
          ...currentProject,
          name: this.formData.name,
          status: this.formData.status,
          price: this.formData.price,
          currency: this.formData.currency,
          saleStartDate: this.formData.saleStartDate,
          links: this.formData.links
        });
      }

      this.hasUnsavedChanges = false;
      this.toast.success('Alterações salvas com sucesso!');
    } catch (err) {
      console.error('Failed to save changes:', err);
      this.toast.error('Erro ao salvar alterações');
    }
  }

  cancelAllChanges() {
    this.initializeFormData(this.project() || undefined);
    this.hasUnsavedChanges = false;
    this.editingName = false;
    this.editingPrice = false;
    this.editingSaleDate = false;
    this.toast.info('Alterações canceladas');
  }

  getCurrencySymbol(code: string): string {
    const currency = this.currencies.find(c => c.code === code);
    return currency?.symbol || code;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  getLinksArray(): { name: string; url: string }[] {
    if (!this.formData.links) return [];
    return Object.entries(this.formData.links).map(([name, url]) => ({ name, url }));
  }

  addLink() {
    if (!this.newLinkName || !this.newLinkUrl) {
      this.toast.error('Preencha o nome e a URL do link');
      return;
    }

    if (!this.newLinkUrl.startsWith('http://') && !this.newLinkUrl.startsWith('https://')) {
      this.newLinkUrl = 'https://' + this.newLinkUrl;
    }

    this.formData.links[this.newLinkName] = this.newLinkUrl;
    this.newLinkName = '';
    this.newLinkUrl = '';
    this.showAddLinkForm = false;
    this.markAsChanged();
    this.toast.success('Link adicionado');
  }

  cancelAddLink() {
    this.newLinkName = '';
    this.newLinkUrl = '';
    this.showAddLinkForm = false;
  }

  getStatusColor(status: string): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj?.color || '#6B7280';
  }

  removeLink(name: string) {
    delete this.formData.links[name];
    this.markAsChanged();
    this.toast.success('Link removido');
  }

  async toggleTask(task: Task) {
    try {
      const newState = !task.completed;
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/tasks/${task.id}/toggle`, {}).toPromise();
      task.completed = newState;

      // Update progress
      this.updateProgress();
      this.toast.success(newState ? 'Tarefa concluída!' : 'Tarefa reaberta');
    } catch (err) {
      console.error('Failed to toggle task:', err);
      this.toast.error('Erro ao atualizar tarefa');
    }
  }

  async toggleSubtask(subtask: Subtask) {
    try {
      const newState = !subtask.completed;
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/toggle`, {}).toPromise();
      subtask.completed = newState;

      // Recarregar projeto para atualizar status das tasks
      await this.loadProject(this.projectId);
      this.toast.success(newState ? 'Subtarefa concluída!' : 'Subtarefa reaberta');
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      this.toast.error('Erro ao atualizar subtarefa');
    }
  }

  async saveSubtaskAnswer(subtask: Subtask) {
    try {
      await this.http.patch(`${environment.apiUrl}/projects/${this.projectId}/subtasks/${subtask.id}/answer`, {
        answer: subtask.answer || ''
      }).toPromise();
      this.toast.success('Resposta salva!');
    } catch (err) {
      console.error('Failed to save answer:', err);
      this.toast.error('Erro ao salvar resposta');
    }
  }

  getTaskProgress(task: Task): string {
    if (!task.subtasks || task.subtasks.length === 0) return 'Sem subtarefas';
    const completed = task.subtasks.filter(s => s.completed).length;
    return `${completed}/${task.subtasks.length} subtarefas`;
  }

  getStageProgress(stage: Stage): number {
    if (!stage.tasks || stage.tasks.length === 0) return 0;

    // Contar todas as subtarefas da stage
    const allSubtasks = stage.tasks.flatMap(t => t.subtasks || []);
    if (allSubtasks.length === 0) return 0;

    const completed = allSubtasks.filter(s => s.completed).length;
    return Math.round((completed / allSubtasks.length) * 100);
  }

  updateProgress() {
    const proj = this.project();
    if (!proj) return;

    let totalSubtasks = 0;
    let completedSubtasks = 0;

    // Count subtasks in stages
    for (const stage of proj.projectStages) {
      for (const task of stage.tasks) {
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter(s => s.completed).length;
      }
    }

    // Count subtasks without stages
    for (const task of proj.projectTasks) {
      totalSubtasks += task.subtasks.length;
      completedSubtasks += task.subtasks.filter(s => s.completed).length;
    }

    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
    proj.progress = progress;
    this.project.set({ ...proj });
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  getGemIcon(gemType: string) {
    return this.gemUtils.getGemIcon(gemType, 28);
  }

  getGemName(gemType: string): string {
    return this.gemUtils.getGemName(gemType);
  }

  getCompletedTasksInStage(stage: Stage): number {
    return stage.tasks.filter(t => t.completed).length;
  }

  openStageModal(stage: Stage) {
    this.selectedStage.set(stage);
    this.isStageModalOpen.set(true);
  }

  closeStageModal() {
    this.isStageModalOpen.set(false);
    this.selectedStage.set(null);
  }

  onStageUpdated() {
    this.loadProject(this.projectId);
  }

  getAllTasks(): Task[] {
    const proj = this.project();
    if (!proj) return [];

    const allTasks: Task[] = [];

    // Tasks from stages
    proj.projectStages.forEach(stage => {
      stage.tasks.forEach(task => {
        allTasks.push({
          ...task,
          status: task.status || 'TODO',
          stageId: stage.id,
          stageName: stage.name,
          stageGemType: stage.gemType
        });
      });
    });

    // Standalone tasks (if any)
    proj.projectTasks.forEach(task => {
      allTasks.push({
        ...task,
        status: task.status || 'TODO'
      });
    });

    return allTasks;
  }

  getTasksByStatus(status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Task[] {
    return this.getAllTasks().filter(task => (task.status || 'TODO') === status);
  }

  getCompletedSubtasksCount(task: Task): number {
    return task.subtasks.filter(s => s.completed).length;
  }

  openTaskModal(task: Task) {
    this.selectedTask.set(task);
    this.isTaskModalOpen.set(true);
  }

  closeTaskModal() {
    this.isTaskModalOpen.set(false);
    this.selectedTask.set(null);
  }

  onTaskUpdated() {
    // Recarregar projeto quando uma subtarefa for alterada no modal
    this.loadProject(this.projectId);
  }

  getCurrentGem(): { gemType: string; name: string } | null {
    const proj = this.project();
    if (!proj || !proj.currentGem) {
      return null;
    }

    return {
      gemType: proj.currentGem,
      name: this.getGemName(proj.currentGem)
    };
  }
}
