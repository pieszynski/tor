import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { Toolbar } from 'primeng/toolbar';
import { ProductsService } from './products.service';

@Component({
  selector: 'tor-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toolbar, Button],
  template: `
    <p-toolbar>
      <ng-template #start>
        <p-button
          label="Tor"
          icon="pi pi-home"
          [text]="true"
          routerLink="/"
        />
        <p-button
          label="Product Tree"
          routerLink="/products-tree"
          routerLinkActive="p-button-outlined"
          styleClass="ml-2"
        />
        <p-button
          label="Products Graph"
          routerLink="/products-graph"
          routerLinkActive="p-button-outlined"
          styleClass="ml-2"
        />
      </ng-template>
    </p-toolbar>

    @if (productsService.error()) {
      <div class="page-content">
        <p style="color: var(--p-red-500)">{{ productsService.error() }}</p>
      </div>
    } @else {
      <div class="page-content">
        <router-outlet />
      </div>
    }
  `,
  styles: [],
})
export class App implements OnInit {
  protected readonly productsService = inject(ProductsService);

  ngOnInit() {
    this.productsService.load().subscribe({
      next: (products) => this.productsService.products.set(products),
      error: (err: unknown) =>
        this.productsService.error.set(err instanceof Error ? err.message : String(err)),
    });
  }
}
