/**
 * @file contact-list.component.ts
 * @description Lists all contacts fetched via Apollo GraphQL, in a scrollable
 *   sidebar with search-filter and route-driven active-row highlighting.
 *
 * PATTERN: Uses OnPush change detection; all state derived from signals bridged
 *   from Observables via `toSignal` (zoneless-friendly — no manual
 *   markForCheck needed). Filtering is a `computed()` over the contacts +
 *   debounced search term signals.
 * ASSUMPTION: Search filtering is client-side. In production with large
 *   datasets (>1000 contacts), this would be server-side with a debounced
 *   GraphQL query variable instead.
 * SIMPLIFICATION: Pagination is not implemented. A real app would use
 *   cursor-based pagination (Apollo's fetchMore) to load contacts in pages.
 *   Row Message/Call actions are UI-only (no backend mutations yet).
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ContactService } from '../../../core/services/contact.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';

/** Matches `$bp-desktop - 1` in `_variables.scss` (tablet + mobile). */
const COMPACT_SEARCH_MQ = '(max-width: 1279px)';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AvatarComponent, StatusBadgeComponent, IconButtonComponent],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss',
})
export class ContactListComponent {
  private readonly contactService = inject(ContactService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  /**
   * Contact id whose tablet/mobile ⋯ overflow menu is open.
   * Only one menu open at a time; closed on outside click / Escape.
   */
  protected readonly overflowContactId = signal<string | null>(null);

  /** True below desktop breakpoint — use shorter search placeholder. */
  private readonly isCompactSearch = signal(
    typeof matchMedia === 'function' ? matchMedia(COMPACT_SEARCH_MQ).matches : false,
  );

  /** Desktop keeps full Figma copy; tablet/mobile drop "number" to avoid clipping. */
  protected readonly searchPlaceholder = computed(() =>
    this.isCompactSearch() ? 'Name, email or phone' : 'Name, email or phone number',
  );

  /** Currently active contact id, kept in sync with the child route param. */
  protected readonly activeContactId = toSignal(
    this.router.events.pipe(
      startWith(null),
      map(() => this.readActiveIdFromRoute()),
    ),
    { initialValue: this.readActiveIdFromRoute() },
  );

  private readonly contactsState = toSignal(this.contactService.getContacts(), {
    initialValue: { data: null, loading: true, error: null },
  });

  /** Skeleton only while fetching and the list is still empty (skip cache hits). */
  protected readonly loading = computed(
    () => this.contactsState().loading && !this.contactsState().data,
  );
  protected readonly error = computed(() => this.contactsState().error);

  /** Debounced, normalised search term — client-side filter key. */
  private readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map((value) => value.trim().toLowerCase()),
    ),
    { initialValue: '' },
  );

  /** Contacts matching the current search term (by fullName or role). */
  protected readonly filteredContacts = computed(() => {
    const contacts = this.contactsState().data ?? [];
    const term = this.searchTerm();
    if (!term) return contacts;
    return contacts.filter(
      (c) => c.fullName.toLowerCase().includes(term) || c.role?.toLowerCase().includes(term),
    );
  });

  constructor() {
    if (typeof matchMedia !== 'function') return;
    const mql = matchMedia(COMPACT_SEARCH_MQ);
    const onChange = (event: MediaQueryListEvent) => this.isCompactSearch.set(event.matches);
    mql.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => mql.removeEventListener('change', onChange));
  }

  protected toggleOverflow(event: Event, contactId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.overflowContactId.update((openId) => (openId === contactId ? null : contactId));
  }

  protected closeOverflow(): void {
    this.overflowContactId.set(null);
  }

  /** Placeholder until Message/Call mutations exist — closes the menu. */
  protected onOverflowAction(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeOverflow();
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    this.closeOverflow();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeOverflow();
  }

  /** Walks to the deepest activated route to read the `:id` param, if any. */
  private readActiveIdFromRoute(): string | null {
    let current = this.route.snapshot.root;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current.paramMap.get('id');
  }
}
