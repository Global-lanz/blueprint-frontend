import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { storeProviders } from './app/store';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { authGuard, adminGuard } from './app/guards/auth.guard';
import { setRuntimeConfig } from './environments/environment';

// Função para carregar configuração antes da inicialização do app
export function initializeApp(http: HttpClient) {
  return () =>
    http
      .get('/assets/config.json')
      .toPromise()
      .then((config: any) => {
        setRuntimeConfig(config);
        console.log('Configuração carregada:', config);
      })
      .catch((error) => {
        console.warn('Usando configuração padrão (config.json não encontrado)', error);
        setRuntimeConfig({ apiUrl: '/api' });
      });
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', redirectTo: '/login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./app/pages/login/login.component').then(c => c.LoginComponent) },
      { path: 'home', loadComponent: () => import('./app/pages/home/home.component').then(c => c.HomeComponent), canActivate: [authGuard] },
      { path: 'templates', loadComponent: () => import('./app/pages/templates/templates.component').then(c => c.TemplatesComponent), canActivate: [authGuard] },
      { path: 'templates/:id', loadComponent: () => import('./app/pages/templates/template-detail.component').then(c => c.TemplateDetailComponent), canActivate: [authGuard] },
      { path: 'projects', loadComponent: () => import('./app/pages/projects/projects.component').then(c => c.ProjectsComponent), canActivate: [authGuard] },
      { path: 'projects/:id', loadComponent: () => import('./app/pages/projects/project-detail.component').then(c => c.ProjectDetailComponent), canActivate: [authGuard] },
      { path: 'projects/:id/manage', loadComponent: () => import('./app/pages/projects/project-manage.component').then(c => c.ProjectManageComponent), canActivate: [authGuard] },
      { path: 'projects/create/:templateId', loadComponent: () => import('./app/pages/projects/create-project.component').then(c => c.CreateProjectComponent), canActivate: [authGuard] },
      { path: 'admin/templates/create', loadComponent: () => import('./app/pages/admin/edit-template.component').then(c => c.EditTemplateComponent), canActivate: [adminGuard] },
      { path: 'admin/templates/edit/:id', loadComponent: () => import('./app/pages/admin/edit-template.component').then(c => c.EditTemplateComponent), canActivate: [adminGuard] },
      { path: 'admin/users', loadComponent: () => import('./app/pages/admin/users-management.component').then(c => c.UsersManagementComponent), canActivate: [adminGuard] },
      { path: 'admin/settings', loadComponent: () => import('./app/pages/admin/settings.component').then(c => c.SettingsComponent), canActivate: [adminGuard] },
      { path: 'tasks', loadComponent: () => import('./app/tasks/tasks.component').then(c => c.TasksComponent), canActivate: [authGuard] }
    ]),
    provideHttpClient(withInterceptorsFromDi()),
    ...storeProviders,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [HttpClient],
      multi: true
    }
  ],
});
