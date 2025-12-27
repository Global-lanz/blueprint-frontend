import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: any = null;

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<any> {
    try {
      this.config = await this.http.get('/assets/config.json').toPromise();
      return this.config;
    } catch (error) {
      console.warn('Não foi possível carregar config.json, usando configuração padrão');
      this.config = { apiUrl: '/api' };
      return this.config;
    }
  }

  getApiUrl(): string {
    return this.config?.apiUrl || '/api';
  }
}
