import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { buildGraph } from '../helpers';
import { ProductsService } from '../products.service';@Component({
  selector: 'tor-products-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2>Products Graph</h2>

      <section>
        <h3>Root nodes</h3>
        <ul>
          @for (root of graph().roots; track root) {
            <li>{{ root }}</li>
          }
        </ul>
      </section>

      <section>
        <h3>Edges</h3>
        <ul>
          @for (edge of graph().edges; track edge.from + edge.to) {
            <li>{{ edge.to }} ← {{ edge.from }} (weight: {{ edge.weight }})</li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class ProductsGraph {
  private readonly productsService = inject(ProductsService);

  protected readonly graph = computed(() => buildGraph(this.productsService.products()));
}
