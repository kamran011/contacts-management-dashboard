/**
 * @file full-name.pipe.ts
 * @description Combines firstName/lastName when a component only has the parts
 *   (the GraphQL API already resolves `fullName` server-side for most reads —
 *   this pipe covers the rare case where only first/last are on hand, e.g. a
 *   details view rendering a greeting from `firstName` alone is out of scope).
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fullName', standalone: true })
export class FullNamePipe implements PipeTransform {
  transform(firstName: string | null | undefined, lastName: string | null | undefined): string {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
}
