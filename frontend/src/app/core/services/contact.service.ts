/**
 * @file contact.service.ts
 * @description Thin, strongly-typed wrapper over Apollo GraphQL queries.
 *
 * PATTERN: Components never touch Apollo directly — they consume `QueryState`
 *   observables from this service. `watchQuery` keeps the result live and
 *   cache-backed, so revisiting a contact re-emits instantly from Apollo's
 *   normalised InMemoryCache with no network round-trip.
 *
 * SIMPLIFICATION: No explicit error-policy/retry link configured.
 *   // TODO: production would use Apollo error policies + a retry link.
 */

import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ErrorLike } from '@apollo/client';

import { GET_CONTACTS } from '../graphql/queries/get-contacts.query';
import { GET_CONTACT } from '../graphql/queries/get-contact.query';
import type {
  Contact,
  ContactListItem,
  GetContactResult,
  GetContactsResult,
} from '../models/contact.model';

/** Normalised view of an Apollo query result for template consumption. */
export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: ErrorLike | null;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly apollo = inject(Apollo);

  /** Live list of contacts for the sidebar (light projection). */
  getContacts(): Observable<QueryState<ContactListItem[]>> {
    return this.apollo
      .watchQuery<GetContactsResult>({ query: GET_CONTACTS })
      .valueChanges.pipe(
        map((result) => ({
          // Apollo Client v4's MaybeMasked/DeepPartialObject widens every field
          // to optional when no codegen'd document types are wired in. We don't
          // use codegen here (out of scope), so we cast back to our hand-written
          // model — the GraphQL schema is the actual source of non-optionality.
          data: (result.data?.contacts ?? null) as ContactListItem[] | null,
          loading: result.loading,
          error: result.error ?? null,
        })),
      );
  }

  /** Live single contact by id, including batched email addresses. */
  getContact(id: string): Observable<QueryState<Contact>> {
    return this.apollo
      .watchQuery<GetContactResult, { id: string }>({
        query: GET_CONTACT,
        variables: { id },
      })
      .valueChanges.pipe(
        map((result) => ({
          data: (result.data?.contact ?? null) as Contact | null,
          loading: result.loading,
          error: result.error ?? null,
        })),
      );
  }

  /** Refresh contacts list, bypassing cache. Useful when mock data changes. */
  refetchContacts(): Observable<QueryState<ContactListItem[]>> {
    return this.apollo
      .watchQuery<GetContactsResult>({
        query: GET_CONTACTS,
        fetchPolicy: 'network-only',  // Bypass cache, always fetch from server
      })
      .valueChanges.pipe(
        map((result) => ({
          data: (result.data?.contacts ?? null) as ContactListItem[] | null,
          loading: result.loading,
          error: result.error ?? null,
        })),
      );
  }

  /** Refresh single contact, bypassing cache. Useful when mock data changes. */
  refetchContact(id: string): Observable<QueryState<Contact>> {
    return this.apollo
      .watchQuery<GetContactResult, { id: string }>({
        query: GET_CONTACT,
        variables: { id },
        fetchPolicy: 'network-only',  // Bypass cache, always fetch from server
      })
      .valueChanges.pipe(
        map((result) => ({
          data: (result.data?.contact ?? null) as Contact | null,
          loading: result.loading,
          error: result.error ?? null,
        })),
      );
  }
}
