import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CardService } from '../../card.service';

@Component({
  selector: 'app-actions-config',
  standalone: true,
  templateUrl: './actions-config.html'
})
export class ActionsConfigComponent {
  readonly cardService = inject(CardService);

  @Output() configImported = new EventEmitter<unknown>();
  @Output() resetRequested = new EventEmitter<void>();

  exportConfig() {
    const json = JSON.stringify(this.cardService.exportCardModel, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.cardService.exportConfigFileName}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  onConfigImportChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const importedConfig = JSON.parse(reader.result as string) as unknown;
        this.configImported.emit(importedConfig);
      } catch (error) {
        console.error('Invalid config JSON file.', error);
      } finally {
        target.value = '';
      }
    };

    reader.readAsText(file);
  }

  resetConfig() {
    this.resetRequested.emit();
  }
}
