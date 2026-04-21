import { CardRenderer, SupportRenderRequest } from '../../card-renderer';

export class SupportCardRenderer extends CardRenderer<SupportRenderRequest> {
  readonly titleFont = 'Century Schoolbook Bold';
  readonly titleFontSize = 40;
  readonly titleMinX = 300;
  readonly titleY = 692;
  readonly textFont = 'Century Schoolbook';
  readonly textFontSize = 25;
  readonly textX = 100;
  readonly textY = 825;
  readonly textBoxWidth = 675;
  readonly textBoxHeight = 240;

    override get titleMaxX(): number {
      return 775 - this.titleMinX;
    }

  async render(request: SupportRenderRequest): Promise<string> {
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
      ctx.drawImage(costImage, 56, 107);
    }

    this.drawLoyaltyIcons(ctx, loyaltyImage ?? powerImage, request.faction, request.cardLoyaltyCost);

    this.drawCardText(ctx, request.cardTextConfig);

    this.drawCardTypeIndicator(ctx, request.cardType, 20, 170, 85);

    await this.drawCardSetInfo(ctx, request.cardSetConfig, request.loadImage);

    return canvas.toDataURL('image/png');
  }

  private overlayImageForFaction(faction: SupportRenderRequest['faction']): string {
    const factionNames: Record<'neutral' | 'high-elves', string> = {
      'neutral': 'Neutral',
      'high-elves': 'High Elves'
    };

    const supportedFaction = faction === 'high-elves' ? 'high-elves' : 'neutral';

    return `assets/support/WHI CardGenerator - Support Background - ${factionNames[supportedFaction]}.png`;
  }

  private drawLoyaltyIcons(
    ctx: CanvasRenderingContext2D,
    loyaltyImage: HTMLImageElement,
    faction: SupportRenderRequest['faction'],
    cardLoyaltyCost: number
  ): void {
    if (faction === 'neutral') {
      return;
    }

    const iconPositions = [
      { x: 70, y: 242 },
      { x: 70, y: 312 },
      { x: 70, y: 380 },
      { x: 70, y: 450 },
      { x: 70, y: 520 }
    ];

    const loyaltyCount = Math.max(0, Math.min(5, Math.round(cardLoyaltyCost)));
    iconPositions
      .slice(0, loyaltyCount)
      .forEach(({ x, y }) => ctx.drawImage(loyaltyImage, x, y));
  }

}
