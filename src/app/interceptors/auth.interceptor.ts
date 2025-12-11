import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('bp_token');
    if (!token) return next.handle(req);
    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next.handle(cloned);
  }
}
