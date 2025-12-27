import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';

interface Subtask {
  id: string;
  description: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
}

interface Stage {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: Task[];
}

interface Template {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  stages: Stage[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <app-breadcrumb></app-breadcrumb>
        
        <div class="bp-loading" *ngIf="loading()">
          <div class="bp-spinner"></div>
        </div>

        <div *ngIf="!loading() && template()">
          <!-- Header -->
          <div class="bp-flex bp-justify-between bp-items-start bp-mb-2xl">
            <div>
              <div class="bp-flex bp-items-center bp-gap-md bp-mb-md">
                <h1 style="margin: 0;">` + '{{ template()!.name }}' + `</h1>
                <span class="bp-badge" [class.bp-badge-success]="template()!.isActive" [class.bp-badge-warning]="!template()!.isActive">
                  ` + '{{ template()!.isActive ? "Ativo" : "Inativo" }}' + `
                </span>
              </div>
              <p class="bp-text-muted" *ngIf="template()!.description">` + '{{ template()!.description }}' + `</p>
            </div>
            <div class="bp-flex bp-gap-md">
              <button routerLink="/templates" class="bp-btn bp-btn-secondary">
                ← Voltar
              </button>
              <button 
                *ngIf="isAdmin()"
                (click)="editTemplate()" 
                class="bp-btn bp-btn-primary"
              >
                Editar
              </button>
              <button 
                *ngIf="isAdmin()"
                (click)="toggleActive()" 
                [class]="template()!.isActive ? 'bp-btn bp-btn-warning' : 'bp-btn bp-btn-success'"
              >
                ` + '{{ template()!.isActive ? "🔒 Desativar" : "✓ Ativar" }}' + `
              </button>
              <button 
                *ngIf="!isAdmin()"
                (click)="useTemplate()" 
                class="bp-btn bp-btn-primary"
              >
                ✨ Usar este Template
              </button>
            </div>
          </div>

          <!-- Template Overview -->
          <div class="bp-card bp-mb-lg">
            <div class="bp-card-header">
              <h3 class="bp-card-title">📊 Visão Geral</h3>
            </div>
            <div class="bp-card-body">
              <div class="bp-grid bp-grid-3 bp-gap-md">
                <div class="bp-text-center" style="padding: 1rem; background: #f5f5ff; border-radius: 8px;">
                  <div style="font-size: 2rem; color: #4f46e5; font-weight: bold;">{{ template()!.stages.length }}</div>
                  <div class="bp-text-muted">Etapas</div>
                </div>
                <div class="bp-text-center" style="padding: 1rem; background: #f0fdf4; border-radius: 8px;">
                  <div style="font-size: 2rem; color: #16a34a; font-weight: bold;">{{ getTotalTasks() }}</div>
                  <div class="bp-text-muted">Tarefas</div>
                </div>
                <div class="bp-text-center" style="padding: 1rem; background: #fef3c7; border-radius: 8px;">
                  <div style="font-size: 2rem; color: #d97706; font-weight: bold;">{{ getTotalSubtasks() }}</div>
                  <div class="bp-text-muted">Subtarefas</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stages -->
          <div *ngIf="template()!.stages.length > 0">
            <h3 class="bp-mb-lg">🗂️ Estrutura do Template</h3>
            
            <div *ngFor="let stage of template()!.stages; let si = index" class="bp-card bp-mb-lg" style="border-left: 4px solid #4f46e5;">
              <div class="bp-card-header" style="background: #f5f5ff;">
                <div class="bp-flex bp-justify-between bp-items-start">
                  <div>
                    <h4 style="margin: 0; color: #4f46e5;">📋 Etapa {{ si + 1 }}: {{ stage.name }}</h4>
                    <p class="bp-text-muted bp-text-sm bp-mt-sm" *ngIf="stage.description">{{ stage.description }}</p>
                  </div>
                  <span class="bp-badge bp-badge-primary">{{ stage.tasks.length }} tarefas</span>
                </div>
              </div>
              <div class="bp-card-body">
                <div class="bp-grid bp-grid-2 bp-gap-md">
                  <div *ngFor="let task of stage.tasks; let ti = index" class="bp-card" style="background: #fafafa; border: 1px solid #e5e7eb;">
                    <div class="bp-card-body">
                      <div class="bp-flex bp-items-start bp-gap-sm bp-mb-sm">
                        <span class="bp-badge bp-badge-secondary" style="min-width: 28px; text-align: center;">{{ ti + 1 }}</span>
                        <div style="flex: 1;">
                          <h5 style="margin: 0; font-size: 0.95rem;">{{ task.title }}</h5>
                          <p class="bp-text-muted bp-text-sm bp-mt-xs" *ngIf="task.description">{{ task.description }}</p>
                        </div>
                      </div>
                      <div *ngIf="task.subtasks.length > 0" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
                        <div class="bp-flex bp-items-center bp-gap-sm bp-mb-sm">
                          <span class="bp-text-muted bp-text-sm">📝 {{ task.subtasks.length }} subtarefas:</span>
                        </div>
                        <ul style="list-style: none; padding: 0; margin: 0; padding-left: 0.5rem;">
                          <li *ngFor="let subtask of task.subtasks" class="bp-text-sm bp-text-muted" style="margin-bottom: 0.25rem; padding-left: 0.5rem; border-left: 2px solid #d1d5db;">
                            {{ subtask.description }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <p *ngIf="stage.tasks.length === 0" class="bp-text-center bp-text-muted" style="padding: 2rem;">
                  Nenhuma tarefa nesta etapa
                </p>
              </div>
            </div>
          </div>

          <!-- Tasks without stages (legacy) -->
          <div *ngIf="template()!.tasks.length > 0" class="bp-card bp-mb-lg">
            <div class="bp-card-header">
              <h3 class="bp-card-title">📝 Tarefas Avulsas ({{ template()!.tasks.length }})</h3>
            </div>
            <div class="bp-card-body">
              <div class="bp-grid bp-grid-2 bp-gap-md">
                <div *ngFor="let task of template()!.tasks; let i = index" class="bp-card" style="background: #fafafa; border: 1px solid #e5e7eb;">
                  <div class="bp-card-body">
                    <div class="bp-flex bp-items-start bp-gap-sm bp-mb-sm">
                      <span class="bp-badge bp-badge-secondary" style="min-width: 28px; text-align: center;">{{ i + 1 }}</span>
                      <div style="flex: 1;">
                        <h5 style="margin: 0; font-size: 0.95rem;">{{ task.title }}</h5>
                        <p class="bp-text-muted bp-text-sm bp-mt-xs" *ngIf="task.description">{{ task.description }}</p>
                      </div>
                    </div>
                    <div *ngIf="task.subtasks.length > 0" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
                      <div class="bp-flex bp-items-center bp-gap-sm bp-mb-sm">
                        <span class="bp-text-muted bp-text-sm">📝 {{ task.subtasks.length }} subtarefas:</span>
                      </div>
                      <ul style="list-style: none; padding: 0; margin: 0; padding-left: 0.5rem;">
                        <li *ngFor="let subtask of task.subtasks" class="bp-text-sm bp-text-muted" style="margin-bottom: 0.25rem; padding-left: 0.5rem; border-left: 2px solid #d1d5db;">
                          {{ subtask.description }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="bp-card bp-mt-lg">
            <div class="bp-card-body">
              <div class="bp-grid bp-grid-2 bp-gap-md">
                <div>
                  <p class="bp-text-muted" style="font-size: 0.875rem; margin-bottom: 0.25rem;">Criado em</p>
                  <p style="margin: 0;">` + '{{ formatDate(template()!.createdAt) }}' + `</p>
                </div>
                <div>
                  <p class="bp-text-muted" style="font-size: 0.875rem; margin-bottom: 0.25rem;">Atualizado em</p>
                  <p style="margin: 0;">` + '{{ formatDate(template()!.updatedAt) }}' + `</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading() && !template()" class="bp-card bp-text-center">
          <div style="padding: 4rem 2rem;">
            <p style="font-size: 4rem; margin-bottom: 1rem;">❌</p>
            <h3>Template não encontrado</h3>
            <p class="bp-text-muted bp-mb-lg">O template que você está procurando não existe.</p>
            <button routerLink="/templates" class="bp-btn bp-btn-primary">
              Voltar para Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TemplateDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  template = signal<Template | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTemplate(id);
    }
  }

  async loadTemplate(id: string) {
    try {
      const data = await this.http.get<Template>(`/api/templates/${id}`).toPromise();
      this.template.set(data as Template);
    } catch (err) {
      console.error('Failed to load template:', err);
      this.template.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ADMIN';
  }

  editTemplate() {
    if (!this.template()) return;
    this.router.navigate(['/admin/templates/edit', this.template()!.id]);
  }

  useTemplate() {
    if (!this.template()) return;
    this.router.navigate(['/projects/create', this.template()!.id]);
  }

  async toggleActive() {
    if (!this.template()) return;
    
    const action = this.template()!.isActive ? 'desativar' : 'ativar';
    const actionPast = this.template()!.isActive ? 'desativado' : 'ativado';

    try {
      const updated = await this.http.patch<Template>(
        `/api/templates/${this.template()!.id}/toggle-active`,
        {}
      ).toPromise();
      
      this.template.set(updated as Template);
      this.toast.success(`Template ${actionPast} com sucesso!`);
    } catch (err: any) {
      this.toast.error('Erro ao alterar status: ' + (err.error?.message || 'Erro desconhecido'));
      console.error(err);
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getTotalTasks(): number {
    const tpl = this.template();
    if (!tpl) return 0;
    
    const tasksInStages = tpl.stages.reduce((sum, stage) => sum + stage.tasks.length, 0);
    return tasksInStages + tpl.tasks.length;
  }

  getTotalSubtasks(): number {
    const tpl = this.template();
    if (!tpl) return 0;
    
    let count = 0;
    
    // Count subtasks in stages
    for (const stage of tpl.stages) {
      for (const task of stage.tasks) {
        count += task.subtasks.length;
      }
    }
    
    // Count subtasks in tasks without stages
    for (const task of tpl.tasks) {
      count += task.subtasks.length;
    }
    
    return count;
  }
}
