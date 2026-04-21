import { CardFaction, CardType, CardSetConfig, SupportConfig, TacticsConfig, UnitConfig } from './card-model';

export type ImagePlacement = {
  xPosition: number;
  yPosition: number;
  scaledWidth: number;
  scaledHeight: number;
};

export type CardTextRenderConfig = {
  cardTitle: string;
  cardText: string;
  titleFontFamily: string;
  textFontFamily: string;
};

export type BaseRenderRequest = {
  canvasWidth: number;
  canvasHeight: number;
  cornerRadius: number;
  canvasBackgroundColor: string;
  cardImageSource?: string;
  faction: CardFaction;
  cardCost: number;
  cardLoyaltyCost: number;
  cardType: CardType;
  cardSetConfig: CardSetConfig;
  powerImage: string;
  loyaltyImage?: string;
  cardTextConfig: CardTextRenderConfig;
  loadImage: (source: string) => Promise<HTMLImageElement>;
  syncImageBounds: (cardImage: HTMLImageElement, resetPosition?: boolean) => ImagePlacement;
};

export type UnitRenderRequest = BaseRenderRequest & {
  unitConfig: UnitConfig;
};

export type SupportRenderRequest = BaseRenderRequest & {
  supportConfig: SupportConfig;
};

export type TacticsRenderRequest = BaseRenderRequest & {
  tacticsConfig: TacticsConfig;
};

type MarkupStyle = 'bold' | 'italic' | 'underline';

type MarkupToken = {
  content: string;
  styles: Set<MarkupStyle>;
};

type WrappedLine = MarkupToken[];

export abstract class CardRenderer<TRequest extends BaseRenderRequest> {
  abstract render(request: TRequest): Promise<string>;

  abstract readonly titleFont: string;
  abstract readonly titleFontSize: number;
  abstract readonly titleMinX: number;
  abstract readonly titleY: number;
  abstract readonly textFont: string;
  abstract readonly textFontSize: number;
  abstract readonly textX: number;
  abstract readonly textY: number;
  abstract readonly textBoxWidth: number;
  abstract readonly textBoxHeight: number;

  abstract get titleMaxX(): number;

  protected createPreviewCanvas(request: TRequest): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = request.canvasWidth;
    canvas.height = request.canvasHeight;

    ctx.beginPath();
    ctx.roundRect(0, 0, request.canvasWidth, request.canvasHeight, request.cornerRadius);
    ctx.clip();

    ctx.fillStyle = request.canvasBackgroundColor;
    ctx.fillRect(0, 0, request.canvasWidth, request.canvasHeight);

