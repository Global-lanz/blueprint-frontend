import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Project {
  id: string;
  name: string;
  templateId: string;
  clientId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  templateId: string;
  clientId: string;
}

export interface UpdateProjectDto {
  name?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  getMyProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects/my`);
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`);
  }

  create(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, dto);
  }

  update(id: string, dto: UpdateProjectDto): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  getProgress(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/projects/${id}/progress`);
  }
}
