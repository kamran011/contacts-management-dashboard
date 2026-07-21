/**
 * @file app.config.ts
 * @description Root application providers: router, HttpClient, Apollo GraphQL.
 *
 * PATTERN: Fully functional/standalone bootstrap (no NgModules). Apollo Client's
 *   normalised InMemoryCache is the app's state store — contacts are cached by
 *   `id`, so revisiting a contact renders instantly with zero re-fetch. NgRx is
 *   deliberately omitted (overkill for this scope).
 *
 * NOTE: `/graphql` is a relative URI proxied to the BFF (localhost:4000) by the
 *   Angular dev server (see proxy.conf.json) — avoids CORS config in dev and
 *   mirrors how a reverse proxy would front the BFF in production.
 */

import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      return {
        link: httpLink.create({ uri: '/graphql' }),
        cache: new InMemoryCache(),
      };
    }),
  ],
};
