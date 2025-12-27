import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Template {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  description: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAll(): Observable<Template[]> {
    return this.http.get<Template[]>(`${this.apiUrl}/templates`);
  }

  getById(id: string): Observable<Template> {
    return this.http.get<Template>(`${this.apiUrl}/templates/${id}`);
  }

  create(dto: CreateTemplateDto): Observable<Template> {
    return this.http.post<Template>(`${this.apiUrl}/templates`, dto);
  }

  update(id: string, dto: UpdateTemplateDto): Observable<Template> {
    return this.http.put<Template>(`${this.apiUrl}/templates/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  toggleActive(id: string, isActive: boolean): Observable<Template> {
    return this.http.patch<Template>(`${this.apiUrl}/templates/${id}`, { isActive });
  }
}
