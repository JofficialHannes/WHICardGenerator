import { CardRenderer, UnitRenderRequest } from '../../card-renderer';

export class UnitCardRenderer extends CardRenderer<UnitRenderRequest> {
  readonly titleFont = 'Century Schoolbook Bold';
  readonly titleFontSize = 40;
  readonly titleMinX = 300;
  readonly titleY = 645;
  readonly textFont = 'Century Schoolbook';
  readonly textFontSize = 25;
  readonly textX = 245;
  readonly textY = 775;
  readonly textBoxWidth = 440;
  readonly textBoxHeight = 240;

 override get titleMaxX(): number {
      return 775;
    }

  async render(request: UnitRenderRequest): Promise<string> {
    const cardImagePromise = request.cardImageSource
      ? request.loadImage(request.cardImageSource)
      : Promise.resolve(undefined);

    const loyaltyImagePromise = request.loyaltyImage
      ? request.loadImage(request.loyaltyImage).catch(() => undefined)
      : Promise.resolve(undefined);

    const costImagePromise = request.cardCost >= 0 && request.cardCost <= 6
      ? request.loadImage(`assets/symbols/cardCost/CardCost_${request.cardCost}.png`)
      : Promise.resolve(undefined);

    const healthImagePromise = request.unitConfig.unitHealth >= 1 && request.unitConfig.unitHealth <= 4
      ? request.loadImage(`assets/symbols/unitHealth/UnitHealth_${request.unitConfig.unitHealth}.png`)
      : Promise.resolve(undefined);

    const [unitOverlay, cardImage, powerImage, loyaltyImage, costImage, healthImage] = await Promise.all([
      request.loadImage(this.overlayImageForFaction(request.faction)),
      cardImagePromise,
      request.loadImage(request.powerImage),
      loyaltyImagePromise,
      costImagePromise,
      healthImagePromise
    ]);

    const { canvas, ctx } = this.createPreviewCanvas(request);
    if (cardImage) {
      const placement = request.syncImageBounds(cardImage);
      ctx.drawImage(cardImage, placement.xPosition, placement.yPosition, placement.scaledWidth, placement.scaledHeight);
    }

    ctx.drawImage(unitOverlay, 0, 0, request.canvasWidth, request.canvasHeight);

    this.drawCardText(ctx, request.cardTextConfig);

    this.drawCardTypeIndicator(ctx, request.cardType, 20, 170, 85);

    if (costImage) {
      ctx.drawImage(costImage, 56, 90);
    }

    this.drawLoyaltyIcons(ctx, loyaltyImage ?? powerImage, request.faction, request.cardLoyaltyCost);

    this.drawPowerIcons(ctx, powerImage, request.unitConfig.unitPower);

    if (healthImage) {
      ctx.drawImage(healthImage, 45, 865);
    }

    await this.drawCardSetInfo(ctx, request.cardSetConfig, request.loadImage);

    return canvas.toDataURL('image/png');
  }

  private overlayImageForFaction(faction: UnitRenderRequest['faction']): string {
    const factionNames: Record<UnitRenderRequest['faction'], string> = {
      'neutral': 'Neutral',
      'empire': 'Empire',
      'high-elves': 'High Elves',
      'dwarfs': 'Dwarfs'
    };

    return `assets/units/WHI CardGenerator - Unit Background - ${factionNames[faction]}.png`;
  }

  private drawPowerIcons(ctx: CanvasRenderingContext2D, powerImage: HTMLImageElement, unitPower: number): void {
    const iconPositions = [
      { x: 65, y: 680 },
      { x: 108, y: 720 },
      { x: 25, y: 640 },
      { x: 12, y: 700 }
    ];

    iconPositions
      .slice(0, unitPower)
      .forEach(({ x, y }) => ctx.drawImage(powerImage, x, y));
  }

  private drawLoyaltyIcons(
    ctx: CanvasRenderingContext2D,
    loyaltyImage: HTMLImageElement,
    faction: UnitRenderRequest['faction'],
    cardLoyaltyCost: number
  ): void {
    if (faction === 'neutral') {
      return;
    }

    const iconPositions = [
      { x: 68, y: 241 },
      { x: 58, y: 312 },
      { x: 63, y: 381 },
      { x: 81, y: 450 },
      { x: 115, y: 520 }
    ];

    const loyaltyCount = Math.max(0, Math.min(5, Math.round(cardLoyaltyCost)));
    iconPositions
      .slice(0, loyaltyCount)
      .forEach(({ x, y }) => ctx.drawImage(loyaltyImage, x, y));
  }

}
