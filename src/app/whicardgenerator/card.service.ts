import { Injectable, effect, signal } from '@angular/core';
import {
  CardFaction,
  CardModel,
  CardSetConfig,
  CardType,
  SharedImageConfig,
  SharedTextConfig,
  SupportConfig,
  TacticsConfig,
  UnitConfig
} from './card-model';

@Injectable()
export class CardService {
  private readonly defaultCardType: CardType = 'unit';
  private readonly defaultFaction: CardFaction = 'neutral';
  private readonly defaultCardCost = 2;
  private readonly defaultCardLoyaltyCost = 0;
  private readonly defaultTextConfig: SharedTextConfig = {
    cardTitle: 'Card Title',
    cardText: '<i><b>Action:</b></i> Sample text.',
    titleFontFamily: 'Century Schoolbook Bold',
    textFontFamily: 'Century Schoolbook'
  };
  private readonly defaultImageConfig: SharedImageConfig = {
    xPosition: 0,
    yPosition: 0,
    scale: 1,
    canvasBackgroundColor: '#ffffff'
  };
  private readonly defaultUnitConfig: UnitConfig = {
    unitPower: 1,
    unitHealth: 1
  };
  private readonly defaultSupportConfig: SupportConfig = {
    supportShield: 1
  };
  private readonly defaultTacticsConfig: TacticsConfig = {
    tacticsPotency: 1
  };
  private readonly defaultCardSetConfig: CardSetConfig = {
    showCardSet: false,
    cardSetSymbol: null,
    cardSetNumber: 1
  };

  readonly cardType = signal<CardType>(this.defaultCardType);
  readonly faction = signal<CardFaction>(this.defaultFaction);
  readonly cardCost = signal(this.defaultCardCost);
  readonly cardLoyaltyCost = signal(this.defaultCardLoyaltyCost);
  readonly textConfig = signal<SharedTextConfig>({ ...this.defaultTextConfig });
  readonly imageConfig = signal<SharedImageConfig>({ ...this.defaultImageConfig });
  readonly unitConfig = signal<UnitConfig>({ ...this.defaultUnitConfig });
  readonly supportConfig = signal<SupportConfig>({ ...this.defaultSupportConfig });
  readonly tacticsConfig = signal<TacticsConfig>({ ...this.defaultTacticsConfig });
  readonly cardSetConfig = signal<CardSetConfig>({ ...this.defaultCardSetConfig });
  readonly cardImageSource = signal<string | ArrayBuffer | null>(null);

  readonly minXPosition = signal(0);
  readonly maxXPosition = signal(0);
  readonly minYPosition = signal(0);
  readonly maxYPosition = signal(0);

  get hasCardImageSelected(): boolean {
    const source = this.cardImageSource();
    return typeof source === 'string' && source.length > 0;
  }

  get excludedFactionsForCardType(): CardFaction[] {
    if (this.cardType() === 'unit') {
      return [];
    }

    return ['empire', 'dwarfs'];
  }

  normalizeFactionForCardType(cardType: CardType, faction: CardFaction): CardFaction {
    if (cardType === 'unit') {
      return faction;
    }

    if (faction === 'neutral' || faction === 'high-elves') {
      return faction;
    }

    return 'neutral';
  }

  reset() {
    this.cardType.set(this.defaultCardType);
    this.faction.set(this.defaultFaction);
    this.cardCost.set(this.defaultCardCost);
    this.cardLoyaltyCost.set(this.defaultCardLoyaltyCost);
    this.textConfig.set({ ...this.defaultTextConfig });
    this.imageConfig.set({ ...this.defaultImageConfig });
    this.unitConfig.set({ ...this.defaultUnitConfig });
    this.supportConfig.set({ ...this.defaultSupportConfig });
    this.tacticsConfig.set({ ...this.defaultTacticsConfig });
    this.cardSetConfig.set({ ...this.defaultCardSetConfig });
    this.cardImageSource.set(null);
    this.minXPosition.set(0);
    this.maxXPosition.set(0);
    this.minYPosition.set(0);
    this.maxYPosition.set(0);
  }

  get exportCardModel(): CardModel {
    const sharedConfig = {
      faction: this.faction(),
      cardCost: this.cardCost(),
      cardLoyaltyCost: this.cardLoyaltyCost(),
      cardImageSource: typeof this.cardImageSource() === 'string' ? (this.cardImageSource() as string) : undefined,
      textConfig: { ...this.textConfig() },
      imageConfig: { ...this.imageConfig() },
      cardSetConfig: { ...this.cardSetConfig() }
    };

    if (this.cardType() === 'support') {
      return {
        cardType: 'support',
        ...sharedConfig,
        supportConfig: { ...this.supportConfig() }
      };
    }

    if (this.cardType() === 'tactics') {
      return {
        cardType: 'tactics',
        ...sharedConfig,
        tacticsConfig: { ...this.tacticsConfig() }
      };
    }

    return {
      cardType: 'unit',
      ...sharedConfig,
      unitConfig: { ...this.unitConfig() }
    };
  }

