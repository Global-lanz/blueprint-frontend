import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GemUtilsService } from '../services/gem-utils.service';

@Component({
  selector: 'app-gem-achievement-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="gem-icon">{{ getGemIcon(gemType) }}</div>
        </div>
        <div class="modal-body">
          <h2 class="achievement-title">🎉 Parabéns!</h2>
          <p class="achievement-message">
            Você conquistou a insígnia <strong>{{ getGemName(gemType) }}</strong>!
          </p>
          <p class="achievement-description">
            {{ getGemDescription(gemType) }}
          </p>
          <p class="encouragement">
            Continue assim para conquistar as próximas insígnias e completar seu projeto! 🚀
          </p>
        </div>
        <div class="modal-footer">
          <button class="bp-btn bp-btn-primary" (click)="close()">
            Continuar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideUp 0.3s ease;
      overflow: hidden;
    }

    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .gem-icon {
      font-size: 5rem;
      animation: bounce 1s ease infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .modal-body {
      padding: 2rem;
      text-align: center;
    }

    .achievement-title {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 1rem 0;
    }

    .achievement-message {
      font-size: 1.25rem;
      color: #4b5563;
      margin: 0 0 1rem 0;
    }

    .achievement-message strong {
      color: #667eea;
      font-weight: 600;
    }

    .achievement-description {
      font-size: 1rem;
      color: #6b7280;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .encouragement {
      font-size: 1rem;
      color: #4b5563;
      margin: 0;
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .modal-footer {
      padding: 1.5rem 2rem;
      background: #f9fafb;
      display: flex;
      justify-content: center;
    }

    .modal-footer button {
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: 600;
    }
  `]
})
export class GemAchievementModalComponent {
  @Input() isOpen = false;
  @Input() gemType: string | null = null;
  @Output() closeModal = new EventEmitter<void>();

  private gemUtils = inject(GemUtilsService);

  close() {
    this.closeModal.emit();
  }

  getGemIcon(gemType: string | null): string {
    return this.gemUtils.getGemEmoji(gemType);
  }

  getGemName(gemType: string | null): string {
    return this.gemUtils.getGemName(gemType);
  }

  getGemDescription(gemType: string | null): string {
    return this.gemUtils.getGemDescription(gemType);
  }
}
