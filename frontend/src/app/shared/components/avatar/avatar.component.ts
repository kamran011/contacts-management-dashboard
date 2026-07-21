/**
 * @file avatar.component.ts
 * @description Contact avatar — shows the image when available, otherwise falls
 *   back to initials on a purple-tint background.
 *
 * PATTERN: Standalone + OnPush + signal inputs. Zoneless-friendly (all state is
 *   signal-derived, no manual change detection needed).
 */

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  host: {
    '[class.avatar--sm]': "size() === 'sm'",
    '[class.avatar--lg]': "size() === 'lg'",
  },
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly name = input<string>('');
  readonly size = input<AvatarSize>('md');

  /** Tracks image load failures so we can gracefully fall back to initials. */
  protected readonly imageFailed = signal(false);

  /** Show the image only when we have a src AND it hasn't errored. */
  protected readonly showImage = computed(() => !!this.src() && !this.imageFailed());

  /** First letter of first + last word of the name, uppercased. */
  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0]!.charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : '';
    return (first + last).toUpperCase();
  });

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