  get exportConfigFileName(): string {
    const sanitizedTitle = this.textConfig().cardTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || 'Card';
    return `WHI_${sanitizedTitle}`;
  }

  applyImportedConfig(config: unknown, normalizeScale: (scale: number) => number, clamp: (value: number, min: number, max: number) => number): boolean {
    if (!this.isRecord(config)) {
      return false;
    }

    if (!('cardType' in config) || !('textConfig' in config) || !('imageConfig' in config)) {
      return false;
    }

    let hasImportedCardImage = false;

    if ('cardImageSource' in config && typeof config['cardImageSource'] === 'string') {
      this.cardImageSource.set(config['cardImageSource']);
      hasImportedCardImage = true;
    }

    const importedCardType = this.safeCardType(config['cardType'], this.cardType());
    this.cardType.set(importedCardType);

    const importedFaction = this.safeFaction(config['faction'], this.faction());
    this.faction.set(this.normalizeFactionForCardType(importedCardType, importedFaction));
    this.cardCost.set(clamp(Math.round(this.safeNumber(config['cardCost'], this.cardCost())), 0, 6));
    this.cardLoyaltyCost.set(clamp(Math.round(this.safeNumber(config['cardLoyaltyCost'], this.cardLoyaltyCost())), 0, 5));

    const textConfig = this.isRecord(config['textConfig']) ? config['textConfig'] : {};
    const imageConfig = this.isRecord(config['imageConfig']) ? config['imageConfig'] : {};
    const cardSetConfig = this.isRecord(config['cardSetConfig']) ? config['cardSetConfig'] : {};

    this.textConfig.set({
      cardTitle: this.safeString(textConfig['cardTitle'], this.textConfig().cardTitle),
      cardText: this.safeString(textConfig['cardText'], this.textConfig().cardText),
      titleFontFamily: this.safeString(textConfig['titleFontFamily'], this.textConfig().titleFontFamily),
      textFontFamily: this.safeString(textConfig['textFontFamily'], this.textConfig().textFontFamily)
    });

    this.imageConfig.set({
      xPosition: this.safeNumber(imageConfig['xPosition'], this.imageConfig().xPosition),
      yPosition: this.safeNumber(imageConfig['yPosition'], this.imageConfig().yPosition),
      scale: normalizeScale(this.safeNumber(imageConfig['scale'], this.imageConfig().scale)),
      canvasBackgroundColor: this.safeColor(imageConfig['canvasBackgroundColor'], this.imageConfig().canvasBackgroundColor)
    });

    this.cardSetConfig.set({
      showCardSet: this.safeBoolean(cardSetConfig['showCardSet'], this.cardSetConfig().showCardSet),
      cardSetSymbol: typeof cardSetConfig['cardSetSymbol'] === 'string' ? cardSetConfig['cardSetSymbol'] : this.cardSetConfig().cardSetSymbol,
      cardSetNumber: clamp(Math.round(this.safeNumber(cardSetConfig['cardSetNumber'], this.cardSetConfig().cardSetNumber)), 1, 999)
    });

    if (importedCardType === 'support') {
      const supportConfig = this.isRecord(config['supportConfig']) ? config['supportConfig'] : {};
      this.supportConfig.set({
        supportShield: clamp(Math.round(this.safeNumber(supportConfig['supportShield'], this.supportConfig().supportShield)), 1, 5)
      });
      return hasImportedCardImage;
    }

    if (importedCardType === 'tactics') {
      const tacticsConfig = this.isRecord(config['tacticsConfig']) ? config['tacticsConfig'] : {};
      this.tacticsConfig.set({
        tacticsPotency: clamp(Math.round(this.safeNumber(tacticsConfig['tacticsPotency'], this.tacticsConfig().tacticsPotency)), 1, 5)
      });
      return hasImportedCardImage;
    }

    const unitConfig = this.isRecord(config['unitConfig']) ? config['unitConfig'] : {};
    this.unitConfig.set({
      unitPower: clamp(Math.round(this.safeNumber(unitConfig['unitPower'], this.unitConfig().unitPower)), 0, 4),
      unitHealth: clamp(Math.round(this.safeNumber(unitConfig['unitHealth'], this.unitConfig().unitHealth)), 1, 4)
    });

    return hasImportedCardImage;
  }

  private safeCardType(value: unknown, fallback: CardType): CardType {
    if (value === 'unit' || value === 'support' || value === 'tactics') {
      return value;
    }

    return fallback;
  }

  private safeFaction(value: unknown, fallback: CardFaction): CardFaction {
    if (value === 'neutral' || value === 'empire' || value === 'high-elves' || value === 'dwarfs') {
      return value;
    }

    return fallback;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private safeNumber(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fallback;
    }

    return value;
  }

  private safeString(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }

    return value;
  }

  private safeColor(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }

    if (/^#[0-9A-F]{6}$/i.test(value)) {
      return value;
    }

    return fallback;
  }

  private safeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value !== 'boolean') {
      return fallback;
    }

    return value;
  }
}
