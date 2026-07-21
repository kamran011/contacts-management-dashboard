/**
 * @file contact.model.ts
 * @description Frontend domain types mirroring the GraphQL schema. These are the
 *   shapes Apollo returns and components consume.
 */

export type ContactStatus = 'online' | 'away' | 'offline';

export interface EmailAddress {
  id: string;
  contactId?: string;
  email: string;
  isPrimary: boolean;
  label?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  role: string;
  status: ContactStatus;
  bio: string;
  dialInfo?: string;
  meetingLink?: string;
  emailAddresses: EmailAddress[];
}

/** Lighter projection returned by the list query (no bio/emails/etc.). */
export type ContactListItem = Pick<
  Contact,
  'id' | 'fullName' | 'avatar' | 'role' | 'status'
>;

// ─── Query result envelopes (typing Apollo's `data`) ──────────────────────────
export interface GetContactsResult {
  contacts: ContactListItem[];
}

export interface GetContactResult {
  contact: Contact | null;
}
