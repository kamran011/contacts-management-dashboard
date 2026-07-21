/**
 * @file mockApiService.ts
 * @description Thin HTTP wrapper around the mockapi.io REST endpoints.
 *
 * ASSUMPTION: mockapi.io free tier cannot generate random values from a custom
 *   list, so `status` (contacts) and `label` (emails) arrive as generic strings.
 *   We normalise them deterministically from the record's numeric id
 *   (`parseInt(id) % N`) so each record always maps to the same value across
 *   re-fetches — preventing colour/label flicker on re-renders or cache misses.
 *   In production the real backend would return a validated enum and this layer
 *   would be removed.
 *
 * ASSUMPTION: mockapi.io auto-injects `contactId` on nested resources, so we do
 *   not add it to the schema manually — it is present on every email response.
 *
 * SIMPLIFICATION: No retry / circuit-breaker. A production service would wrap
 *   axios in a retry strategy (e.g. axios-retry) and surface structured errors
 *   via the GraphQL error `extensions` field.
 *
 * DESIGN NOTE (deviation from spec): the base-URL check is lazy (per request)
 *   rather than at module load. This lets the GraphQL server boot and expose its
 *   sandbox even before `MOCKAPI_BASE_URL` is configured; queries then fail with
 *   a clear message. There is still no data fallback — the URL is required.
 */

import axios from 'axios';

/** Reads and validates the required base URL at call time (no fallback data). */
function getBaseUrl(): string {
  const baseUrl = process.env['MOCKAPI_BASE_URL'];
  if (!baseUrl) {
    throw new Error(
      'MOCKAPI_BASE_URL is not set. Copy bff/.env.example to bff/.env and set ' +
        'your mockapi.io project base URL before querying.',
    );
  }
  return baseUrl.replace(/\/+$/, ''); // strip any trailing slash for safe joins
}

// ─── Status normalisation ────────────────────────────────────────────────────
// id "1" → online, "2" → away, "3" → offline, "4" → online, ...
const STATUS_OPTIONS = ['online', 'away', 'offline'] as const;
export type ContactStatus = (typeof STATUS_OPTIONS)[number];

function normaliseStatus(id: string): ContactStatus {
  const index = parseInt(id, 10) % STATUS_OPTIONS.length;
  return STATUS_OPTIONS[Number.isNaN(index) ? 0 : index];
}

// ─── Label normalisation ─────────────────────────────────────────────────────
const LABEL_OPTIONS = ['work', 'personal'] as const;

function normaliseLabel(id: string): string {
  const index = parseInt(id, 10) % LABEL_OPTIONS.length;
  return LABEL_OPTIONS[Number.isNaN(index) ? 0 : index];
}

// ─── Raw shapes returned by mockapi.io ───────────────────────────────────────
interface RawContact {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
  status: string; // lorem gibberish on free tier — normalised below
  bio: string;
  dialInfo: string;
  meetingLink: string;
}

interface RawEmailAddress {
  id: string;
  contactId: string;
  email: string;
  isPrimary: boolean | string; // mockapi.io may return the string "true"
  label: string; // lorem gibberish on free tier — normalised below
}

// ─── Domain shapes returned to resolvers ─────────────────────────────────────
export interface Contact extends Omit<RawContact, 'status'> {
  status: ContactStatus;
}

export interface EmailAddress {
  id: string;
  contactId: string;
  email: string;
  isPrimary: boolean;
  label: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────
function mapContact(raw: RawContact): Contact {
  return {
    ...raw,
    status: normaliseStatus(raw.id),
  };
}

function mapEmailAddress(raw: RawEmailAddress): EmailAddress {
  return {
    id: raw.id,
    contactId: raw.contactId,
    email: raw.email,
    isPrimary: raw.isPrimary === true || raw.isPrimary === 'true',
    label: normaliseLabel(raw.id),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────
export async function getContacts(): Promise<Contact[]> {
  const { data } = await axios.get<RawContact[]>(`${getBaseUrl()}/contacts`);
  return data.map(mapContact);
}

export async function getContact(id: string): Promise<Contact | null> {
  try {
    const { data } = await axios.get<RawContact>(`${getBaseUrl()}/contacts/${id}`);
    return mapContact(data);
  } catch (error) {
    // mockapi.io returns 404 for an unknown id — surface that as `null`.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchEmailsByContactId(contactId: string): Promise<EmailAddress[]> {
  try {
    const { data } = await axios.get<RawEmailAddress[]>(
      `${getBaseUrl()}/contacts/${contactId}/email_addresses`,
    );
    return data.map(mapEmailAddress);
  } catch (error) {
    // ASSUMPTION: mockapi.io returns 404 (rather than []) for a nested
    // collection with zero seeded records, e.g. a contact with no emails
    // added yet. We treat that the same as "no emails" instead of an error.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}
