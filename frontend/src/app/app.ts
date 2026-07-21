/**
 * @file app.ts
 * @description Root standalone component — just a router outlet. All routing
 *   (redirect to /contacts, lazy-loaded feature routes) lives in app.routes.ts.
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
