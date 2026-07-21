/**
 * @file resolvers/index.ts
 * @description GraphQL resolvers for the Contacts BFF.
 *
 * PATTERN: `Query.contacts`/`contact` fetch the list/record from mockapi.io.
 *   `Contact.fullName` is derived server-side. `Contact.emailAddresses` defers to
 *   a per-request DataLoader (from context) so all contacts' emails are batched
 *   into a single tick — eliminating the N+1 problem.
 */

import {
  getContacts,
  getContact,
  type Contact,
} from '../services/mockApiService.js';
import type { EmailLoader } from '../dataloaders/emailLoader.js';

/** Per-request context shape (built in server.ts). */
export interface GraphQLContext {
  emailLoader: EmailLoader;
}

export const resolvers = {
  Query: {
    contacts: (): Promise<Contact[]> => getContacts(),
    contact: (_parent: unknown, args: { id: string }): Promise<Contact | null> =>
      getContact(args.id),
  },

  Contact: {
    fullName: (parent: Contact): string => `${parent.firstName} ${parent.lastName}`,
    emailAddresses: (parent: Contact, _args: unknown, ctx: GraphQLContext) =>
      ctx.emailLoader.load(parent.id),
  },
};
