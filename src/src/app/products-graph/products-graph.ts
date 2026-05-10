import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { buildGraph } from '../helpers';
import { ProductsService } from '../products.service';

@Component({
  selector: 'tor-products-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    <p-card header="Products Graph">
      <div class="flex gap-6">
        <section>
          <h3 class="text-base font-semibold mb-2">Root nodes</h3>
          <ul class="list-none p-0 m-0 flex flex-col gap-1">
            @for (root of graph().roots; track root) {
              <li>{{ root }}</li>
            }
          </ul>
        </section>

        <section>
          <h3 class="text-base font-semibold mb-2">Edges</h3>
          <ul class="list-none p-0 m-0 flex flex-col gap-1">
            @for (edge of graph().edges; track edge.from + edge.to) {
              <li>{{ edge.to }} ← {{ edge.from }} <span class="text-sm opacity-60">(weight: {{ edge.weight }})</span></li>
            }
          </ul>
        </section>
      </div>
    </p-card>
  `,
})
export class ProductsGraph {
  private readonly productsService = inject(ProductsService);

  protected readonly graph = computed(() => buildGraph(this.productsService.products()));
}
