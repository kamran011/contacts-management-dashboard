/**
 * @file icon-button.component.ts
 * @description Two modes from one primitive:
 *   1. Icon-only 36×36 button (chat / call / more) — uses icon-button mixins.
 *   2. Labelled purple CTA ("Message") when `label` is provided.
 *
 * NOTE: Uses only Material Icon glyphs (CDN) — no component library, per spec.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="icon-btn"
      [class.icon-btn--active]="active()"
      [class.icon-btn--cta]="isCta()"
      [attr.aria-label]="ariaLabel()"
    >
      <span class="material-icons" aria-hidden="true">{{ icon() }}</span>
      @if (isCta()) {
        <span class="icon-btn__label">{{ label() }}</span>
      }
    </button>
  `,
  styleUrl: './icon-button.component.scss',
})
export class IconButtonComponent {
  readonly icon = input.required<string>();
  readonly active = input<boolean>(false);
  readonly label = input<string | undefined>(undefined);

  protected readonly isCta = computed(() => !!this.label());
  protected readonly ariaLabel = computed(() => this.label() ?? this.icon());
}
