import { AfterViewInit, Component, ViewChild, ViewEncapsulation, effect, inject } from '@angular/core';
import { CardFaction } from './card-model';
import { ActionsConfigComponent } from './components/actions-config/actions-config';
import { CardSetConfigComponent } from './components/card-set-config/card-set-config';
import { CardTypeConfigComponent } from './components/card-type-config/card-type-config';
import { CostConfigComponent } from './components/cost-config/cost-config';
import { ImageConfigComponent } from './components/image-config/image-config';
import { PreviewPanelComponent } from './components/preview-panel/preview-panel';
import { TextConfigComponent } from './components/text-config/text-config';
import { SupportConfigComponent } from './components/support/support-config';
import { TacticsConfigComponent } from './components/tactics/tactics-config';
import { UnitConfigComponent } from './components/unit/unit-config';
import { CardService } from './card.service';
import { RenderingUtils } from './card-renderer';

@Component({
  selector: 'app-whicardgenerator',
  standalone: true,
  templateUrl: './whicardgenerator.html',
  styleUrls: ['./whicardgenerator.css'],
  imports: [
    CardTypeConfigComponent,
    CostConfigComponent,
    TextConfigComponent,
    UnitConfigComponent,
    SupportConfigComponent,
    TacticsConfigComponent,
    CardSetConfigComponent,
    ImageConfigComponent,
    ActionsConfigComponent,
    PreviewPanelComponent
  ],
  providers: [CardService],
  encapsulation: ViewEncapsulation.None
})
export class WhiCardGenerator implements AfterViewInit {
  readonly cardService = inject(CardService);

  @ViewChild(ImageConfigComponent)
  imageConfigComponent?: ImageConfigComponent;

  @ViewChild(PreviewPanelComponent)
  previewPanelComponent?: PreviewPanelComponent;

  private readonly minScale = 0.1;
  private readonly maxScale = 5;
  private readonly canvasWidth = 745;
  private readonly canvasHeight = 1045;
  readonly cornerRadius = 50;

  // Setup reactive preview updates whenever state changes
  private readonly previewEffect = effect(() => {
    // Trigger effect on any state change
    this.cardService.cardType();
    this.cardService.faction();
    this.cardService.cardCost();
    this.cardService.cardLoyaltyCost();
    this.cardService.textConfig();
    this.cardService.imageConfig();
    this.cardService.unitConfig();
    this.cardService.supportConfig();
    this.cardService.tacticsConfig();
    this.cardService.cardSetConfig();
    this.cardService.cardImageSource();

    void this.previewPanelComponent?.renderPreview();
  });

  ngAfterViewInit() {
    void this.previewPanelComponent?.renderPreview();
  }

  get excludedFactionsForCardType(): CardFaction[] {
    return this.cardService.excludedFactionsForCardType;
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

  /**
   * Clamps a value to a defined minimum and maximum.
   */
  private clamp(value: number, min: number, max: number): number {
    return RenderingUtils.clamp(value, min, max);
  }

  /**
   * Applies the allowed zoom range.
   */
  private normalizeScale(scale: number): number {
    return RenderingUtils.normalizeScale(scale, this.minScale, this.maxScale);
  }

  /**
   * Synchronizes allowed position bounds and optionally resets the start position.
   */
  private syncImageBounds(cardImage: HTMLImageElement, resetPosition = false) {
    const scale = RenderingUtils.normalizeScale(this.cardService.imageConfig().scale, this.minScale, this.maxScale);
    const { scaledWidth, scaledHeight } = RenderingUtils.getScaledImageMetrics(cardImage, scale);

    this.cardService.minXPosition.set(-scaledWidth);
    this.cardService.maxXPosition.set(this.canvasWidth);
    this.cardService.minYPosition.set(-scaledHeight);
    this.cardService.maxYPosition.set(this.canvasHeight);

    if (resetPosition) {
      const imageConfig = this.cardService.imageConfig();
      this.cardService.imageConfig.set({
        ...imageConfig,
        xPosition: (this.canvasWidth - scaledWidth) / 2,
        yPosition: 0
      });

      return {
        xPosition: this.cardService.imageConfig().xPosition,
        yPosition: this.cardService.imageConfig().yPosition,
        scaledWidth,
        scaledHeight
      };
    }

    const imageConfig = this.cardService.imageConfig();
    this.cardService.imageConfig.set({
      ...imageConfig,
      xPosition: this.clamp(imageConfig.xPosition, this.cardService.minXPosition(), this.cardService.maxXPosition()),
      yPosition: this.clamp(imageConfig.yPosition, this.cardService.minYPosition(), this.cardService.maxYPosition())
    });

    return {
      xPosition: this.cardService.imageConfig().xPosition,
      yPosition: this.cardService.imageConfig().yPosition,
      scaledWidth,
      scaledHeight
    };
  }

  async onResetRequested() {
    const shouldReset = window.confirm('Reset all settings to defaults?');
    if (!shouldReset) {
      return;
    }

    this.cardService.reset();
    this.imageConfigComponent?.clearCardImageInput();
    await this.previewPanelComponent?.renderPreview();
  }

  /**
   * Applies an imported configuration and refreshes dependent UI state.
   */
  onConfigImported(importedConfig: unknown) {
    this.cardService.applyImportedConfig(
      importedConfig,
      (scale) => this.normalizeScale(scale),
      (value, min, max) => this.clamp(value, min, max)
    );

    void this.previewPanelComponent?.renderPreview();
  }

  /**
   * Applies a selected card image source, sets start values, and updates the preview.
   */
  async onCardImageSelected(cardImageSource: string) {
    this.cardService.cardImageSource.set(cardImageSource);

    try {
      const cardImage = await this.loadImage(cardImageSource);
      this.cardService.imageConfig.set({
        ...this.cardService.imageConfig(),
        scale: this.normalizeScale(this.canvasWidth / cardImage.width)
      });
      this.syncImageBounds(cardImage, true);
    } catch (error) {
      console.error('Selected image could not be loaded.', error);
      this.cardService.cardImageSource.set(null);
    }

    await this.previewPanelComponent?.renderPreview();
  }

  onCardImageRemoved() {
    this.cardService.cardImageSource.set(null);
    this.cardService.minXPosition.set(0);
    this.cardService.maxXPosition.set(0);
    this.cardService.minYPosition.set(0);
    this.cardService.maxYPosition.set(0);
    void this.previewPanelComponent?.renderPreview();
  }

  /**
   * Renders the combined card preview into a canvas and stores it as a Data URL.
   */
  async updatePreview() {
    await this.previewPanelComponent?.renderPreview();
  }

  /**
   * Starts the download of the currently rendered card.
   */
  downloadImage() {
    const imageUrl = this.previewPanelComponent?.combinedImage();
    if (!imageUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `WHI_${this.cardService.textConfig().cardTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || 'Card'}.png`;
    link.click();
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
