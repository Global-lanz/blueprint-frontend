import { HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('bp_token');
    
    const cloned = token 
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
    
    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expirado ou inválido - limpar e redirecionar para login
          localStorage.removeItem('bp_token');
          localStorage.removeItem('bp_user');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
