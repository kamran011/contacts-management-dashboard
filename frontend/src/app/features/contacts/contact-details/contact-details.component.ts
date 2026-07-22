/**
 * @file contact-details.component.ts
 * @description Shows the selected contact's full profile: header, action bar,
 *   and detail rows (Bio, Email, Dial, Meeting, Phone, Social).
 *
 * PATTERN: Reacts to `:id` route param changes; re-queries via ContactService
 *   on every param change (Apollo's cache makes repeat visits instant).
 * SIMPLIFICATION: Phone numbers and social links are not present in the
 *   mockapi.io schema, so this view renders static placeholders for them
 *   (see template) rather than fabricating fake data.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { ContactService, type QueryState } from '../../../core/services/contact.service';
import type { Contact } from '../../../core/models/contact.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge/tag-badge.component';

@Component({
  selector: 'app-contact-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, IconButtonComponent, TagBadgeComponent],
  templateUrl: './contact-details.component.html',
  styleUrl: './contact-details.component.scss',
})
export class ContactDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly contactService = inject(ContactService);

  /** Static social icons from Figma exports (mockapi has no social fields). */
  protected readonly socialNetworks = [
    { name: 'Facebook', icon: '/icons/social/facebook.svg', href: '#' },
    { name: 'Pinterest', icon: '/icons/social/pinterest.svg', href: '#' },
    { name: 'Twitter', icon: '/icons/social/twitter.svg', href: '#' },
    { name: 'LinkedIn', icon: '/icons/social/linkedin.svg', href: '#' },
    { name: 'Google', icon: '/icons/social/google.svg', href: '#' },
  ] as const;

  private readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) =>
        id ? this.contactService.getContact(id) : of<QueryState<Contact>>({ data: null, loading: false, error: null }),
      ),
    ),
    { initialValue: { data: null, loading: true, error: null } },
  );

  protected readonly contact = computed(() => this.state().data);
  protected readonly loading = computed(() => this.state().loading);
  protected readonly error = computed(() => this.state().error);

  /** True only when there's no `:id` in the route at all (empty state). */
  protected readonly hasNoSelection = computed(() => !this.route.snapshot.paramMap.get('id'));
}
