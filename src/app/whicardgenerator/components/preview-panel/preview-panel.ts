import { Component, EventEmitter, Input, Output, ViewEncapsulation, inject, signal } from '@angular/core';
import { CardService } from '../../card.service';
import { CardRenderingOrchestrator, RenderingUtils } from '../../card-renderer';
import { UnitCardRenderer } from '../unit/unit-card-renderer';
import { SupportCardRenderer } from '../support/support-card-renderer';
import { TacticsCardRenderer } from '../tactics/tactics-card-renderer';
import { CardFaction } from '../../card-model';

@Component({
  selector: 'app-preview-panel',
  standalone: true,
  templateUrl: './preview-panel.html',
  encapsulation: ViewEncapsulation.None
})
export class PreviewPanelComponent {
  readonly cardService = inject(CardService);

  @Input() cornerRadius = 50;
  @Output() downloadRequested = new EventEmitter<void>();

  private readonly minScale = 0.1;
  private readonly maxScale = 5;
  private readonly canvasWidth = 745;
  private readonly canvasHeight = 1045;
  private readonly powerImage = 'assets/symbols/Power.png';

  private readonly unitCardRenderer = new UnitCardRenderer();
  private readonly supportCardRenderer = new SupportCardRenderer();
  private readonly tacticsCardRenderer = new TacticsCardRenderer();
  private readonly renderingOrchestrator = new CardRenderingOrchestrator(
    this.unitCardRenderer,
    this.supportCardRenderer,
    this.tacticsCardRenderer,
    this.minScale,
    this.maxScale,
    this.canvasWidth,
    this.canvasHeight,
    this.cornerRadius
  );

  readonly combinedImage = signal<string | null>(null);

  /**
   * Renders the combined card preview into a canvas and stores it as a Data URL.
   */
  async renderPreview() {
    try {
      const renderedImage = await this.renderingOrchestrator.renderCard(
        this.cardService,
        this.powerImage,
        this.getLoyaltyImageForFaction(this.cardService.faction()),
        (source: string) => this.loadImage(source)
      );
      this.combinedImage.set(renderedImage);
      console.log('combinedImage signal set successfully');
    } catch (error) {
      console.error('Preview could not be rendered.', error);
    }
  }

  /**
   * Loads an image asynchronously and returns the HTMLImageElement.
   */
  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${source}`));
      image.src = source.startsWith('data:') ? source : encodeURI(source);
    });
  }

  private getLoyaltyImageForFaction(faction: CardFaction): string | undefined {
    if (faction === 'neutral') {
      return undefined;
    }

    const loyaltySymbols: Record<Exclude<CardFaction, 'neutral'>, string> = {
      empire: 'assets/symbols/loyaltyCosts/WHI CardGenerator - Loyalty Costs - Empire.png',
      'high-elves': 'assets/symbols/loyaltyCosts/WHI CardGenerator - Loyalty Costs - High Elves.png',
      dwarfs: 'assets/symbols/loyaltyCosts/WHI CardGenerator - Loyalty Costs - Dwarfs.png'
    };

    return loyaltySymbols[faction];
  }
}
