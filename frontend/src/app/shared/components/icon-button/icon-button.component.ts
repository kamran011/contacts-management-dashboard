/**
 * @file icon-button.component.ts
 * @description Two modes from one primitive:
 *   1. Icon-only button (chat / call / more) — Material Icons CDN.
 *   2. Labelled purple CTA ("Message") when `label` is provided.
 *   3. Custom Figma glyphs via `glyph` ("message" | "calendar") — inline SVG
 *      so color follows `currentColor` (resting / active / CTA) with no asset URL.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconButtonSize = 'md' | 'lg';
export type IconGlyph = 'message' | 'calendar';

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
      [class.icon-btn--lg]="size() === 'lg'"
      [attr.aria-label]="ariaLabel()"
    >
      @switch (glyph()) {
        @case ('message') {
          <svg
            class="icon-btn__svg"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M11.25 7.48828C11.25 7.69922 11.168 7.875 11.0039 8.01562C10.8633 8.15625 10.6875 8.22656 10.4766 8.22656H2.98828L0 11.25V0.738281C0 0.527344 0.0703125 0.351562 0.210938 0.210938C0.351562 0.0703125 0.527344 0 0.738281 0H10.4766C10.6875 0 10.8633 0.0703125 11.0039 0.210938C11.168 0.351562 11.25 0.527344 11.25 0.738281V7.48828ZM14.2383 2.98828C14.4492 2.98828 14.625 3.05859 14.7656 3.19922C14.9062 3.33984 14.9766 3.51562 14.9766 3.72656V14.9766L11.9883 11.9883H3.72656C3.51562 11.9883 3.33984 11.918 3.19922 11.7773C3.05859 11.6367 2.98828 11.4609 2.98828 11.25V9.73828H12.7266V2.98828H14.2383Z"
              fill="currentColor"
            />
          </svg>
        }
        @case ('calendar') {
          <svg
            class="icon-btn__svg"
            width="14"
            height="13"
            viewBox="0 0 14 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6.75 4.5L9.73828 7.52344H7.48828V12.0234H6.01172V7.52344H3.76172L6.75 4.5ZM11.9883 0C12.4102 0 12.7617 0.152344 13.043 0.457031C13.3477 0.738281 13.5 1.08984 13.5 1.51172V10.5117C13.5 10.9102 13.3477 11.2617 13.043 11.5664C12.7383 11.8711 12.3867 12.0234 11.9883 12.0234H9V10.5117H11.9883V3.02344H1.51172V10.5117H4.5V12.0234H1.51172C1.08984 12.0234 0.726562 11.8828 0.421875 11.6016C0.140625 11.2969 0 10.9336 0 10.5117V1.51172C0 1.08984 0.140625 0.738281 0.421875 0.457031C0.726562 0.152344 1.08984 0 1.51172 0H11.9883Z"
              fill="currentColor"
            />
          </svg>
        }
        @default {
          <span class="material-icons" aria-hidden="true">{{ icon() }}</span>
        }
      }
      @if (isCta()) {
        <span class="icon-btn__label">{{ label() }}</span>
      }
    </button>
  `,
  styleUrl: './icon-button.component.scss',
})
export class IconButtonComponent {
  /** Material Icons ligature name — used when `glyph` is not set. */
  readonly icon = input<string>('');
  /** Figma custom glyph: message (chat bubbles) or calendar (upload/outbox). */
  readonly glyph = input<IconGlyph | undefined>(undefined);
  readonly active = input<boolean>(false);
  readonly label = input<string | undefined>(undefined);
  readonly size = input<IconButtonSize>('md');

  protected readonly isCta = computed(() => !!this.label());
  protected readonly ariaLabel = computed(() => this.label() ?? (this.icon() || this.glyph() || 'button'));
}
