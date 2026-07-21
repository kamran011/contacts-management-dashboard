/**
 * @file emailLoader.ts
 * @description DataLoader that batches `emailAddresses` fetches to defeat N+1.
 *
 * ASSUMPTION: mockapi.io does not support batch GET by multiple ids. We therefore
 *   fire parallel individual requests (Promise.all) rather than one true batch
 *   endpoint. In production, replace the body with a single batched call, e.g.
 *   `GET /contacts?ids=1,2,3` and re-map the flat result back to each key.
 *
 * WHY IT STILL HELPS: within a single GraphQL query, every contact requesting
 *   `emailAddresses` is collected into ONE batch tick here — so the N calls are
 *   dispatched together and de-duplicated/cached per request, instead of being
 *   interleaved as a naive resolver would. A fresh loader is created per request
 *   (see server.ts context) so cache never leaks across users.
 */

import DataLoader from 'dataloader';
import { fetchEmailsByContactId, type EmailAddress } from '../services/mockApiService.js';

export function createEmailLoader(): DataLoader<string, EmailAddress[]> {
  return new DataLoader<string, EmailAddress[]>(async (contactIds) => {
    // DataLoader requires the output array to map 1:1 (same order) with keys.
    return Promise.all(contactIds.map((id) => fetchEmailsByContactId(id)));
  });
}

export type EmailLoader = ReturnType<typeof createEmailLoader>;
