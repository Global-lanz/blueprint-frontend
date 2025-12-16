import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { storeProviders } from './app/store';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { authGuard, adminGuard } from './app/guards/auth.guard';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', redirectTo: '/login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./app/pages/login/login.component').then(c => c.LoginComponent) },
      { path: 'home', loadComponent: () => import('./app/pages/home/home.component').then(c => c.HomeComponent), canActivate: [authGuard] },
      { path: 'templates', loadComponent: () => import('./app/pages/templates/templates.component').then(c => c.TemplatesComponent), canActivate: [authGuard] },
      { path: 'templates/:id', loadComponent: () => import('./app/pages/templates/template-detail.component').then(c => c.TemplateDetailComponent), canActivate: [authGuard] },
      { path: 'projects', loadComponent: () => import('./app/pages/projects/projects.component').then(c => c.ProjectsComponent), canActivate: [authGuard] },
      { path: 'projects/create/:templateId', loadComponent: () => import('./app/pages/projects/create-project.component').then(c => c.CreateProjectComponent), canActivate: [authGuard] },
      { path: 'admin/templates', loadComponent: () => import('./app/pages/admin/templates.component').then(c => c.AdminTemplatesComponent), canActivate: [adminGuard] },
      { path: 'admin/templates/:id/edit', loadComponent: () => import('./app/pages/admin/edit-template.component').then(c => c.EditTemplateComponent), canActivate: [adminGuard] },
      { path: 'tasks', loadComponent: () => import('./app/tasks/tasks.component').then(c => c.TasksComponent), canActivate: [authGuard] }
    ]),
    provideHttpClient(withInterceptorsFromDi()),
    ...storeProviders,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
});
