/**
 * @file contacts.routes.ts
 * @description Child routes for the contacts feature — shell + optional
 *   `:id` detail child, lazy-loaded from `app.routes.ts`.
 */

import { Routes } from '@angular/router';

export const CONTACTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./contacts-shell.component').then((m) => m.ContactsShellComponent),
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./contact-details/contact-details.component').then(
            (m) => m.ContactDetailsComponent,
          ),
      },
      {
        path: '',
        loadComponent: () =>
          import('./contact-details/contact-details.component').then(
            (m) => m.ContactDetailsComponent,
          ),
      },
    ],
  },
];
