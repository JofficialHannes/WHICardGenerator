import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardFaction, CardType } from '../../card-model';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-card-type-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './card-type-config.html'
})
export class CardTypeConfigComponent {
  readonly cardService = inject(CardService);

  private readonly allFactions: Array<{ value: CardFaction; label: string }> = [
    { value: 'neutral', label: 'Neutral' },
    { value: 'empire', label: 'Empire' },
    { value: 'high-elves', label: 'High Elves' },
    { value: 'dwarfs', label: 'Dwarfs' }
  ];

  get availableFactions(): Array<{ value: CardFaction; label: string }> {
    return this.allFactions.filter((factionOption) => !this.cardService.excludedFactionsForCardType.includes(factionOption.value));
  }

  onCardTypeChange(cardType: CardType) {
    this.cardService.cardType.set(cardType);
    this.cardService.faction.set(this.cardService.normalizeFactionForCardType(cardType, this.cardService.faction()));
  }

  onFactionChange(faction: CardFaction) {
    this.cardService.faction.set(this.cardService.normalizeFactionForCardType(this.cardService.cardType(), faction));
  }
}
