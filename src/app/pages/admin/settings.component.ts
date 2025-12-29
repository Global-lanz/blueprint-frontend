import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import packageInfo from '../../../../package.json';

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bp-container bp-py-lg">
      <h1 class="bp-heading-lg bp-mb-lg">⚙️ Configurações do Sistema</h1>

      <div class="bp-card">
        <div class="bp-card-header">
          <h3 class="bp-card-title">Configurações Gerais</h3>
        </div>
        <div class="bp-card-body">
          <!-- Default License Duration -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>⏰ Duração Padrão da Licença</h4>
              <p class="bp-text-muted">
                Tempo em dias que um novo usuário terá acesso ao sistema após a criação via Hotmart
              </p>
            </div>
            <div class="setting-control">
              <div class="bp-flex bp-items-center bp-gap-md">
                <input 
                  type="number" 
                  class="bp-input" 
                  style="max-width: 120px;"
                  [(ngModel)]="licenseDuration"
                  min="1"
                  placeholder="365"
                >
                <span>dias</span>
                <button class="bp-btn bp-btn-primary bp-btn-sm" (click)="saveLicenseDuration()">
                  Salvar
                </button>
              </div>
            </div>
          </div>

          <hr class="bp-my-lg">

          <!-- Default Template -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>📋 Template Padrão para Novos Usuários</h4>
              <p class="bp-text-muted">
                Quando um novo usuário for criado via Hotmart, este template será usado para criar automaticamente um projeto inicial
              </p>
            </div>
            <div class="setting-control">
              <div class="bp-flex bp-flex-column bp-gap-md" style="width: 100%;">
                <div class="bp-flex bp-items-center bp-gap-md">
                  <select 
                    class="bp-input" 
                    style="flex: 1; max-width: 300px;"
                    [(ngModel)]="selectedTemplateId"
                  >
                    <option [ngValue]="null">Nenhum (não criar projeto automaticamente)</option>
                    <option *ngFor="let template of templates" [ngValue]="template.id">
                      {{ template.name }}
                    </option>
                  </select>
                  <button class="bp-btn bp-btn-primary bp-btn-sm" (click)="saveDefaultTemplate()">
                    Salvar
                  </button>
                </div>
                <div class="bp-text-muted" style="font-size: 0.875rem;" *ngIf="selectedTemplateId">
                  ✅ Novos usuários receberão automaticamente um projeto baseado neste template
                </div>
              </div>
            </div>
          </div>

          <hr class="bp-my-lg">

          <!-- Webhook Security Token -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>🔒 Token de Segurança do Webhook</h4>
              <p class="bp-text-muted">
                Token secreto para autenticar requisições ao webhook. Este token deve ser enviado no header <code>x-webhook-token</code>
              </p>
            </div>
            <div class="setting-control">
              <div class="bp-flex bp-flex-column bp-gap-md" style="width: 100%;">
                <!-- Status do token atual -->
                <div class="bp-flex bp-items-center bp-gap-md" *ngIf="!showGeneratedToken">
                  <div class="token-status">
                    <span *ngIf="webhookToken" class="bp-badge bp-badge-success">✓ Token configurado</span>
                    <span *ngIf="!webhookToken" class="bp-badge bp-badge-warning">⚠ Nenhum token configurado</span>
                  </div>
                  <button class="bp-btn bp-btn-primary bp-btn-sm" (click)="generateWebhookToken()">
                    🔄 {{ webhookToken ? 'Gerar Novo Token' : 'Gerar Token' }}
                  </button>
                </div>

                <!-- Token gerado (exibido apenas uma vez) -->
                <div class="token-generated-container" *ngIf="showGeneratedToken">
                  <div class="bp-alert bp-alert-warning" style="margin: 0 0 0.75rem 0; padding: 0.75rem;">
                    <strong>⚠️ IMPORTANTE:</strong> Copie este token agora! Ele não será mostrado novamente após salvar.
                  </div>
                  <div class="token-display">
                    <code class="token-value">{{ generatedToken }}</code>
                    <button 
                      class="bp-btn bp-btn-outline bp-btn-sm" 
                      (click)="copyTokenToClipboard()"
                      [class.copied]="tokenCopied"
                    >
                      {{ tokenCopied ? '✓ Copiado!' : '📋 Copiar' }}
                    </button>
                  </div>
                  <div class="bp-flex bp-gap-md bp-mt-md">
                    <button class="bp-btn bp-btn-primary bp-btn-sm" (click)="saveWebhookToken()">
                      💾 Salvar Token
                    </button>
                    <button class="bp-btn bp-btn-outline bp-btn-sm" (click)="cancelTokenGeneration()">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr class="bp-my-lg">

          <!-- Hotmart Webhook URL -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>🔗 URL do Webhook para Hotmart</h4>
              <p class="bp-text-muted">
                Configure esta URL no painel da Hotmart para receber eventos de compra e reembolso
              </p>
            </div>
            <div class="setting-control">
              <div class="webhook-url">
                <code>{{ getWebhookUrl() }}</code>
                <button class="bp-btn bp-btn-outline bp-btn-sm" (click)="copyWebhookUrl()">
                  📋 Copiar
                </button>
              </div>
            </div>
          </div>

          <hr class="bp-my-lg">

          <!-- System Info -->
          <div class="setting-item">
            <div class="setting-info">
              <h4>ℹ️ Informações do Sistema</h4>
              <p class="bp-text-muted">Detalhes sobre a instalação e configuração</p>
            </div>
            <div class="setting-control">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">🎨 Frontend:</span>
                  <span class="info-value"><code>v{{ version }}</code></span>
                </div>
                <div class="info-item">
                  <span class="info-label">⚙️ Backend:</span>
                  <span class="info-value"><code>v{{ backendVersion() }}</code></span>
                </div>
                <div class="info-item">
                  <span class="info-label">API URL:</span>
                  <span class="info-value">{{ environment.apiUrl }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Ambiente:</span>
                  <span class="info-value">{{ environment.production ? 'Produção' : 'Desenvolvimento' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Integration Instructions -->
      <div class="bp-card bp-mt-lg">
        <div class="bp-card-header">
          <h3 class="bp-card-title">📚 Instruções de Integração com Hotmart</h3>
        </div>
        <div class="bp-card-body">
          <div class="instructions">
            <h4>Como configurar o webhook da Hotmart ou N8N:</h4>
            <ol>
              <li>Gere e salve o <strong>Token de Segurança do Webhook</strong> acima</li>
              <li>Copie a <strong>URL do Webhook</strong></li>
              <li><strong>Para Hotmart:</strong>
                <ul>
                  <li>Acesse o painel da Hotmart</li>
                  <li>Vá em Ferramentas → Webhooks</li>
                  <li>Clique em "Adicionar Webhook"</li>
                  <li>Cole a URL do webhook</li>
                  <li>Adicione um header customizado: <code>x-webhook-token</code> com o valor do token gerado</li>
                  <li>Selecione os eventos: <strong>PURCHASE_COMPLETE</strong> e <strong>PURCHASE_REFUNDED</strong></li>
                </ul>
              </li>
              <li><strong>Para N8N:</strong>
                <ul>
                  <li>Use o nó HTTP Request</li>
                  <li>Método: POST</li>
                  <li>URL: Cole a URL do webhook</li>
                  <li>Headers: Adicione <code>x-webhook-token</code> com o valor do token</li>
                  <li>Body: JSON com <code>email</code>, <code>name</code> e <code>event</code></li>
                </ul>
              </li>
            </ol>

            <div class="bp-alert bp-alert-info bp-mt-md">
              <strong>💡 Dica:</strong> A duração da licença e o template padrão configurados acima serão aplicados automaticamente 
              aos novos usuários criados via Hotmart. Se você selecionou um template padrão, cada novo usuário receberá 
              automaticamente um projeto baseado nesse template. Para usuários criados manualmente na tela de gerenciamento, 
              você pode definir uma data de expiração personalizada.
            </div>

            <div class="bp-alert bp-alert-warning bp-mt-md">
              <strong>⚠️ Importante:</strong> O token de segurança é obrigatório para proteger o webhook. Certifique-se de 
              que a URL do webhook esteja acessível publicamente. Em desenvolvimento local, você pode usar ferramentas como 
              ngrok para expor sua aplicação.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setting-item {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }

    .setting-info h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .setting-control {
      display: flex;
      align-items: center;
    }

    .webhook-url {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .webhook-url code {
      flex: 1;
      background: #F3F4F6;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      word-break: break-all;
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #E5E7EB;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #6B7280;
    }

    .info-value {
      color: #111827;
    }

    .instructions ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    .instructions li {
      margin: 0.75rem 0;
      line-height: 1.6;
    }

    .instructions ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    .bp-alert {
      padding: 1rem;
      border-radius: 6px;
      border-left: 4px solid;
    }

    .bp-alert-info {
      background: #EFF6FF;
      border-color: #3B82F6;
      color: #1E40AF;
    }

    .bp-alert-warning {
      background: #FFFBEB;
      border-color: #F59E0B;
      color: #92400E;
    }

    .bp-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .bp-badge-success {
      background: #D1FAE5;
      color: #065F46;
    }

    .bp-badge-warning {
      background: #FEF3C7;
      color: #92400E;
    }

    .token-status {
      flex: 1;
    }

    .token-generated-container {
      width: 100%;
    }

    .token-display {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 1rem;
      background: #F9FAFB;
      border: 2px dashed #D1D5DB;
      border-radius: 6px;
    }

    .token-value {
      flex: 1;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      background: white;
      padding: 0.5rem;
      border-radius: 4px;
      word-break: break-all;
      color: #1F2937;
    }

    .bp-btn.copied {
      background: #10B981;
      color: white;
      border-color: #10B981;
    }

    @media (max-width: 768px) {
      .setting-item {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  licenseDuration = 365;
  environment = environment;
  version = packageInfo.version;
  backendVersion = signal<string>('...');
  templates: Template[] = [];
  selectedTemplateId: string | null = null;
  webhookToken: string = '';
  generatedToken: string = '';
  showGeneratedToken = false;
  tokenCopied = false;

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadTemplates();
    this.loadBackendVersion();
  }

  loadSettings() {
    this.http.get<Setting[]>(`${environment.apiUrl}/users/admin/settings/all`).subscribe({
      next: (settings) => {
        const licenseSetting = settings.find(s => s.key === 'default_license_duration_days');
        if (licenseSetting) {
          this.licenseDuration = parseInt(licenseSetting.value, 10);
        }

        const templateSetting = settings.find(s => s.key === 'default_template_id');
        if (templateSetting) {
          this.selectedTemplateId = templateSetting.value || null;
        }

        const webhookTokenSetting = settings.find(s => s.key === 'webhook_secret_token');
        if (webhookTokenSetting) {
          this.webhookToken = webhookTokenSetting.value || '';
        }
      },
      error: (err) => {
        console.error('Error loading settings:', err);
      }
    });
  }

  loadTemplates() {
    this.http.get<Template[]>(`${environment.apiUrl}/templates/public/list`).subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (err) => {
        console.error('Error loading templates:', err);
      }
    });
  }

  saveLicenseDuration() {
    if (!this.licenseDuration || this.licenseDuration < 1) {
      this.toast.error('Duração deve ser maior que 0');
      return;
    }

    this.http.put(`${environment.apiUrl}/users/admin/settings/default_license_duration_days`, {
      value: this.licenseDuration.toString(),
      description: 'Duração padrão da licença em dias para novos usuários via Hotmart'
    }).subscribe({
      next: () => {
        this.toast.success('Configuração salva com sucesso');
      },
      error: (err) => {
        this.toast.error('Erro ao salvar configuração');
        console.error(err);
      }
    });
  }

  getWebhookUrl(): string {
    return `${environment.apiUrl}/projects/webhook/create-client`;
  }

  copyWebhookUrl() {
    const url = this.getWebhookUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.toast.success('URL copiada para a área de transferência');
    }).catch(() => {
      this.toast.error('Erro ao copiar URL');
    });
  }

  saveDefaultTemplate() {
    const value = this.selectedTemplateId || '';
    
    this.http.put(`${environment.apiUrl}/users/admin/settings/default_template_id`, {
      value: value,
      description: 'Template padrão para novos usuários via Hotmart'
    }).subscribe({
      next: () => {
        if (value) {
          this.toast.success('Template padrão configurado com sucesso');
        } else {
          this.toast.success('Template padrão removido com sucesso');
        }
      },
      error: (err) => {
        this.toast.error('Erro ao salvar template padrão');
        console.error(err);
      }
    });
  }

  generateWebhookToken() {
    // Generate a random secure token (64 characters)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    // Try using crypto API first
    try {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      token = Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      // Fallback to Math.random if crypto is not available
      console.warn('crypto.getRandomValues not available, using fallback');
      for (let i = 0; i < 64; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    }
    
    this.generatedToken = token;
    this.showGeneratedToken = true;
    this.tokenCopied = false;
    this.toast.success('Token gerado com sucesso! Copie e salve agora.');
  }

  copyTokenToClipboard() {
    navigator.clipboard.writeText(this.generatedToken).then(() => {
      this.tokenCopied = true;
      this.toast.success('Token copiado para a área de transferência!');
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        this.tokenCopied = false;
      }, 3000);
    }).catch(() => {
      this.toast.error('Erro ao copiar token');
    });
  }

  cancelTokenGeneration() {
    this.generatedToken = '';
    this.showGeneratedToken = false;
    this.tokenCopied = false;
  }

  saveWebhookToken() {
    if (!this.generatedToken || this.generatedToken.trim().length < 16) {
      this.toast.error('Token deve ter pelo menos 16 caracteres');
      return;
    }

    this.http.put(`${environment.apiUrl}/users/admin/settings/webhook_secret_token`, {
      value: this.generatedToken,
      description: 'Token secreto para autenticação do webhook'
    }).subscribe({
      next: () => {
        this.webhookToken = this.generatedToken;
        this.generatedToken = '';
        this.showGeneratedToken = false;
        this.tokenCopied = false;
        this.toast.success('Token do webhook salvo com sucesso! O token está agora configurado.');
      },
      error: (err) => {
        this.toast.error('Erro ao salvar token do webhook');
        console.error(err);
      }
    });
  }

  loadBackendVersion() {
    this.http.get<{ version: string }>(`${environment.apiUrl}/version`).subscribe({
      next: (data) => {
        this.backendVersion.set(data.version);
      },
      error: () => {
        this.backendVersion.set('N/A');
      }
    });
  }
}
