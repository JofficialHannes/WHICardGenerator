import { Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-image-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './image-config.html'
})
export class ImageConfigComponent {
  readonly cardService = inject(CardService);

  @ViewChild('cardImageInput')
  cardImageInput?: ElementRef<HTMLInputElement>;

  @Output() cardImageSelected = new EventEmitter<string>();
  @Output() cardImageRemoved = new EventEmitter<void>();

  onCanvasBackgroundColorChange(canvasBackgroundColor: string) {
    const config = this.cardService.imageConfig();
    this.cardService.imageConfig.set({ ...config, canvasBackgroundColor });
  }

  onXPositionChange(xPosition: number) {
    const config = this.cardService.imageConfig();
    this.cardService.imageConfig.set({ ...config, xPosition });
  }

  onYPositionChange(yPosition: number) {
    const config = this.cardService.imageConfig();
    this.cardService.imageConfig.set({ ...config, yPosition });
  }

  onScaleChange(scale: number) {
    const config = this.cardService.imageConfig();
    this.cardService.imageConfig.set({ ...config, scale });
  }

  onCardImageChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.cardImageSelected.emit(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  openCardImageDialog() {
    this.clearCardImageInput();

    const imageInput = this.cardImageInput?.nativeElement;
    if (!imageInput) {
      return;
    }

    imageInput.click();
  }

  removeCardImage() {
    this.clearCardImageInput();

    this.cardImageRemoved.emit();
  }

  clearCardImageInput() {
    const imageInput = this.cardImageInput?.nativeElement;
    if (!imageInput) {
      return;
    }

    imageInput.value = '';
  }
}
