/**
 * @file contacts-shell.component.ts
 * @description Two-pane layout: contact list sidebar + router-outlet detail
 *   panel. Responsive: on mobile the detail panel becomes a full-screen overlay
 *   driven by whether a `:id` is present in the child route (CSS only, no
 *   animation library).
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { map, startWith } from 'rxjs';

import { ContactListComponent } from './contact-list/contact-list.component';

@Component({
  selector: 'app-contacts-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ContactListComponent],
  templateUrl: './contacts-shell.component.html',
  styleUrl: './contacts-shell.component.scss',
})
export class ContactsShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * True once a child `:id` route is active — drives the mobile overlay.
   * Re-derived from `router.events` since `ActivatedRoute.firstChild` is a
   * point-in-time snapshot, not itself reactive.
   */
  protected readonly detailActive = toSignal(
    this.router.events.pipe(
      startWith(null),
      map(() => this.hasActiveDetailId()),
    ),
    { initialValue: this.hasActiveDetailId() },
  );

  private hasActiveDetailId(): boolean {
    let current = this.route.snapshot.root;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return !!current.paramMap.get('id');
  }

  /** Mobile "Back" control: return to the list pane by navigating to `/contacts`. */
  protected goToList(): void {
    void this.router.navigate(['/contacts']);
  }
}
