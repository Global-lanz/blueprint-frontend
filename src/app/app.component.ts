import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar.component';
import { ToastContainerComponent } from './components/toast-container.component';
import { ConfirmDialogComponent } from './components/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
    <app-confirm-dialog></app-confirm-dialog>
  `,
})
export class AppComponent {}
