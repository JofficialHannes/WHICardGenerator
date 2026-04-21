import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-card-set-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card-set-config.html',
})
export class CardSetConfigComponent {
  readonly cardService = inject(CardService);

  onShowCardSetChange(value: boolean) {
    const config = this.cardService.cardSetConfig();
    this.cardService.cardSetConfig.set({ ...config, showCardSet: value });
  }

  onCardSetNumberChange(value: number | string) {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || 1 : value;
    const config = this.cardService.cardSetConfig();
    this.cardService.cardSetConfig.set({ ...config, cardSetNumber: numValue });
  }

  onCardSetSymbolFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const config = this.cardService.cardSetConfig();
      this.cardService.cardSetConfig.set({ ...config, cardSetSymbol: dataUrl });
    };

    reader.readAsDataURL(file);
  }

  clearCardSetSymbol() {
    const fileInput = document.getElementById('cardSetSymbolInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    const config = this.cardService.cardSetConfig();
    this.cardService.cardSetConfig.set({ ...config, cardSetSymbol: null });
  }
}
