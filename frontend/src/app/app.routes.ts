import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'contacts',
    loadChildren: () =>
      import('./features/contacts/contacts.routes').then((m) => m.CONTACTS_ROUTES),
  },
  { path: '', redirectTo: '/contacts', pathMatch: 'full' },
];
