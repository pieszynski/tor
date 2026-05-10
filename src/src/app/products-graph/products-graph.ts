import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Product } from '../products.model';
import { ProductsService } from '../products.service';

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: string[];
  edges: GraphEdge[];
  roots: string[];
}

export function buildGraph(products: Product[]): Graph {
  const nodes = products.map((p) => p.key);
  const roots = products.filter((p) => p.resource === true).map((p) => p.key);
  const edges: GraphEdge[] = [];

  for (const product of products) {
    if (!product.recipe) continue;

    const out = product.out ?? 1;

    for (const ingredient of product.recipe) {
      edges.push({
        from: ingredient.key,
        to: product.key,
        weight: ingredient.in / out,
      });
    }
  }

  return { nodes, edges, roots };
}

@Component({
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
            <li>{{ edge.from }} → {{ edge.to }} (weight: {{ edge.weight }})</li>
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
