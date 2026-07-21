/**
 * @file tag-badge.component.ts
 * @description Light grey pill label — used for the "Primary" email/phone tag.
 */

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tag-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tag-badge">{{ label() }}</span>`,
  styleUrl: './tag-badge.component.scss',
})
export class TagBadgeComponent {
  readonly label = input.required<string>();
}
