import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { buildGraph, produceProduct, ProductTreeNode } from '../helpers';
import { ProductsService } from '../products.service';

function formatAmount(node: ProductTreeNode): string {
  const needed = Math.ceil(node.weight);
  if (node.isResource || node.out <= 1) return `×${needed}`;
  const crafts = Math.ceil(node.weight / node.out);
  const produced = crafts * node.out;
  const extra = produced - needed;
  return extra > 0 ? `×${needed} + ×${extra} (extra)` : `×${needed}`;
}

function renderAsciiTree(node: ProductTreeNode, prefix = '', childrenPrefix = ''): string {
  const label = `${node.key} ${formatAmount(node)}${node.isResource ? ' [resource]' : ''}`;
  const line = prefix + label;

  const childLines = node.children.flatMap((child, i) => {
    const isLast = i === node.children.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const extension = isLast ? '    ' : '│   ';
    return renderAsciiTree(child, childrenPrefix + connector, childrenPrefix + extension).split('\n');
  });

  return [line, ...childLines].join('\n');
}

function collectResources(node: ProductTreeNode, acc: Map<string, number>): void {
  if (node.isResource) {
    acc.set(node.key, (acc.get(node.key) ?? 0) + node.weight);
    return;
  }
  for (const child of node.children) {
    collectResources(child, acc);
  }
}

function buildSummary(key: string, tree: ProductTreeNode): string {
  const resources = new Map<string, number>();
  collectResources(tree, resources);
  const parts = [...resources.entries()]
    .map(([k, w]) => `(${k} ×${Math.ceil(w)})`)
    .join(' + ');
  return `${key} ×1 = ${parts}`;
}

@Component({
  selector: 'tor-product-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Select],
  template: `
    <div>
      <h2>Product Tree</h2>

      <p-select
        [options]="manufacturableProducts()"
        [ngModel]="selectedKey()"
        (ngModelChange)="selectedKey.set($event)"
        placeholder="Select a product"
      />

      @if (asciiTree()) {
        <pre style="font-family: monospace; line-height: 1.4">{{ asciiTree() }}</pre>
        <p>{{ summary() }}</p>
      }
    </div>
  `,
})
export class ProductTree {
  private readonly productsService = inject(ProductsService);

  protected readonly selectedKey = signal<string>('');

  protected readonly manufacturableProducts = computed(() =>
    this.productsService.products()
      .filter((p) => !p.resource)
      .map((p) => p.key),
  );

  private readonly tree = computed(() => {
    const key = this.selectedKey();
    if (!key) return null;
    const graph = buildGraph(this.productsService.products());
    return produceProduct(graph, key);
  });

  protected readonly asciiTree = computed(() => {
    const tree = this.tree();
    return tree ? renderAsciiTree(tree) : null;
  });

  protected readonly summary = computed(() => {
    const key = this.selectedKey();
    const tree = this.tree();
    return tree ? buildSummary(key, tree) : null;
  });
}
