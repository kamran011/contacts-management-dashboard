/**
 * @file get-contact.query.ts
 * @description Full detail query for a single contact, including emailAddresses
 *   (resolved server-side by the DataLoader in one batched tick).
 */

import { gql } from 'apollo-angular';

export const GET_CONTACT = gql`
  query GetContact($id: ID!) {
    contact(id: $id) {
      id
      fullName
      firstName
      avatar
      role
      status
      bio
      dialInfo
      meetingLink
      emailAddresses {
        id
        email
        isPrimary
        label
      }
    }
  }
`;
