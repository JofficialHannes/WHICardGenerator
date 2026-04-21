export type CardType = 'unit' | 'support' | 'tactics';

export type CardFaction = 'neutral' | 'empire' | 'high-elves' | 'dwarfs';

export type SharedTextConfig = {
  cardTitle: string;
  cardText: string;
  titleFontFamily: string;
  textFontFamily: string;
};

export type SharedImageConfig = {
  xPosition: number;
  yPosition: number;
  scale: number;
  canvasBackgroundColor: string;
};

export type CardSetConfig = {
  showCardSet: boolean;
  cardSetSymbol: string | null;
  cardSetNumber: number;
};

export type UnitConfig = {
  unitPower: number;
  unitHealth: number;
};

export type SupportConfig = {
  supportShield: number;
};

export type TacticsConfig = {
  tacticsPotency: number;
};

type BaseCardModel = {
  cardType: CardType;
  faction: CardFaction;
  cardCost: number;
  cardLoyaltyCost: number;
  cardImageSource?: string;
  textConfig: SharedTextConfig;
  imageConfig: SharedImageConfig;
  cardSetConfig: CardSetConfig;
};

export type UnitCardModel = BaseCardModel & {
  cardType: 'unit';
  unitConfig: UnitConfig;
};

export type SupportCardModel = BaseCardModel & {
  cardType: 'support';
  supportConfig: SupportConfig;
};

export type TacticsCardModel = BaseCardModel & {
  cardType: 'tactics';
  tacticsConfig: TacticsConfig;
};

export type CardModel = UnitCardModel | SupportCardModel | TacticsCardModel;
