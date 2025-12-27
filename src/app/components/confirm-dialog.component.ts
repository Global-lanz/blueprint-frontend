import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bp-modal-overlay" *ngIf="confirmService.dialog()" (click)="confirmService.close()">
      <div class="bp-modal" (click)="$event.stopPropagation()">
        <div class="bp-modal-header" [class.bp-modal-danger]="confirmService.dialog()?.type === 'danger'"
             [class.bp-modal-warning]="confirmService.dialog()?.type === 'warning'">
          <h3 class="bp-modal-title">{{ confirmService.dialog()?.title }}</h3>
        </div>
        <div class="bp-modal-body">
          <p>{{ confirmService.dialog()?.message }}</p>
        </div>
        <div class="bp-modal-footer">
          <button 
            class="bp-btn bp-btn-secondary" 
            (click)="confirmService.dialog()?.onCancel?.()"
          >
            {{ confirmService.dialog()?.cancelText }}
          </button>
          <button 
            class="bp-btn"
            [class.bp-btn-error]="confirmService.dialog()?.type === 'danger'"
            [class.bp-btn-warning]="confirmService.dialog()?.type === 'warning'"
            [class.bp-btn-primary]="confirmService.dialog()?.type === 'info'"
            (click)="confirmService.dialog()?.onConfirm()"
          >
            {{ confirmService.dialog()?.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bp-modal-overlay {
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
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .bp-modal {
      background: white;
      border-radius: var(--bp-radius-lg);
      box-shadow: var(--bp-shadow-xl);
      max-width: 500px;
      width: 90%;
      animation: slideIn 0.2s ease-out;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    @keyframes slideIn {
      from { 
        transform: translateY(-20px);
        opacity: 0;
      }
      to { 
        transform: translateY(0);
        opacity: 1;
      }
    }

    .bp-modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--bp-gray-200);
      background: var(--bp-gray-50);
      border-radius: var(--bp-radius-lg) var(--bp-radius-lg) 0 0;
    }

    .bp-modal-header.bp-modal-danger {
      background: #fee;
      border-bottom-color: #fcc;
    }

    .bp-modal-header.bp-modal-warning {
      background: #fffbeb;
      border-bottom-color: #fde68a;
    }

    .bp-modal-title {
      margin: 0;
      font-size: 1.25rem;
      color: var(--bp-gray-900);
    }

    .bp-modal-body {
      padding: 1.5rem;
      color: var(--bp-gray-900);
      line-height: 1.6;
    }

    .bp-modal-body p {
      margin: 0;
      color: var(--bp-gray-900);
    }

    .bp-modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--bp-gray-200);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class ConfirmDialogComponent {
  confirmService = inject(ConfirmService);
}
