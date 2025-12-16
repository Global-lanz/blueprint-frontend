import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

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

interface Template {
  id: string;
  name: string;
  version: string;
  description?: string;
  isActive: boolean;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bp-page">
      <div class="bp-container">
        <div class="bp-loading" *ngIf="loading()">
          <div class="bp-spinner"></div>
        </div>

        <div *ngIf="!loading() && template()">
          <!-- Header -->
          <div class="bp-flex bp-justify-between bp-items-start bp-mb-2xl">
            <div>
              <div class="bp-flex bp-items-center bp-gap-md bp-mb-md">
                <h1 style="margin: 0;">` + '{{ template()!.name }}' + `</h1>
                <span class="bp-badge bp-badge-primary">v` + '{{ template()!.version }}' + `</span>
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
                ✏️ Editar
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

          <!-- Tasks List -->
          <div class="bp-card">
            <div class="bp-card-header">
              <h3 class="bp-card-title">Tarefas do Projeto (` + '{{ template()!.tasks.length }}' + `)</h3>
            </div>
            <div class="bp-card-body">
              <div *ngIf="template()!.tasks.length === 0" class="bp-text-center bp-text-muted" style="padding: 2rem;">
                <p>Este template não possui tarefas ainda.</p>
              </div>

              <div *ngFor="let task of template()!.tasks; let i = index" class="bp-card bp-mb-md">
                <div class="bp-card-header">
                  <div class="bp-flex bp-justify-between bp-items-start">
                    <div>
                      <h4 style="margin: 0;">` + '{{ i + 1 }}' + `. ` + '{{ task.title }}' + `</h4>
                      <p class="bp-text-muted bp-mt-sm" *ngIf="task.description">` + '{{ task.description }}' + `</p>
                    </div>
                    <span class="bp-badge bp-badge-secondary">` + '{{ task.subtasks.length }}' + ` subtarefas</span>
                  </div>
                </div>
                <div class="bp-card-body" *ngIf="task.subtasks.length > 0">
                  <h5 class="bp-mb-md">Subtarefas:</h5>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li *ngFor="let subtask of task.subtasks; let j = index" class="bp-flex bp-items-start bp-gap-sm bp-mb-sm">
                      <span class="bp-badge bp-badge-primary" style="min-width: 24px; text-align: center;">` + '{{ j + 1 }}' + `</span>
                      <span>` + '{{ subtask.description }}' + `</span>
                    </li>
                  </ul>
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
    this.router.navigate(['/admin/templates', this.template()!.id, 'edit']);
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
}
