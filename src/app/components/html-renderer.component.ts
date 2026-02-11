import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-html-renderer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="html-content" 
      [innerHTML]="safeHtml"
    ></div>
  `,
    styles: [`
    .html-content {
      line-height: 1.6;
      word-wrap: break-word;
    }

    .html-content :deep(a) {
      color: #3b82f6;
      text-decoration: underline;
    }

    .html-content :deep(a:hover) {
      color: #2563eb;
    }

    .html-content :deep(strong) {
      font-weight: 600;
    }

    .html-content :deep(em) {
      font-style: italic;
    }

    .html-content :deep(ul) {
      margin: 8px 0;
      padding-left: 24px;
    }

    .html-content :deep(li) {
      margin: 4px 0;
    }

    .html-content :deep(p) {
      margin: 8px 0;
    }
  `]
})
export class HtmlRendererComponent {
    @Input() set content(value: string) {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(value || '');
    }

    safeHtml: SafeHtml = '';

    constructor(private sanitizer: DomSanitizer) { }
}
