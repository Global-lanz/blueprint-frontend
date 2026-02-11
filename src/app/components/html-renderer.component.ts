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
    const decoded = this.decodeHtml(value || '');
    const processedContent = this.processLinks(decoded);
    this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(processedContent);
  }

  safeHtml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) { }

  private decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  private processLinks(html: string): string {
    if (!html) return '';

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a');

      let modified = false;

      links.forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.match(/^(https?:\/\/|mailto:|tel:|\/)/)) {
          a.setAttribute('href', 'https://' + href);
          a.setAttribute('target', '_blank');
          modified = true;
        }

        // Ensure all external links open in new tab
        if (href && href.startsWith('http') && a.getAttribute('target') !== '_blank') {
          a.setAttribute('target', '_blank');
          modified = true;
        }
      });

      return modified ? doc.body.innerHTML : html;
    } catch (e) {
      console.error('Error processing HTML links:', e);
      return html;
    }
  }
}
