import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductsGraph } from './products-graph/products-graph';
import { ProductsService } from './products.service';

@Component({
  selector: 'tor-root',
  imports: [RouterOutlet, ProductsGraph],
  template: `
    <h1>Hello, {{ title() }}</h1>

    @if (productsService.error()) {
      <p style="color: red">{{ productsService.error() }}</p>
    } @else {
      <tor-products-graph />
    }

    <router-outlet />
  `,
  styles: [],
})
export class App implements OnInit {
  protected readonly title = signal('tor');
  protected readonly productsService = inject(ProductsService);

  ngOnInit() {
    this.productsService.load().subscribe({
      next: (products) => this.productsService.products.set(products),
      error: (err: unknown) =>
        this.productsService.error.set(err instanceof Error ? err.message : String(err)),
    });
  }
}
