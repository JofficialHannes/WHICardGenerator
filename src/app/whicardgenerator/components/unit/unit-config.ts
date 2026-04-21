import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-unit-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './unit-config.html'
})
export class UnitConfigComponent {
  readonly cardService = inject(CardService);

  onUnitPowerChange(unitPower: number) {
    const config = this.cardService.unitConfig();
    this.cardService.unitConfig.set({ ...config, unitPower });
  }

  onUnitHealthChange(unitHealth: number) {
    const config = this.cardService.unitConfig();
    this.cardService.unitConfig.set({ ...config, unitHealth });
  }
}
