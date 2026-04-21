import { Component, signal } from '@angular/core';
import { WhiCardGenerator } from './whicardgenerator/whicardgenerator';

@Component({
  selector: 'app-root',
  imports: [WhiCardGenerator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('WHICardCreator');
}