    return { canvas, ctx };
  }

  protected drawCardText(ctx: CanvasRenderingContext2D, config: CardTextRenderConfig): void {
    ctx.fillStyle = '#000000';
    ctx.font = `${this.titleFontSize}px ${config.titleFontFamily}`;
    const titleWidth = ctx.measureText(config.cardTitle).width;
    const centeredTitleX = this.titleMinX + (this.titleMaxX - this.titleMinX) / 2 - titleWidth / 2;
    ctx.fillText(config.cardTitle, centeredTitleX, this.titleY + 40);

    ctx.font = `${this.textFontSize}px ${config.textFontFamily}`;
    this.drawWrappedText(ctx, config.cardText, config.textFontFamily);
  }

  protected drawCardTypeIndicator(ctx: CanvasRenderingContext2D, cardType: CardType, minX: number, maxX: number, y: number): void {
    const cardTypeText = cardType.toUpperCase();
    const firstLetter = cardTypeText.charAt(0);
    const remainingLetters = cardTypeText.slice(1);

    ctx.fillStyle = '#000000';

    // Measure the full text to center it
    ctx.font = `bold 20px ${this.titleFont}`;
    const firstLetterWidth = ctx.measureText(firstLetter).width;

    ctx.font = `15px ${this.titleFont}`;
    const remainingLettersWidth = ctx.measureText(remainingLetters).width;

    const totalWidth = firstLetterWidth + remainingLettersWidth - 2;
    const centerX = minX + (maxX - minX) / 2;
    const startX = centerX - totalWidth / 2;

    ctx.font = `bold 20px ${this.titleFont}`;
    ctx.fillText(firstLetter, startX, y);

    ctx.font = `15px ${this.titleFont}`;
    ctx.fillText(remainingLetters, startX + firstLetterWidth - 2, y);
  }

  protected async drawCardSetInfo(ctx: CanvasRenderingContext2D, cardSetConfig: CardSetConfig, loadImage: (source: string) => Promise<HTMLImageElement>): Promise<void> {
    if (!cardSetConfig.showCardSet) {
      return;
    }

    const symbolSize = 40;
    const padding = 10;
    const bottomMargin = 15;
    const symbolX = padding;
    const symbolY = ctx.canvas.height - symbolSize - bottomMargin;

    // Draw card set number next to symbol
    const textX = symbolX + symbolSize + padding;
    const textY = symbolY + symbolSize - 5;

    ctx.fillStyle = '#000000';
    ctx.font = `bold 24px ${this.titleFont}`;
    ctx.fillText(`#${cardSetConfig.cardSetNumber}`, textX, textY);

    // Draw symbol if available
    if (cardSetConfig.cardSetSymbol) {
      try {
        const symbolImage = await loadImage(cardSetConfig.cardSetSymbol);
        ctx.drawImage(symbolImage, symbolX, symbolY, symbolSize, symbolSize);
      } catch (error) {
        console.warn('Could not load card set symbol image', error);
      }
    }
  }

  protected loadImage(source: string): Promise<HTMLImageElement> {
    throw new Error('loadImage must be overridden');
  }

  private drawWrappedText(ctx: CanvasRenderingContext2D, cardText: string, textFontFamily: string): void {
    const lineHeight = this.textFontSize * 1.2;
    const maxLines = Math.max(1, Math.floor(this.textBoxHeight / lineHeight));
    const paragraphs = cardText.split(/\r?\n/);
    const lines: WrappedLine[] = [];

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        lines.push([]);
        continue;
      }
      lines.push(...this.wrapParagraphWithMarkup(ctx, paragraph, this.textBoxWidth, textFontFamily));
    }

    lines.slice(0, maxLines).forEach((line, lineIndex) => {
      let xOffset = this.textX;
      line.forEach((token, tokenIndex) => {
        const wasStyle = ctx.font;
        this.applyMarkupStyle(ctx, token.styles, textFontFamily);
        ctx.fillText(token.content, xOffset, this.textY + this.textFontSize + lineIndex * lineHeight);
        xOffset += ctx.measureText(token.content).width;
        if (tokenIndex < line.length - 1) {
          xOffset += ctx.measureText(' ').width;
        }
        ctx.font = wasStyle;
      });
    });
  }

  private applyMarkupStyle(ctx: CanvasRenderingContext2D, styles: Set<MarkupStyle>, textFontFamily: string): void {
    const baseFont = `${this.textFontSize}px ${textFontFamily}`;
    let font = '';
    if (styles.has('bold')) font += 'bold ';
    if (styles.has('italic')) font += 'italic ';
    font += baseFont;
    ctx.font = font;
  }

  private wrapParagraphWithMarkup(
    ctx: CanvasRenderingContext2D,
    paragraph: string,
    maxWidth: number,
    textFontFamily: string
  ): WrappedLine[] {
    const tokens = this.parseMarkup(paragraph);
    const words: MarkupToken[] = [];

    for (const token of tokens) {
      for (const word of token.content.split(/\s+/).filter(Boolean)) {
        words.push({ content: word, styles: new Set(token.styles) });
      }
    }

    if (words.length === 0) {
      return [[]];
    }

    const lines: WrappedLine[] = [];
    let currentLine: WrappedLine = [words[0]];

    for (let i = 1; i < words.length; i++) {
      const candidateLine = [...currentLine, words[i]];
      if (this.measureMarkupWidth(ctx, candidateLine, textFontFamily) <= maxWidth) {
        currentLine = candidateLine;
      } else {
        lines.push(currentLine);
        currentLine = [words[i]];
      }
    }

    lines.push(currentLine);
    return lines;
  }

  private measureMarkupWidth(ctx: CanvasRenderingContext2D, tokens: MarkupToken[], textFontFamily: string): number {
    const wasStyle = ctx.font;
    let width = 0;

    for (let i = 0; i < tokens.length; i++) {
      this.applyMarkupStyle(ctx, tokens[i].styles, textFontFamily);
      width += ctx.measureText(tokens[i].content).width;
      if (i < tokens.length - 1) {
        width += ctx.measureText(' ').width;
      }
    }

    ctx.font = wasStyle;
    return width;
  }

  private parseMarkup(text: string, styles: Set<MarkupStyle> = new Set()): MarkupToken[] {
    const tokens: MarkupToken[] = [];
    let pos = 0;

    while (pos < text.length) {
      const tagMatch = text.substring(pos).match(/^<(b|i|u)>/);

      if (tagMatch) {
        const tag = tagMatch[1] as 'b' | 'i' | 'u';
        const closingTag = `</${tag}>`;
        const closingIndex = text.indexOf(closingTag, pos + tagMatch[0].length);

        if (closingIndex !== -1) {
          const innerText = text.substring(pos + tagMatch[0].length, closingIndex);
          const newStyles = new Set(styles);
          const styleMap: Record<'b' | 'i' | 'u', MarkupStyle> = { b: 'bold', i: 'italic', u: 'underline' };
          newStyles.add(styleMap[tag]);
          tokens.push(...this.parseMarkup(innerText, newStyles));
          pos = closingIndex + closingTag.length;
          continue;
        }
      }

      const nextTagIndex = text.indexOf('<', pos + 1);
      const textEnd = nextTagIndex !== -1 ? nextTagIndex : text.length;
      const plainText = text.substring(pos, textEnd);
      if (plainText) {
        tokens.push({ content: plainText, styles: new Set(styles) });
      }
      pos = textEnd;
    }

    return tokens.length > 0 ? tokens : [{ content: text, styles }];
  }
}

/**
 * Helper utility functions for rendering
 */
