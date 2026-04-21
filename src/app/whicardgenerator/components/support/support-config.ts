import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-support-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './support-config.html'
})
export class SupportConfigComponent {
  readonly cardService = inject(CardService);

  onSupportShieldChange(supportShield: number) {
    const config = this.cardService.supportConfig();
    this.cardService.supportConfig.set({ ...config, supportShield });
  }
}
