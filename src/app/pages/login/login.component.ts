import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bp-page bp-flex bp-items-center bp-justify-center">
      <div class="bp-card" style="max-width: 450px; width: 100%;">
        <div class="bp-card-header bp-text-center">
          <h2 class="bp-card-title">Bem-vindo(a) ao BluePrint</h2>
          <p class="bp-text-muted">Faça login para criar e gerenciar seus produtos digitais</p>
        </div>

        <div class="bp-card-body">
          <div class="bp-alert bp-alert-error" *ngIf="error()">
            <span>` + '{{ error() }}' + `</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <div class="bp-form-group">
              <label class="bp-label">Email</label>
              <input 
                type="email" 
                class="bp-input" 
                formControlName="email"
                placeholder="Digite seu email"
              />
              <div class="bp-error-message" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                Email válido é obrigatório
              </div>
            </div>

            <div class="bp-form-group">
              <label class="bp-label">Senha</label>
              <input 
                type="password" 
                class="bp-input" 
                formControlName="password"
                placeholder="Digite sua senha"
              />
              <div class="bp-error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                Senha é obrigatória
              </div>
            </div>

            <div style="display: flex; justify-content: center;">
              <button 
                type="submit" 
                class="bp-btn bp-btn-primary bp-btn-lg" 
                style="width: 100%; justify-content: center;"
                [disabled]="loading() || loginForm.invalid"
              >
                <ng-container *ngIf="loading(); else signInText">
                  <div class="bp-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
                  <span>Entrando...</span>
                </ng-container>
                <ng-template #signInText>
                  <span>Login</span>
                </ng-template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onLogin() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (response) => {
        // Se não recebeu o user na resposta, busca separadamente
        if (!response.user) {
          this.authService.getMe().subscribe({
            next: () => {
              this.loading.set(false);
              this.router.navigate(['/home']);
            },
            error: (err) => {
              console.error('Failed to get user:', err);
              this.loading.set(false);
              this.router.navigate(['/home']);
            }
          });
        } else {
          this.loading.set(false);
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
      },
    });
  }
}
