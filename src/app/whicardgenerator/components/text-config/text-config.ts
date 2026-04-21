import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-text-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './text-config.html'
})
export class TextConfigComponent {
  readonly cardService = inject(CardService);

  readonly fontOptions = [
    'Century Schoolbook',
    'Century Schoolbook Bold',
    'Times New Roman',
    'Garamond',
    'Georgia',
    'Palatino Linotype',
    'Book Antiqua',
    'Trebuchet MS',
    'Arial',
    'Verdana'
  ];

  onCardTitleChange(cardTitle: string) {
    const config = this.cardService.textConfig();
    this.cardService.textConfig.set({ ...config, cardTitle });
  }

  onCardTextChange(cardText: string) {
    const config = this.cardService.textConfig();
    this.cardService.textConfig.set({ ...config, cardText });
  }

  onTitleFontFamilyChange(titleFontFamily: string) {
    const config = this.cardService.textConfig();
    this.cardService.textConfig.set({ ...config, titleFontFamily });
  }

  onTextFontFamilyChange(textFontFamily: string) {
    const config = this.cardService.textConfig();
    this.cardService.textConfig.set({ ...config, textFontFamily });
  }
}
