import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-tactics-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tactics-config.html'
})
export class TacticsConfigComponent {
  readonly cardService = inject(CardService);

  onTacticsPotencyChange(tacticsPotency: number) {
    const config = this.cardService.tacticsConfig();
    this.cardService.tacticsConfig.set({ ...config, tacticsPotency });
  }
}
