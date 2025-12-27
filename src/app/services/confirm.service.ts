import { Injectable, signal } from '@angular/core';

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  dialog = signal<ConfirmDialog | null>(null);

  confirm(
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialog.set({
        title,
        message,
        confirmText: options?.confirmText || 'Confirmar',
        cancelText: options?.cancelText || 'Cancelar',
        type: options?.type || 'warning',
        onConfirm: () => {
          this.dialog.set(null);
          resolve(true);
        },
        onCancel: () => {
          this.dialog.set(null);
          resolve(false);
        },
      });
    });
  }

  close() {
    this.dialog.set(null);
  }
}
