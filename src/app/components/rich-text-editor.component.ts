import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ],
  template: `
    <div class="rich-editor-container">
      <div class="rich-editor-toolbar">
        <button 
          type="button"
          class="toolbar-btn" 
          (click)="execCommand('bold')" 
          title="Negrito (Ctrl+B)"
          [class.active]="isCommandActive('bold')"
        >
          <strong>B</strong>
        </button>
        <button 
          type="button"
          class="toolbar-btn" 
          (click)="execCommand('italic')" 
          title="Itálico (Ctrl+I)"
          [class.active]="isCommandActive('italic')"
        >
          <em>I</em>
        </button>
        <button 
          type="button"
          class="toolbar-btn" 
          (click)="execCommand('underline')" 
          title="Sublinhado (Ctrl+U)"
          [class.active]="isCommandActive('underline')"
        >
          <u>U</u>
        </button>
        <span class="toolbar-separator"></span>
        <button 
          type="button"
          class="toolbar-btn" 
          (click)="insertLink()" 
          title="Inserir Link"
        >
          🔗
        </button>
        <button 
          type="button"
          class="toolbar-btn" 
          (click)="execCommand('insertUnorderedList')" 
          title="Lista"
        >
          ☰
        </button>
      </div>
      <div 
        #editor
        class="rich-editor-content"
        contenteditable="true"
        [attr.placeholder]="placeholder"
        (input)="onContentChange()"
        (blur)="onTouched()"
        (paste)="onPaste($event)"
      ></div>
    </div>
  `,
  styles: [`
    .rich-editor-container {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
      background: white;
    }

    .rich-editor-toolbar {
      display: flex;
      gap: 4px;
      padding: 8px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      flex-wrap: wrap;
    }

    .toolbar-btn {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      min-width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toolbar-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .toolbar-btn.active {
      background: #e0e7ff;
      border-color: #6366f1;
      color: #4f46e5;
    }

    .toolbar-separator {
      width: 1px;
      background: #d1d5db;
      margin: 0 4px;
    }

    .rich-editor-content {
      padding: 12px;
      min-height: 100px;
      max-height: 300px;
      overflow-y: auto;
      outline: none;
      font-size: 14px;
      line-height: 1.6;
    }

    .rich-editor-content:empty:before {
      content: attr(placeholder);
      color: #9ca3af;
      pointer-events: none;
    }

    .rich-editor-content:focus {
      outline: none;
    }

    .rich-editor-content a {
      color: #3b82f6;
      text-decoration: underline;
    }

    .rich-editor-content ul {
      margin: 8px 0;
      padding-left: 24px;
    }

    .rich-editor-content li {
      margin: 4px 0;
    }
  `]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @Input() placeholder = 'Digite aqui...';
  @ViewChild('editor', { static: false }) editorElement!: ElementRef<HTMLDivElement>;

  private onChange: (value: string) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: string): void {
    if (this.editorElement) {
      this.editorElement.nativeElement.innerHTML = value || '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  execCommand(command: string): void {
    document.execCommand(command, false);
    this.editorElement.nativeElement.focus();
    this.onContentChange();
  }

  isCommandActive(command: string): boolean {
    return document.queryCommandState(command);
  }

  insertLink(): void {
    let url = prompt('Digite a URL:');
    if (url) {
      // Auto-prepend https:// if protocol is missing
      if (!url.match(/^(https?:\/\/|mailto:|tel:|\/)/)) {
        url = 'https://' + url;
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (selectedText) {
          document.execCommand('createLink', false, url);
        } else {
          const link = document.createElement('a');
          link.href = url;
          link.textContent = url;
          link.target = '_blank';
          range.insertNode(link);
        }
        this.onContentChange();
      }
    }
  }

  onContentChange(): void {
    const html = this.editorElement.nativeElement.innerHTML;
    this.onChange(html);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }
}
