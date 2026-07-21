/**
 * @file status-badge.component.ts
 * @description Presence dot — 8px coloured circle inside a 12px white mask ring
 *   (matches the Figma spec). Colour is driven by the contact status.
 */

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ContactStatus } from '../../../core/models/contact.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="status-dot" [class]="'status-dot--' + status()"></span>`,
  styleUrl: './status-badge.component.scss',
  host: { '[attr.title]': 'status()' },
})
export class StatusBadgeComponent {
  readonly status = input.required<ContactStatus>();
}
