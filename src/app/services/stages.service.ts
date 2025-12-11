import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Stage {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export interface StageValue {
  id: string;
  stageId: string;
  projectId: string;
  value: string;
  calculatedAt: string;
}

export interface CreateStageDto {
  name: string;
  order: number;
}

export interface UpdateStageDto {
  name?: string;
  order?: number;
}

@Injectable({ providedIn: 'root' })
export class StagesService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAll(): Observable<Stage[]> {
    return this.http.get<Stage[]>(`${this.apiUrl}/stages`);
  }

  getById(id: string): Observable<Stage> {
    return this.http.get<Stage>(`${this.apiUrl}/stages/${id}`);
  }

  create(dto: CreateStageDto): Observable<Stage> {
    return this.http.post<Stage>(`${this.apiUrl}/stages`, dto);
  }

  update(id: string, dto: UpdateStageDto): Observable<Stage> {
    return this.http.put<Stage>(`${this.apiUrl}/stages/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/stages/${id}`);
  }

  getProjectStages(projectId: string): Observable<StageValue[]> {
    return this.http.get<StageValue[]>(`${this.apiUrl}/stages/project/${projectId}`);
  }
}
