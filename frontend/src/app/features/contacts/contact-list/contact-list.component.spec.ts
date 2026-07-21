/**
 * @file contact-list.component.spec.ts
 * @description Exercises the sidebar contact list against a mocked
 *   ContactService — rendering, search filtering, loading state, and active-row
 *   highlighting driven by the route param.
 *
 * PATTERN: Uses RouterTestingHarness so `ActivatedRoute`/`Router` behave like
 *   real navigation (required because the component walks the live route tree
 *   to find the active `:id`), while ContactService is a lightweight fake so no
 *   network/Apollo wiring is needed.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { ContactListComponent } from './contact-list.component';
import { ContactService, type QueryState } from '../../../core/services/contact.service';
import type { ContactListItem } from '../../../core/models/contact.model';

const MOCK_CONTACTS: ContactListItem[] = [
  { id: '1', fullName: 'Ada Lovelace', avatar: null, role: 'Mathematician', status: 'online' },
  { id: '2', fullName: 'Grace Hopper', avatar: null, role: 'Rear Admiral', status: 'away' },
];

describe('ContactListComponent', () => {
  let contactsState$: BehaviorSubject<QueryState<ContactListItem[]>>;

  beforeEach(async () => {
    contactsState$ = new BehaviorSubject<QueryState<ContactListItem[]>>({
      data: MOCK_CONTACTS,
      loading: false,
      error: null,
    });

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'contacts', component: ContactListComponent },
          { path: 'contacts/:id', component: ContactListComponent },
        ]),
        { provide: ContactService, useValue: { getContacts: () => contactsState$ } },
      ],
    }).compileComponents();
  });

  it('renders a list item for each contact returned by the service', async () => {
    const harness = await RouterTestingHarness.create('/contacts');
    harness.detectChanges();

    const items = harness.routeNativeElement!.querySelectorAll('.contact-item');
    expect(items.length).toBe(2);
    expect(harness.routeNativeElement!.textContent).toContain('Ada Lovelace');
    expect(harness.routeNativeElement!.textContent).toContain('Grace Hopper');
  });

  it('shows a loading skeleton while the query is in-flight', async () => {
    contactsState$.next({ data: null, loading: true, error: null });

    const harness = await RouterTestingHarness.create('/contacts');
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelectorAll('.contact-item--skeleton').length).toBeGreaterThan(0);
  });

  it('filters contacts when the search input changes', async () => {
    const harness = await RouterTestingHarness.create('/contacts');
    harness.detectChanges();

    const input: HTMLInputElement = harness.routeNativeElement!.querySelector('#contact-search')!;
    input.value = 'Grace';
    input.dispatchEvent(new Event('input'));

    // debounceTime(300) — advance past it.
    await new Promise((resolve) => setTimeout(resolve, 350));
    harness.detectChanges();

    const items = harness.routeNativeElement!.querySelectorAll('.contact-item');
    expect(items.length).toBe(1);
    expect(harness.routeNativeElement!.textContent).toContain('Grace Hopper');
  });

  it('highlights the active contact matching the current route param', async () => {
    const harness = await RouterTestingHarness.create('/contacts/2');
    harness.detectChanges();

    const activeItem = harness.routeNativeElement!.querySelector('.contact-item--active');
    expect(activeItem?.textContent).toContain('Grace Hopper');
  });
});
