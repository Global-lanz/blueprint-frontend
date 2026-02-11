import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TemplatesService, Template } from '../../services/templates.service';
import { ProjectsService, Project } from '../../services/projects.service';
import { AuthService, User } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { TaskDetailModalComponent } from '../../components/task-detail-modal.component';
import { ProjectsTableComponent } from '../../components/projects-table.component';
import { HtmlRendererComponent } from '../../components/html-renderer.component';
import { environment } from '../../../environments/environment';

interface Subtask {
  id: string;
  description: string;
  answer?: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  projectId: string;
  projectName: string;
  stageId?: string;
  stageName?: string;
  stageGemType?: string;
  subtasks: Subtask[];
  completed?: boolean;
}

interface ProjectItem {
  id: string;
  name: string;
  templateId: string;
  templateVersion: string;
  progress: number;
  createdAt: string;
  template?: {
    name: string;
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent, TaskDetailModalComponent, ProjectsTableComponent, HtmlRendererComponent],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <app-breadcrumb></app-breadcrumb>
        
        <!-- Hero Section -->
        <div class="bp-text-center bp-mb-2xl">
          <h1>Bem-vindo(a), {{ user()?.name || 'Usuário' }} 👋</h1>
          <p class="bp-text-muted" style="font-size: 1.125rem;">
            Construa seus produtos digitais com confiança usando nossos templates estruturados
          </p>
        </div>

        <!-- My Projects -->
        <div class="bp-card bp-mb-2xl">
          <div class="bp-card-header">
            <div class="bp-flex bp-justify-between bp-items-center">
              <h3 class="bp-card-title">📊 Meus Projetos</h3>
              <div class="bp-flex bp-gap-sm">
                <button routerLink="/templates" class="bp-btn bp-btn-sm bp-btn-primary">
                  ✨ Criar Novo Projeto
                </button>
                <a routerLink="/projects" class="bp-btn bp-btn-sm bp-btn-secondary">Ver Todos</a>
              </div>
            </div>
          </div>

          <div class="bp-loading" *ngIf="loadingProjects()">
            <div class="bp-spinner"></div>
          </div>

          <div class="bp-text-center bp-text-muted" style="padding: 3rem;" *ngIf="!loadingProjects() && projects().length === 0">
            <p style="font-size: 3rem; margin-bottom: 1rem;">📋</p>
            <h4>Nenhum projeto ainda</h4>
            <p>Crie seu primeiro projeto para começar!</p>
            <button routerLink="/templates" class="bp-btn bp-btn-primary bp-mt-lg">
              Criar Novo Projeto
            </button>
          </div>

          <div class="bp-card-body" *ngIf="!loadingProjects() && projects().length > 0">
            <app-projects-table 
              [projects]="projects().slice(0, 5)" 
              [showManageButton]="false"
              [showDeleteButton]="false"
            ></app-projects-table>
          </div>
        </div>

        <!-- Kanban Board -->
        <div class="bp-card bp-mb-2xl">
          <div class="bp-card-header">
            <div class="bp-flex bp-justify-between bp-items-center">
              <h3 class="bp-card-title">📋 Minhas Tarefas</h3>
              <span class="bp-badge bp-badge-primary">{{ tasks().length }} tarefas</span>
            </div>
          </div>
          
          <div class="bp-loading" *ngIf="loadingTasks()">
            <div class="bp-spinner"></div>
          </div>

          <div class="bp-card-body" *ngIf="!loadingTasks()">
            <div *ngIf="tasks().length === 0" class="bp-text-center bp-text-muted" style="padding: 3rem;">
              <p style="font-size: 3rem; margin-bottom: 1rem;">📋</p>
              <h4>Nenhuma tarefa ainda</h4>
              <p>Crie seu primeiro projeto para começar!</p>
              <button routerLink="/templates" class="bp-btn bp-btn-primary bp-mt-lg">
                Explorar Templates
              </button>
            </div>

