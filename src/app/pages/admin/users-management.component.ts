import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

interface UserWithStats {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  isActive: boolean;
  licenseExpiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  projectCount: number;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bp-container bp-py-lg">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="bp-heading-lg" style="margin: 0;">👥 Gerenciamento de Usuários</h1>
          <p class="bp-text-muted" style="margin-top: 0.5rem;">Gerencie usuários, licenças e permissões</p>
        </div>
        <button class="bp-btn bp-btn-primary" (click)="openCreateModal()">
          ➕ Novo Usuário
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ getTotalUsers() }}</div>
            <div class="stat-label">Total de Usuários</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ getActiveUsers() }}</div>
            <div class="stat-label">Usuários Ativos</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👑</div>
          <div class="stat-content">
            <div class="stat-value">{{ getAdminUsers() }}</div>
            <div class="stat-label">Administradores</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <div class="stat-value">{{ getExpiredLicenses() }}</div>
            <div class="stat-label">Licenças Expiradas</div>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-bar">
        <input 
          type="text" 
          class="bp-input search-input" 
          [(ngModel)]="searchTerm"
          placeholder="🔍 Buscar por nome ou email..."
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        >
      </div>

      <!-- Users Grid -->
      <div class="users-grid">
        <div *ngFor="let user of getFilteredUsers()" class="user-card">
          <div class="user-card-header">
            <div class="user-info">
              <div class="user-avatar">{{ getInitials(user.name) }}</div>
              <div class="user-details">
                <h3 class="user-name">{{ user.name }}</h3>
                <p class="user-email">{{ user.email }}</p>
                <div class="user-badges">
                  <span class="bp-badge bp-badge-sm" [class.bp-badge-danger]="user.role === 'ADMIN'" [class.bp-badge-primary]="user.role === 'CLIENT'">
                    {{ user.role === 'ADMIN' ? '👑 Admin' : '👤 Cliente' }}
                  </span>
                  <span class="bp-badge bp-badge-sm" [class.bp-badge-success]="user.isActive && !isLicenseExpired(user)" 
                        [class.bp-badge-danger]="!user.isActive || isLicenseExpired(user)">
                    {{ getStatusLabel(user) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="user-card-body">
            <div class="user-stats-row">
              <div class="user-stat-compact">
                <span class="stat-icon">📊</span>
                <span>{{ user.projectCount }} projetos</span>
              </div>
              <div class="user-stat-compact">
                <span class="stat-icon">🕐</span>
                <span>{{ formatDate(user.lastLoginAt) || 'Nunca' }}</span>
              </div>
            </div>
            <div class="user-stats-row" *ngIf="user.licenseExpiresAt">
              <div class="user-stat-compact">
                <span class="stat-icon">⏰</span>
                <span [class.text-danger]="isLicenseExpired(user)"
                      [class.text-warning]="isLicenseExpiringSoon(user) && !isLicenseExpired(user)">
                  Expira: {{ formatDate(user.licenseExpiresAt) }}
                </span>
              </div>
            </div>
          </div>

          <div class="user-card-footer">
            <button class="bp-btn bp-btn-xs bp-btn-outline" (click)="viewAuditLog(user)" title="Histórico">
              📋
            </button>
            <button class="bp-btn bp-btn-xs bp-btn-outline" (click)="editUser(user)" title="Editar">
              ✏️
            </button>
            <button class="bp-btn bp-btn-xs" 
                    [class.bp-btn-danger]="user.isActive" 
                    [class.bp-btn-success]="!user.isActive"
                    (click)="toggleUserAccess(user)"
                    [title]="user.isActive ? 'Desativar' : 'Ativar'">
              {{ user.isActive ? '🚫' : '✅' }}
            </button>
            <button class="bp-btn bp-btn-xs bp-btn-danger" (click)="deleteUser(user)" title="Excluir">
              🗑️
            </button>
          </div>
        </div>

        <div *ngIf="getFilteredUsers().length === 0" class="empty-state">
          <div class="empty-icon">{{ searchTerm ? '🔍' : '👥' }}</div>
          <h3>{{ searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado' }}</h3>
          <p>{{ searchTerm ? 'Tente buscar com outros termos' : 'Clique em "Novo Usuário" para começar' }}</p>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="bp-modal" *ngIf="showModal()" (click)="closeModal()">
        <div class="bp-modal-content bp-modal-md" (click)="$event.stopPropagation()">
          <div class="bp-modal-header">
            <h2>{{ editingUser() ? '✏️ Editar Usuário' : '➕ Novo Usuário' }}</h2>
            <button class="bp-modal-close" (click)="closeModal()">×</button>
          </div>
          <div class="bp-modal-body">
            <div class="bp-form-group">
              <label class="bp-label">Nome Completo *</label>
              <input type="text" class="bp-input" [(ngModel)]="formData.name" placeholder="Ex: João Silva">
            </div>
            <div class="bp-form-group">
              <label class="bp-label">Email *</label>
              <input type="email" class="bp-input" [(ngModel)]="formData.email" placeholder="email@exemplo.com">
            </div>
            <div class="bp-form-group">
              <label class="bp-label">Senha {{ editingUser() ? '(deixe em branco para não alterar)' : '*' }}</label>
              <input type="password" class="bp-input" [(ngModel)]="formData.password" 
                     [placeholder]="editingUser() ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'"
                     autocomplete="new-password"
                     autocorrect="off"
                     autocapitalize="off"
                     spellcheck="false">
              <small class="bp-text-muted" *ngIf="editingUser()">
                Preencha apenas se quiser redefinir a senha do usuário
              </small>
            </div>
            <div class="bp-form-group">
              <label class="bp-label">Tipo de Usuário *</label>
              <select class="bp-input" [(ngModel)]="formData.role">
                <option value="CLIENT">👤 Cliente (Acesso normal)</option>
                <option value="ADMIN">👑 Administrador (Acesso total)</option>
              </select>
            </div>
            <div class="bp-form-group">
              <label class="bp-label">Data de Expiração da Licença</label>
              <input type="date" class="bp-input" [(ngModel)]="formData.licenseExpiresAt">
              <small class="bp-text-muted">Deixe em branco para acesso ilimitado</small>
            </div>
            <div class="bp-form-group" *ngIf="editingUser()">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="formData.isActive">
                <span>✅ Usuário Ativo (pode fazer login)</span>
              </label>
            </div>
          </div>
          <div class="bp-modal-footer">
            <button class="bp-btn bp-btn-outline" (click)="closeModal()">Cancelar</button>
            <button class="bp-btn bp-btn-primary" (click)="saveUser()">
              {{ editingUser() ? '💾 Salvar Alterações' : '➕ Criar Usuário' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Audit Log Modal -->
      <div class="bp-modal" *ngIf="showAuditModal()" (click)="closeAuditModal()">
        <div class="bp-modal-content bp-modal-lg" (click)="$event.stopPropagation()">
          <div class="bp-modal-header">
            <h2>📋 Histórico de Alterações - {{ auditUser()?.name }}</h2>
            <button class="bp-modal-close" (click)="closeAuditModal()">×</button>
          </div>
          <div class="bp-modal-body" style="max-height: 70vh; overflow-y: auto;">
            <div *ngIf="auditLogs().length === 0" class="empty-state" style="padding: 2rem;">
              <div class="empty-icon">📋</div>
              <h3>Nenhum registro encontrado</h3>
              <p>Este usuário ainda não possui histórico de alterações.</p>
            </div>
            <div class="audit-timeline" *ngIf="auditLogs().length > 0">
              <div class="audit-entry" *ngFor="let log of auditLogs()">
                <div class="audit-icon" [class]="getAuditIconClass(log.action)">
                  {{ getAuditIcon(log.action) }}
                </div>
                <div class="audit-content">
                  <div class="audit-header">
                    <strong>{{ getAuditActionLabel(log.action) }}</strong>
                    <span class="audit-source">{{ getAuditSourceLabel(log.source) }}</span>
                  </div>
                  <div class="audit-details" *ngIf="log.details">
                    <small>{{ formatAuditDetails(log.details) }}</small>
                  </div>
                  <div class="audit-meta">
                    <span>{{ formatDateTime(log.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bp-modal-footer">
            <button class="bp-btn bp-btn-outline" (click)="closeAuditModal()">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }

    .stat-icon {
      font-size: 2.5rem;
      opacity: 0.8;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: var(--bp-primary);
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6B7280;
      font-weight: 500;
    }

    .search-bar {
      margin-bottom: 1.5rem;
    }

    .search-input {
      max-width: 500px;
      font-size: 0.95rem;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .user-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .user-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }

    .user-card-header {
      padding: 1rem;
      border-bottom: 1px solid #F3F4F6;
    }

    .user-info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--bp-primary), var(--bp-primary-light));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      margin: 0 0 0.25rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      margin: 0 0 0.5rem 0;
      font-size: 0.8rem;
      color: #6B7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-badges {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .bp-badge-sm {
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
    }

    .user-card-body {
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .user-stats-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .user-stat-compact {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8rem;
      color: #374151;
    }

    .user-stat-compact .stat-icon {
      font-size: 1rem;
      opacity: 0.7;
    }

    .user-card-footer {
      padding: 0.75rem 1rem;
      background: #F9FAFB;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .bp-btn-xs {
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 4rem;
      opacity: 0.3;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      color: #6B7280;
    }

    .text-danger {
      color: #EF4444;
      font-weight: 500;
    }

    .text-warning {
      color: #F59E0B;
      font-weight: 500;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.75rem;
      border-radius: 8px;
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      transition: all 0.2s ease;
    }

    .checkbox-label:hover {
      background: #F3F4F6;
      border-color: var(--bp-primary-light);
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .checkbox-label span {
      font-weight: 500;
      color: #374151;
    }

    /* Modal Styles */
    .bp-modal {
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

    .bp-modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-height: 90vh;
      overflow-y: auto;
      width: 100%;
    }

    .bp-modal-md {
      max-width: 600px;
    }

    .bp-modal-lg {
      max-width: 900px;
    }

    .bp-modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bp-modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    .bp-modal-close {
      background: none;
      border: none;
      font-size: 2rem;
      color: #9CA3AF;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .bp-modal-close:hover {
      background: #F3F4F6;
      color: #374151;
    }

    .bp-modal-body {
      padding: 1.5rem;
    }

    .bp-modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #E5E7EB;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .audit-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .audit-entry {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #F9FAFB;
      border-radius: 8px;
      border-left: 3px solid #D1D5DB;
    }

    .audit-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .audit-icon.success {
      background: #D1FAE5;
      color: #065F46;
    }

    .audit-icon.warning {
      background: #FEF3C7;
      color: #92400E;
    }

    .audit-icon.danger {
      background: #FEE2E2;
      color: #991B1B;
    }

    .audit-icon.info {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .audit-content {
      flex: 1;
    }

    .audit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .audit-source {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: #E5E7EB;
      color: #6B7280;
      border-radius: 4px;
      font-weight: 500;
    }

    .audit-details {
      margin-bottom: 0.5rem;
      color: #6B7280;
      font-size: 0.875rem;
    }

    .audit-meta {
      font-size: 0.75rem;
      color: #9CA3AF;
    }
  `]
})
export class UsersManagementComponent implements OnInit {
  users = signal<UserWithStats[]>([]);
  showModal = signal(false);
  editingUser = signal<UserWithStats | null>(null);
  searchTerm = '';
  
  // Audit log
  showAuditModal = signal(false);
  auditUser = signal<UserWithStats | null>(null);
  auditLogs = signal<any[]>([]);
  
  formData: any = {
    name: '',
    email: '',
    password: '',
    role: 'CLIENT',
    licenseExpiresAt: '',
    isActive: true
  };

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<UserWithStats[]>(`${environment.apiUrl}/users/admin/all-with-stats`).subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: (err) => {
        this.toast.error('Erro ao carregar usuários');
        console.error(err);
      }
    });
  }

  getTotalUsers() {
    return this.users().length;
  }

  getFilteredUsers() {
    if (!this.searchTerm.trim()) {
      return this.users();
    }
    
    const search = this.searchTerm.toLowerCase();
    return this.users().filter(user => 
      user.name.toLowerCase().includes(search) || 
      user.email.toLowerCase().includes(search)
    );
  }

  getActiveUsers() {
    return this.users().filter(u => u.isActive && !this.isLicenseExpired(u)).length;
  }

  getAdminUsers() {
    return this.users().filter(u => u.role === 'ADMIN').length;
  }

  getExpiredLicenses() {
    return this.users().filter(u => this.isLicenseExpired(u)).length;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  isLicenseExpired(user: UserWithStats): boolean {
    if (!user.licenseExpiresAt) return false;
    return new Date(user.licenseExpiresAt) < new Date();
  }

  isLicenseExpiringSoon(user: UserWithStats): boolean {
    if (!user.licenseExpiresAt) return false;
    const expiresAt = new Date(user.licenseExpiresAt);
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  getStatusLabel(user: UserWithStats): string {
    if (!user.isActive) return '🔒 Inativo';
    if (this.isLicenseExpired(user)) return '⏰ Expirado';
    return '✅ Ativo';
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatDateTime(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  viewAuditLog(user: UserWithStats) {
    this.auditUser.set(user);
    this.showAuditModal.set(true);
    
    // Load audit log
    this.http.get<any[]>(`${environment.apiUrl}/users/admin/${user.id}/audit-log`).subscribe({
      next: (logs) => {
        this.auditLogs.set(logs);
      },
      error: (err) => {
        this.toast.error('Erro ao carregar histórico');
        console.error(err);
      }
    });
  }

  closeAuditModal() {
    this.showAuditModal.set(false);
    this.auditUser.set(null);
    this.auditLogs.set([]);
  }

  getAuditIcon(action: string): string {
    const icons: any = {
      'USER_CREATED': '➕',
      'USER_UPDATED': '✏️',
      'USER_ACTIVATED': '✅',
      'USER_DEACTIVATED': '🚫',
      'USER_DELETED': '🗑️',
      'PASSWORD_CHANGED': '🔑',
      'LICENSE_EXTENDED': '⏰',
      'LICENSE_EXPIRED': '⌛',
      'ROLE_CHANGED': '👑'
    };
    return icons[action] || '📝';
  }

  getAuditIconClass(action: string): string {
    if (action === 'USER_CREATED' || action === 'USER_ACTIVATED' || action === 'LICENSE_EXTENDED') {
      return 'success';
    }
    if (action === 'USER_DEACTIVATED' || action === 'USER_DELETED' || action === 'LICENSE_EXPIRED') {
      return 'danger';
    }
    if (action === 'PASSWORD_CHANGED' || action === 'ROLE_CHANGED') {
      return 'warning';
    }
    return 'info';
  }

  getAuditActionLabel(action: string): string {
    const labels: any = {
      'USER_CREATED': 'Usuário Criado',
      'USER_UPDATED': 'Usuário Atualizado',
      'USER_ACTIVATED': 'Usuário Ativado',
      'USER_DEACTIVATED': 'Usuário Desativado',
      'USER_DELETED': 'Usuário Excluído',
      'PASSWORD_CHANGED': 'Senha Alterada',
      'LICENSE_EXTENDED': 'Licença Estendida',
      'LICENSE_EXPIRED': 'Licença Expirada',
      'ROLE_CHANGED': 'Tipo de Usuário Alterado'
    };
    return labels[action] || action;
  }

  getAuditSourceLabel(source: string): string {
    const labels: any = {
      'ADMIN_PANEL': 'Painel Admin',
      'WEBHOOK': 'Integração Hotmart',
      'SYSTEM': 'Sistema',
      'SELF': 'Próprio Usuário'
    };
    return labels[source] || source;
  }

  formatAuditDetails(details: any): string {
    if (!details) return '';
    
    const parts: string[] = [];
    
    if (details.email) {
      parts.push(`Email: ${details.email}`);
    }
    if (details.role) {
      parts.push(`Tipo: ${details.role}`);
    }
    if (details.oldRole && details.newRole) {
      parts.push(`De ${details.oldRole} para ${details.newRole}`);
    }
    if (details.oldExpiration && details.newExpiration) {
      const oldDate = new Date(details.oldExpiration).toLocaleDateString('pt-BR');
      const newDate = new Date(details.newExpiration).toLocaleDateString('pt-BR');
      parts.push(`Expiração: ${oldDate} → ${newDate}`);
    }
    if (details.licenseExpiresAt) {
      const date = new Date(details.licenseExpiresAt).toLocaleDateString('pt-BR');
      parts.push(`Expira em: ${date}`);
    }
    if (details.event) {
      parts.push(`Evento: ${details.event}`);
    }
    if (details.name && details.email) {
      parts.push(`Nome: ${details.name}, Email: ${details.email}`);
    }
    
    return parts.join(' • ');
  }

  openCreateModal() {
    this.editingUser.set(null);
    this.formData = {
      name: '',
      email: '',
      password: '',
      role: 'CLIENT',
      licenseExpiresAt: '',
      isActive: true
    };
    this.showModal.set(true);
  }

  editUser(user: UserWithStats) {
    this.editingUser.set(user);
    this.formData = {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      licenseExpiresAt: user.licenseExpiresAt ? new Date(user.licenseExpiresAt).toISOString().split('T')[0] : '',
      isActive: user.isActive
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingUser.set(null);
  }

  saveUser() {
    const editing = this.editingUser();
    
    if (!this.formData.name || !this.formData.email) {
      this.toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!editing && !this.formData.password) {
      this.toast.error('Senha é obrigatória para novo usuário');
      return;
    }

    const data: any = {
      name: this.formData.name,
      email: this.formData.email,
      role: this.formData.role,
      isActive: this.formData.isActive
    };

    // Adicionar senha apenas se foi preenchida
    if (this.formData.password && this.formData.password.trim()) {
      data.password = this.formData.password;
    }

    // Enviar null se vazio, ou a data se preenchida
    data.licenseExpiresAt = this.formData.licenseExpiresAt || null;

    const request = editing
      ? this.http.put(`${environment.apiUrl}/users/admin/${editing.id}`, data)
      : this.http.post(`${environment.apiUrl}/users/admin/create`, data);

    request.subscribe({
      next: () => {
        this.toast.success(editing ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao salvar usuário');
        console.error(err);
      }
    });
  }

  toggleUserAccess(user: UserWithStats) {
    const newStatus = !user.isActive;
    const title = newStatus ? 'Ativar Acesso' : 'Desativar Acesso';
    const message = newStatus 
      ? `Deseja realmente ativar o acesso de ${user.name}?`
      : `O usuário ${user.name} não poderá mais fazer login.`;

    this.confirm.confirm(title, message).then(confirmed => {
      if (confirmed) {
        this.http.patch(`${environment.apiUrl}/users/admin/${user.id}/toggle-access`, { isActive: newStatus }).subscribe({
          next: () => {
            this.toast.success(newStatus ? 'Acesso ativado' : 'Acesso desativado');
            this.loadUsers();
          },
          error: (err) => {
            this.toast.error('Erro ao alterar status');
            console.error(err);
          }
        });
      }
    });
  }

  deleteUser(user: UserWithStats) {
    this.confirm.confirm(
      'Excluir Usuário',
      `Deseja realmente excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`,
      { type: 'danger' }
    ).then(confirmed => {
      if (confirmed) {
        this.http.delete(`${environment.apiUrl}/users/admin/${user.id}`).subscribe({
          next: () => {
            this.toast.success('Usuário excluído com sucesso');
            this.loadUsers();
          },
          error: (err) => {
            this.toast.error('Erro ao excluir usuário');
            console.error(err);
          }
        });
      }
    });
  }
}
