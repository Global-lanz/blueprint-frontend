import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'bp_token';
  private readonly USER_KEY = 'bp_user';
  
  currentUser = signal<User | null>(this.getUserFromStorage());

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap(response => {
        this.setToken(response.access_token);
        if (response.user) {
          this.setUser(response.user);
        }
      }));
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, { name, email, password });
  }

  getMe(): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/me`, {})
      .pipe(tap(user => this.setUser(user)));
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }
}
