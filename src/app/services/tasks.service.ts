import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Task {
  id: string;
  title: string;
  description: string;
  order: number;
  templateId: string;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  order: number;
  taskId: string;
}

export interface TaskAnswer {
  taskId: string;
  answer: string;
}

export interface Project {
  id: string;
  name: string;
  templateId: string;
  clientId: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getByTemplate(templateId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/template/${templateId}`);
  }

  answerTask(projectId: string, taskId: string, answer: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects/${projectId}/task-answer`, { taskId, answer });
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }
}
