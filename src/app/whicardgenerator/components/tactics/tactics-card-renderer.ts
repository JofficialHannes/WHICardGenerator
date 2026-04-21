import { CardRenderer, TacticsRenderRequest } from '../../card-renderer';

export class TacticsCardRenderer extends CardRenderer<TacticsRenderRequest> {
  
    readonly titleFont = 'Century Schoolbook Bold';
    readonly titleFontSize = 40;
    readonly titleMinX = 100;
    readonly titleY = 30;
    
    readonly textFont = 'Century Schoolbook';
    readonly textFontSize = 25;
    readonly textX = 75;
    readonly textY = 750;
    readonly textBoxWidth = 440;
    readonly textBoxHeight = 240;

 override get titleMaxX(): number {
      return 775;
    }

  async render(request: TacticsRenderRequest): Promise<string> {
    const cardImagePromise = request.cardImageSource
      ? request.loadImage(request.cardImageSource)
      : Promise.resolve(undefined);

    const loyaltyImagePromise = request.loyaltyImage
      ? request.loadImage(request.loyaltyImage).catch(() => undefined)
      : Promise.resolve(undefined);

    const powerImagePromise = request.loadImage(request.powerImage);

    
    const costImagePromise = request.cardCost >= 0 && request.cardCost <= 6
      ? request.loadImage(`assets/symbols/cardCost/CardCost_${request.cardCost}.png`)
      : Promise.resolve(undefined);

    const [overlayImage, cardImage, loyaltyImage, powerImage, costImage] = await Promise.all([
      request.loadImage(this.overlayImageForFaction(request.faction)),
      cardImagePromise,
      loyaltyImagePromise,
      powerImagePromise,
      costImagePromise
    ]);

    const { canvas, ctx } = this.createPreviewCanvas(request);
    if (cardImage) {
      const placement = request.syncImageBounds(cardImage);
      ctx.drawImage(cardImage, placement.xPosition, placement.yPosition, placement.scaledWidth, placement.scaledHeight);
    }

    ctx.drawImage(overlayImage, 0, 0, request.canvasWidth, request.canvasHeight);

    if (costImage) {
      ctx.drawImage(costImage, 62, 80);
    }

    this.drawLoyaltyIcons(ctx, loyaltyImage ?? powerImage, request.faction, request.cardLoyaltyCost);

    this.drawCardText(ctx, request.cardTextConfig);

    this.drawCardTypeIndicator(ctx, request.cardType, 35, 170, 80);

    await this.drawCardSetInfo(ctx, request.cardSetConfig, request.loadImage);

    return canvas.toDataURL('image/png');
  }

  private overlayImageForFaction(faction: TacticsRenderRequest['faction']): string {
    const factionNames: Record<'neutral' | 'high-elves', string> = {
      'neutral': 'Neutral',
      'high-elves': 'High Elves'
    };

    const supportedFaction = faction === 'high-elves' ? 'high-elves' : 'neutral';

    return `assets/tactics/WHI CardGenerator - Tactics Background - ${factionNames[supportedFaction]}.png`;
  }

  private drawLoyaltyIcons(
    ctx: CanvasRenderingContext2D,
    loyaltyImage: HTMLImageElement,
    faction: TacticsRenderRequest['faction'],
    cardLoyaltyCost: number
  ): void {
    if (faction === 'neutral') {
      return;
    }

    const iconPositions = [
      { x: 79, y: 246 },
      { x: 79, y: 315 },
      { x: 79, y: 384 },
      { x: 79, y: 455 },
      { x: 79, y: 524 }
    ];

    const loyaltyCount = Math.max(0, Math.min(5, Math.round(cardLoyaltyCost)));
    iconPositions
      .slice(0, loyaltyCount)
      .forEach(({ x, y }) => ctx.drawImage(loyaltyImage, x, y));
  }

}
