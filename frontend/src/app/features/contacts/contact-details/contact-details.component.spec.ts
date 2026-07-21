/**
 * @file contact-details.component.spec.ts
 * @description Exercises the contact detail pane: rendering, the "Primary"
 *   email tag, the empty state (no `:id` in the route) and the error state
 *   (Apollo query failure), against a mocked ContactService.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import type { ErrorLike } from '@apollo/client';

import { ContactDetailsComponent } from './contact-details.component';
import { ContactService, type QueryState } from '../../../core/services/contact.service';
import type { Contact } from '../../../core/models/contact.model';

const MOCK_CONTACT: Contact = {
  id: '42',
  firstName: 'Grace',
  lastName: 'Hopper',
  fullName: 'Grace Hopper',
  avatar: null,
  role: 'Rear Admiral',
  status: 'online',
  bio: 'Compiler pioneer.',
  emailAddresses: [
    { id: 'e1', email: 'grace@example.com', isPrimary: true, label: 'work' },
    { id: 'e2', email: 'grace.personal@example.com', isPrimary: false, label: 'personal' },
  ],
};

function configureWith(getContact: (id: string) => ReturnType<ContactService['getContact']>) {
  return TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'contacts/:id', component: ContactDetailsComponent }]),
      { provide: ContactService, useValue: { getContact } },
    ],
  }).compileComponents();
}

describe('ContactDetailsComponent', () => {
  it('renders contact name, role, and all email addresses', async () => {
    await configureWith(() => of<QueryState<Contact>>({ data: MOCK_CONTACT, loading: false, error: null }));

    const harness = await RouterTestingHarness.create('/contacts/42');
    harness.detectChanges();

    const text = harness.routeNativeElement!.textContent ?? '';
    expect(text).toContain('Grace Hopper');
    expect(text).toContain('Rear Admiral');
    expect(text).toContain('grace@example.com');
    expect(text).toContain('grace.personal@example.com');
  });

  it('marks the primary email with the "Primary" tag', async () => {
    await configureWith(() => of<QueryState<Contact>>({ data: MOCK_CONTACT, loading: false, error: null }));

    const harness = await RouterTestingHarness.create('/contacts/42');
    harness.detectChanges();

    const rows = Array.from(
      harness.routeNativeElement!.querySelectorAll('.detail-row__value-line'),
    );
    const primaryRow = rows.find((row) => row.textContent?.includes('grace@example.com'));
    const secondaryRow = rows.find((row) =>
      row.textContent?.includes('grace.personal@example.com'),
    );

    expect(primaryRow?.querySelector('app-tag-badge')).toBeTruthy();
    expect(secondaryRow?.querySelector('app-tag-badge')).toBeFalsy();
  });

  it('shows an error state when the Apollo query fails', async () => {
    const error = { message: 'Network error' } as ErrorLike;
    await configureWith(() => of<QueryState<Contact>>({ data: null, loading: false, error }));

    const harness = await RouterTestingHarness.create('/contacts/42');
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelector('.empty-state--error')).toBeTruthy();
  });
});

describe('ContactDetailsComponent (no selection)', () => {
  it('shows an empty state when no id is in the route', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'contacts', component: ContactDetailsComponent }]),
        {
          provide: ContactService,
          useValue: { getContact: () => of<QueryState<Contact>>({ data: null, loading: false, error: null }) },
        },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create('/contacts');
    harness.detectChanges();

    const emptyState = harness.routeNativeElement!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.classList.contains('empty-state--error')).toBe(false);
  });
});
