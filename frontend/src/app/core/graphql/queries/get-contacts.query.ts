/**
 * @file get-contacts.query.ts
 * @description List query for the sidebar.
 *
 * SIMPLIFICATION: The list view requests only the fields it renders (id,
 *   fullName, avatar, role, status) to avoid over-fetching — notably it does NOT
 *   request emailAddresses, so the BFF's DataLoader never fires for the list. In
 *   a large app, list vs detail would remain separate queries like this.
 */

import { gql } from 'apollo-angular';

export const GET_CONTACTS = gql`
  query GetContacts {
    contacts {
      id
      fullName
      avatar
      role
      status
    }
  }
`;
