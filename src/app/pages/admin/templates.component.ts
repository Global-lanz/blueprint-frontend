import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-templates',
  template: `
  <h2>Admin - Templates</h2>
  <button class="btn btn-primary mb-3" (click)="createSample()">Create sample template</button>
  <ul class="list-group">
    <li *ngFor="let t of templates" class="list-group-item">
      {{t.name}} (v{{t.version}}) - <button class="btn btn-sm btn-outline-secondary" (click)="view(t.id)">View</button>
    </li>
  </ul>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class AdminTemplatesComponent implements OnInit {
  http = inject(HttpClient);
  templates: any[] = [];
  async ngOnInit() {
    try {
      this.templates = await this.http.get('/api/templates').toPromise() as any[];
    } catch (err) {}
  }
  async createSample() {
    const body = { name: 'Sample Admin Template', version: '1.0', tasks: [{ title: 'T1', description: 'Desc', subtasks: [{ description: 'S1' }] }] };
    await this.http.post('/api/templates', body).toPromise();
    this.ngOnInit();
  }
  view(id: string) {
    alert('Will open template ' + id);
  }
}
