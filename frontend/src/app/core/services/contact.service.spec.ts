/**
 * @file contact.service.spec.ts
 * @description Verifies ContactService issues the correct GraphQL operations
 *   and maps results into the `QueryState` shape components rely on.
 */

import { TestBed } from '@angular/core/testing';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { firstValueFrom, skipWhile } from 'rxjs';

import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
    });
    service = TestBed.inject(ContactService);
    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('getContacts() issues a GetContacts query and maps the result', async () => {
    const resultPromise = firstValueFrom(
      service.getContacts().pipe(skipWhile((state) => state.loading)),
    );

    const op = controller.expectOne('GetContacts');
    op.flushData({
      contacts: [{ id: '1', fullName: 'Ada Lovelace', avatar: null, role: 'Engineer', status: 'online' }],
    });

    const state = await resultPromise;
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.data).toEqual([
      { id: '1', fullName: 'Ada Lovelace', avatar: null, role: 'Engineer', status: 'online' },
    ]);
  });

  it('getContact(id) issues a GetContact query with the correct variable', async () => {
    const resultPromise = firstValueFrom(
      service.getContact('42').pipe(skipWhile((state) => state.loading)),
    );

    const op = controller.expectOne('GetContact');
    expect(op.operation.variables['id']).toBe('42');

    op.flushData({
      contact: {
        id: '42',
        fullName: 'Grace Hopper',
        firstName: 'Grace',
        avatar: null,
        role: 'Rear Admiral',
        status: 'online',
        bio: 'Compiler pioneer.',
        dialInfo: null,
        meetingLink: null,
        emailAddresses: [{ id: 'e1', email: 'grace@example.com', isPrimary: true, label: 'work' }],
      },
    });

    const state = await resultPromise;
    expect(state.data?.id).toBe('42');
    expect(state.data?.emailAddresses[0].isPrimary).toBe(true);
  });
});