            <div *ngIf="tasks().length > 0" class="kanban-board">
              <!-- TODO Column -->
              <div class="kanban-column">
                <div class="kanban-header" style="background: #fee; border-color: #fcc; color: #991b1b;">
                  <h4 style="color: #991b1b; text-shadow: none;">🔴 Para Iniciar</h4>
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
                      <span class="bp-badge bp-text-sm" [style.background-color]="getProjectColor(task.projectId)" style="color: white;">{{ task.projectName }}</span>
                      <span class="bp-badge bp-badge-success bp-text-sm" *ngIf="task.stageName">
                        <span *ngIf="task.stageGemType" [innerHTML]="getGemIcon(task.stageGemType)" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                        {{ task.stageName }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- IN_PROGRESS Column -->
              <div class="kanban-column">
                <div class="kanban-header" style="background: #fef3c7; border-color: #fde68a; color: #92400e;">
                  <h4 style="color: #92400e; text-shadow: none;">🟡 Em Progresso</h4>
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
                      <span class="bp-badge bp-text-sm" [style.background-color]="getProjectColor(task.projectId)" style="color: white;">{{ task.projectName }}</span>
                      <span class="bp-badge bp-badge-secondary bp-text-sm" *ngIf="task.stageName">
                        <span *ngIf="task.stageGemType" [innerHTML]="getGemIcon(task.stageGemType)" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                        {{ task.stageName }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- DONE Column -->
              <div class="kanban-column">
                <div class="kanban-header" style="background: #d1fae5; border-color: #a7f3d0; color: #065f46;">
                  <h4 style="color: #065f46; text-shadow: none;">🟢 Finalizadas</h4>
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
                      <span class="bp-badge bp-text-sm" [style.background-color]="getProjectColor(task.projectId)" style="color: white;">{{ task.projectName }}</span>
                      <span class="bp-badge bp-badge-secondary bp-text-sm" *ngIf="task.stageName">
                        <span *ngIf="task.stageGemType" [innerHTML]="getGemIcon(task.stageGemType)" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                        {{ task.stageName }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Task Detail Modal -->
        <app-task-detail-modal
          [projectId]="selectedTask()?.projectId || ''"
          [task]="selectedTask()"
          [isOpen]="isModalOpen()"
          (closed)="closeTaskModal()"
          (taskUpdated)="onTaskUpdated()"
        ></app-task-detail-modal>
      </div>
    </div>
  `,
  styles: [`
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

    @media (max-width: 768px) {
      .kanban-board {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private templatesService = inject(TemplatesService);
  private projectsService = inject(ProjectsService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  templates = signal<Template[]>([]);
  tasks = signal<Task[]>([]);
  projects = signal<ProjectItem[]>([]);
  user = signal<User | null>(null);
  loadingTemplates = signal(false);
  loadingTasks = signal(false);
  loadingProjects = signal(false);
  selectedTask = signal<Task | null>(null);
  isModalOpen = signal(false);

  ngOnInit() {
    this.user.set(this.authService.currentUser());
    this.loadTemplates();
    this.loadTasks();
    this.loadProjects();
  }

  loadTemplates() {
    this.loadingTemplates.set(true);
    this.templatesService.getAll().subscribe({
      next: (data) => {
        // Filtrar apenas templates ativos
        this.templates.set(data.filter(t => t.isActive));
        this.loadingTemplates.set(false);
      },
      error: () => {
        this.loadingTemplates.set(false);
      }
    });
  }

  loadProjects() {
    this.loadingProjects.set(true);
    this.http.get<ProjectItem[]>(`${environment.apiUrl}/projects/my`).subscribe({
      next: (data) => {
        this.projects.set(data || []);
        this.loadingProjects.set(false);
      },
      error: () => {
        this.loadingProjects.set(false);
      }
    });
  }

  loadTasks() {
    this.loadingTasks.set(true);
    this.projectsService.getAll().subscribe({
      next: (projects) => {
        const allTasks: Task[] = [];

        projects.forEach(project => {
          // Tasks from stages
          project.stages?.forEach((stage: any) => {
            stage.tasks?.forEach((task: any) => {
              allTasks.push({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status || 'TODO',
                projectId: project.id,
                projectName: project.name,
                stageId: stage.id,
                stageName: stage.name,
                stageGemType: stage.gemType,
                subtasks: task.subtasks || [],
                completed: task.completed || false
              });
            });
          });

          // Standalone tasks (if any)
          project.tasks?.forEach((task: any) => {
            allTasks.push({
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status || 'TODO',
              projectId: project.id,
              projectName: project.name,
              subtasks: task.subtasks || [],
              completed: task.completed || false
            });
          });
        });

        this.tasks.set(allTasks);
        this.loadingTasks.set(false);
      },
      error: () => {
        this.loadingTasks.set(false);
      }
    });
  }

  getTasksByStatus(status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Task[] {
    return this.tasks().filter(task => task.status === status);
  }

  openTaskModal(task: Task) {
    this.selectedTask.set(task);
    this.isModalOpen.set(true);
  }

  closeTaskModal() {
    this.isModalOpen.set(false);
    this.selectedTask.set(null);
  }

  onTaskUpdated() {
    // Recarregar tasks quando uma subtarefa for alterada no modal
    this.loadTasks();
  }

  getProjectColor(projectId: string): string {
    // Generate a unique color based on project ID
    const colors = [
      '#6366F1', // Indigo
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#06B6D4', // Cyan
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#84CC16', // Lime
      '#F97316'  // Orange
    ];

    // Generate a hash from the project ID
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  getGemIcon(gemType: string): SafeHtml {
    const colors: { [key: string]: { fill: string; shine: string } } = {
      'ESMERALDA': { fill: '#10B981', shine: '#34D399' },
      'RUBI': { fill: '#EF4444', shine: '#F87171' },
      'SAFIRA': { fill: '#3B82F6', shine: '#60A5FA' },
      'DIAMANTE': { fill: '#E5E7EB', shine: '#F9FAFB' }
    };
    const color = colors[gemType] || colors['DIAMANTE'];
    const svg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="${color.fill}" stroke="#1a202c" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 2L21 9L12 12L3 9L12 2Z" fill="${color.shine}" opacity="0.6"/>
      <line x1="3" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
      <line x1="21" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
    </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
