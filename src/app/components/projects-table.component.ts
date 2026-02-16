import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Project {
  id: string;
  name: string;
  templateId: string;
  templateVersion: string;
  progress: number;
  createdAt: string;
  actualStartDate?: string;
  currentGem?: string;
  template?: {
    name: string;
  };
}

@Component({
  selector: 'app-projects-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <table class="bp-table">
      <thead>
        <tr>
          <th class="bp-table-header">Nome do Projeto</th>
          <th class="bp-table-header">Template</th>
          <th class="bp-table-header">Iniciado em</th>
          <th class="bp-table-header">Progresso</th>
          <th class="bp-table-header">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let project of projects">
          <td>
            <strong>{{ project.name }}</strong>
          </td>
          <td class="bp-text-muted">
            {{ project.template?.name || 'N/A' }}
          </td>
          <td class="bp-text-muted">
            {{ formatDate(project.actualStartDate || project.createdAt) }}
          </td>
          <td>
            <div class="bp-progress">
              <div 
                class="bp-progress-bar" 
                [style.width]="project.progress + '%'"
              ></div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <span class="bp-text-muted bp-text-sm">{{ project.progress.toFixed(0) }}%</span>
              <span *ngIf="getCurrentGem(project)" style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.125rem 0.5rem; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <span [innerHTML]="getGemIcon(getCurrentGem(project)!.gemType, 14)" style="display: inline-flex;"></span>
                <span style="font-weight: 600; color: #4a5568;">{{ getCurrentGem(project)!.name }}</span>
              </span>
            </div>
          </td>
          <td>
            <div class="bp-flex bp-gap-sm">
              <button 
                [routerLink]="['/projects', project.id]"
                class="bp-btn bp-btn-sm bp-btn-primary"
                title="Trabalhar no projeto - preencher respostas e marcar subtarefas"
              >
                ✏️ Trabalhar
              </button>
              <button 
                *ngIf="showManageButton"
                [routerLink]="['/projects', project.id, 'manage']"
                class="bp-btn bp-btn-sm bp-btn-secondary"
                title="Gerenciar estrutura do projeto - adicionar/remover tarefas"
              >
                ⚙️ Gerenciar
              </button>
              <button 
                *ngIf="showDeleteButton"
                (click)="onDelete.emit(project.id)"
                class="bp-btn bp-btn-sm bp-btn-danger"
                title="Excluir projeto permanentemente"
              >
                🗑️
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: []
})
export class ProjectsTableComponent {
  @Input() projects: Project[] = [];
  @Input() showManageButton: boolean = true;
  @Input() showDeleteButton: boolean = true;
  @Output() onDelete = new EventEmitter<string>();

  private sanitizer = inject(DomSanitizer);

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getCurrentGem(project: Project): { gemType: string; name: string } | null {
    if (!project.currentGem) {
      return null;
    }

    return {
      gemType: project.currentGem,
      name: this.getGemName(project.currentGem)
    };
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

  getGemIcon(gemType: string, size: number = 20): SafeHtml {
    const colors: { [key: string]: { fill: string; shine: string } } = {
      'ESMERALDA': { fill: '#10B981', shine: '#34D399' },
      'RUBI': { fill: '#EF4444', shine: '#F87171' },
      'SAFIRA': { fill: '#3B82F6', shine: '#60A5FA' },
      'DIAMANTE': { fill: '#E5E7EB', shine: '#F9FAFB' }
    };
    const color = colors[gemType] || colors['DIAMANTE'];
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="${color.fill}" stroke="#1a202c" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 2L21 9L12 12L3 9L12 2Z" fill="${color.shine}" opacity="0.6"/>
      <line x1="3" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
      <line x1="21" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
    </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
