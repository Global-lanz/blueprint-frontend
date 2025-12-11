import { Component, inject, OnInit } from '@angular/core';
import { TasksService } from '../services/tasks.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tasks',
  template: `
    <div>
      <h3>Tasks</h3>
      <ul class="list-group">
        <li *ngFor="let t of tasks" class="list-group-item">
          <strong>{{t.title}}</strong>
          <p>{{t.description}}</p>
          <button class="btn btn-sm btn-primary" (click)="answer(t.id)">Answer</button>
        </li>
      </ul>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class TasksComponent implements OnInit {
  service = inject(TasksService);
  tasks: any[] = [];
  async ngOnInit() {
    // hardcoded template id for demo
    const id = 'tpl1';
    try {
      this.tasks = (await this.service.getByTemplate(id).toPromise()) as any[];
    } catch (err) {
      console.warn(err);
    }
  }
  async answer(taskId: string) {
    const answer = prompt('Answer for task');
    if (!answer) return;
    await this.service.answerTask('project1', taskId, answer).toPromise();
    alert('Saved');
  }
}
