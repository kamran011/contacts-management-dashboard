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
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ContactService } from '../../../core/services/contact.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';

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

  protected readonly searchControl = new FormControl('', { nonNullable: true });

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

  protected readonly loading = computed(() => this.contactsState().loading);
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

  /** Walks to the deepest activated route to read the `:id` param, if any. */
  private readActiveIdFromRoute(): string | null {
    let current = this.route.snapshot.root;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current.paramMap.get('id');
  }
}