export class RenderingUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static normalizeScale(scale: number, minScale: number, maxScale: number): number {
    return this.clamp(scale, minScale, maxScale);
  }

  static getScaledImageMetrics(cardImage: HTMLImageElement, scale: number) {
    const scaledWidth = cardImage.width * scale;
    const scaledHeight = cardImage.height * scale;
    return { scaledWidth, scaledHeight };
  }
}

/**
 * Orchestrates the rendering of a card using the appropriate renderer based on card type.
 */
export class CardRenderingOrchestrator {
  constructor(
    private readonly unitRenderer: CardRenderer<UnitRenderRequest>,
    private readonly supportRenderer: CardRenderer<SupportRenderRequest>,
    private readonly tacticsRenderer: CardRenderer<TacticsRenderRequest>,
    private readonly minScale: number,
    private readonly maxScale: number,
    private readonly canvasWidth: number,
    private readonly canvasHeight: number,
    private readonly cornerRadius: number
  ) {}

  async renderCard(
    cardService: { cardType: () => CardType; faction: () => CardFaction; cardCost: () => number; cardLoyaltyCost: () => number; textConfig: () => CardTextRenderConfig; imageConfig: () => { xPosition: number; yPosition: number; scale: number; canvasBackgroundColor: string }; unitConfig: () => UnitConfig; supportConfig: () => SupportConfig; tacticsConfig: () => TacticsConfig; cardSetConfig: () => CardSetConfig; cardImageSource: () => string | ArrayBuffer | null; minXPosition: { set: (v: number) => void }; maxXPosition: { set: (v: number) => void }; minYPosition: { set: (v: number) => void }; maxYPosition: { set: (v: number) => void } },
    powerImage: string,
    loyaltyImage: string | undefined,
    loadImage: (source: string) => Promise<HTMLImageElement>
  ): Promise<string> {
    console.log('renderCard() called with cardType:', cardService.cardType());

    const syncImageBounds = (cardImage: HTMLImageElement, resetPosition = false) => {
      return this.syncImageBoundsInService(cardService, cardImage, resetPosition);
    };

    const baseRequest = {
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      cornerRadius: this.cornerRadius,
      canvasBackgroundColor: cardService.imageConfig().canvasBackgroundColor,
      cardImageSource: typeof cardService.cardImageSource() === 'string' ? (cardService.cardImageSource() as string) : undefined,
      faction: cardService.faction(),
      cardCost: cardService.cardCost(),
      cardLoyaltyCost: cardService.cardLoyaltyCost(),
      cardType: cardService.cardType(),
      cardSetConfig: cardService.cardSetConfig(),
      powerImage,
      loyaltyImage,
      cardTextConfig: cardService.textConfig(),
      loadImage,
      syncImageBounds
    };

    console.log('About to render card type:', cardService.cardType());

    if (cardService.cardType() === 'support') {
      const renderedImage = await this.supportRenderer.render({
        ...baseRequest,
        supportConfig: cardService.supportConfig()
      });
      console.log('Support card rendered, image length:', renderedImage.length);
      return renderedImage;
    } else if (cardService.cardType() === 'tactics') {
      const renderedImage = await this.tacticsRenderer.render({
        ...baseRequest,
        tacticsConfig: cardService.tacticsConfig()
      });
      console.log('Tactics card rendered, image length:', renderedImage.length);
      return renderedImage;
    } else {
      const renderedImage = await this.unitRenderer.render({
        ...baseRequest,
        unitConfig: cardService.unitConfig()
      });
      console.log('Unit card rendered, image length:', renderedImage.length);
      return renderedImage;
    }
  }

  private syncImageBoundsInService(
    cardService: any,
    cardImage: HTMLImageElement,
    resetPosition = false
  ) {
    const imageConfig = cardService.imageConfig();
    const { scaledWidth, scaledHeight } = RenderingUtils.getScaledImageMetrics(
      cardImage,
      RenderingUtils.normalizeScale(imageConfig.scale, this.minScale, this.maxScale)
    );

    cardService.minXPosition.set(-scaledWidth);
    cardService.maxXPosition.set(this.canvasWidth);
    cardService.minYPosition.set(-scaledHeight);
    cardService.maxYPosition.set(this.canvasHeight);

    if (resetPosition) {
      cardService.imageConfig.set({
        ...imageConfig,
        xPosition: (this.canvasWidth - scaledWidth) / 2,
        yPosition: 0
      });

      return {
        xPosition: cardService.imageConfig().xPosition,
        yPosition: cardService.imageConfig().yPosition,
        scaledWidth,
        scaledHeight
      };
    }

    cardService.imageConfig.set({
      ...imageConfig,
      xPosition: RenderingUtils.clamp(
        imageConfig.xPosition,
        cardService.minXPosition(),
        cardService.maxXPosition()
      ),
      yPosition: RenderingUtils.clamp(
        imageConfig.yPosition,
        cardService.minYPosition(),
        cardService.maxYPosition()
      )
    });

    return {
      xPosition: cardService.imageConfig().xPosition,
      yPosition: cardService.imageConfig().yPosition,
      scaledWidth,
      scaledHeight
    };
  }
}


