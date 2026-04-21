import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-cost-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cost-config.html'
})
export class CostConfigComponent {
  readonly cardService = inject(CardService);

  onCardCostChange(cardCost: number) {
    this.cardService.cardCost.set(cardCost);
  }

  onCardLoyaltyCostChange(cardLoyaltyCost: number) {
    this.cardService.cardLoyaltyCost.set(cardLoyaltyCost);
  }
}
