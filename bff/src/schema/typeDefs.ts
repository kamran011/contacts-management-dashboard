/**
 * @file typeDefs.ts
 * @description GraphQL SDL for the Contacts BFF.
 *
 * PATTERN: The frontend talks to this single `/graphql` endpoint instead of the
 *   two REST endpoints (`/contacts` and `/contacts/:id/email_addresses`). This
 *   collapses the classic N+1 fetch (1 list call + N email calls) into one
 *   GraphQL round-trip; `Contact.emailAddresses` is resolved via a DataLoader
 *   (see dataloaders/emailLoader.ts).
 *
 * NOTE: `fullName` and `emailAddresses` are computed server-side by resolvers,
 *   so they are part of the schema even though the REST source never returns them.
 */

import { gql } from 'graphql-tag';

export const typeDefs = gql`
  "Deterministic presence indicator (see mockApiService status normalisation)."
  enum ContactStatus {
    online
    away
    offline
  }

  type EmailAddress {
    id: ID!
    contactId: ID!
    email: String!
    isPrimary: Boolean!
    "Normalised to \\"work\\" | \\"personal\\" in the BFF (free-tier limitation)."
    label: String
  }

  type Contact {
    id: ID!
    firstName: String!
    lastName: String!
    "Resolved server-side: \\"\${firstName} \${lastName}\\"."
    fullName: String!
    avatar: String
    role: String
    status: ContactStatus
    bio: String
    dialInfo: String
    meetingLink: String
    "Resolved via DataLoader — batched, no N+1."
    emailAddresses: [EmailAddress!]!
  }

  type Query {
    "All contacts (email addresses resolved lazily per requested contact)."
    contacts: [Contact!]!
    "A single contact by id, or null if not found."
    contact(id: ID!): Contact
  }
`;
