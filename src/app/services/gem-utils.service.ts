import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class GemUtilsService {
  private readonly gemColors: { [key: string]: { fill: string; shine: string } } = {
    'ESMERALDA': { fill: '#10B981', shine: '#34D399' },
    'RUBI': { fill: '#EF4444', shine: '#F87171' },
    'SAFIRA': { fill: '#3B82F6', shine: '#60A5FA' },
    'DIAMANTE': { fill: '#E5E7EB', shine: '#F9FAFB' }
  };

  private readonly gemNames: { [key: string]: string } = {
    'ESMERALDA': 'Esmeralda',
    'RUBI': 'Rubi',
    'SAFIRA': 'Safira',
    'DIAMANTE': 'Diamante'
  };

  private readonly gemIcons: { [key: string]: string } = {
    'ESMERALDA': '💚',
    'RUBI': '❤️',
    'SAFIRA': '💙',
    'DIAMANTE': '💎'
  };

  private readonly gemDescriptions: { [key: string]: string } = {
    'ESMERALDA': 'Você deu os primeiros passos em sua jornada! A Esmeralda representa o início de grandes conquistas.',
    'RUBI': 'Seu progresso está impressionante! O Rubi simboliza a determinação e persistência.',
    'SAFIRA': 'Você está dominando o processo! A Safira representa sabedoria e excelência.',
    'DIAMANTE': 'Parabéns! Você alcançou o nível máximo! O Diamante é a prova de sua dedicação total.'
  };

  constructor(private sanitizer: DomSanitizer) { }

  getGemIcon(gemType: string, size: number = 24): SafeHtml {
    const color = this.gemColors[gemType] || this.gemColors['DIAMANTE'];
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 9L12 22L21 9L12 2Z" fill="${color.fill}" stroke="#1a202c" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 2L21 9L12 12L3 9L12 2Z" fill="${color.shine}" opacity="0.6"/>
      <line x1="3" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
      <line x1="21" y1="9" x2="12" y2="12" stroke="#1a202c" stroke-width="0.5" opacity="0.3"/>
    </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getGemEmoji(gemType: string | null): string {
    if (!gemType) return '💎';
    return this.gemIcons[gemType] || '💎';
  }

  getGemName(gemType: string | null): string {
    if (!gemType) return 'Desconhecida';
    return this.gemNames[gemType] || gemType;
  }

  getGemDescription(gemType: string | null): string {
    if (!gemType) return 'Continue progredindo!';
    return this.gemDescriptions[gemType] || 'Continue progredindo!';
  }

  getGemColor(gemType: string | null): string {
    if (!gemType) return '#6B7280';
    return this.gemColors[gemType]?.fill || '#6B7280';
  }
}
