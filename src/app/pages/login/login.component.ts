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
          <h2 class="bp-card-title">Welcome to BluePrint</h2>
          <p class="bp-text-muted">Sign in to create and manage your digital products</p>
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
                placeholder="admin@blueprint.local"
              />
              <div class="bp-error-message" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                Valid email is required
              </div>
            </div>

            <div class="bp-form-group">
              <label class="bp-label">Password</label>
              <input 
                type="password" 
                class="bp-input" 
                formControlName="password"
                placeholder="Enter your password"
              />
              <div class="bp-error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                Password is required
              </div>
            </div>

            <button 
              type="submit" 
              class="bp-btn bp-btn-primary bp-btn-lg" 
              style="width: 100%;"
              [disabled]="loading() || loginForm.invalid"
            >
              <ng-container *ngIf="loading(); else signInText">
                <div class="bp-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
                <span>Signing in...</span>
              </ng-container>
              <ng-template #signInText>
                <span>Sign In</span>
              </ng-template>
            </button>
          </form>

          <div class="bp-alert bp-alert-info bp-mt-lg">
            <div>
              <strong>Demo Credentials:</strong><br/>
              Email: <code>admin@blueprint.local</code><br/>
              Password: <code>admin123</code>
            </div>
          </div>
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
    email: ['admin@blueprint.local', [Validators.required, Validators.email]],
    password: ['admin123', [Validators.required, Validators.minLength(6)]],
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
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
      },
    });
  }
}
