import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { buildGraph, produceProduct, ProductTreeNode } from '../helpers';
import { ProductsService } from '../products.service';

interface TreeLine {
  prefix: string;
  warning: boolean;
  key: string;
  suffix: string;
}

function formatAmount(node: ProductTreeNode): string {
  const needed = Math.ceil(node.weight);
  if (node.isResource || node.out <= 1) return `×${needed}`;
  const crafts = Math.ceil(node.weight / node.out);
  const produced = crafts * node.out;
  const extra = produced - needed;
  return extra > 0 ? `×${needed} + ×${extra} (extra)` : `×${needed}`;
}

function renderTreeLines(
  node: ProductTreeNode,
  warningKeys: Set<string>,
  prefix: string,
  childrenPrefix: string,
): TreeLine[] {
  const warning = node.children.length === 0 && !node.isResource && warningKeys.has(node.key);
  const suffix = ` ${formatAmount(node)}${node.isResource ? ' [resource]' : ''}`;
  const line: TreeLine = { prefix, warning, key: node.key, suffix };

  const childLines = node.children.flatMap((child, i) => {
    const isLast = i === node.children.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const extension = isLast ? '    ' : '│   ';
    return renderTreeLines(child, warningKeys, childrenPrefix + connector, childrenPrefix + extension);
  });

  return [line, ...childLines];
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
  styles: [`
    .tree-block { font-family: monospace; line-height: 1.6; background: var(--p-surface-card); padding: 1rem; border-radius: var(--p-border-radius); border: 1px solid var(--p-surface-border); }
    .tree-line { white-space: pre; }
    .wiki-link { color: var(--p-primary-color); text-decoration: none; }
    .wiki-link:hover { text-decoration: underline; }
  `],
  template: `
    <h2 class="text-2xl font-semibold mb-4">Product Tree</h2>

    <p-select
      [options]="manufacturableProducts()"
      [ngModel]="selectedKey()"
      (ngModelChange)="selectedKey.set($event)"
      placeholder="Select a product"
      [filter]="true"
      filterPlaceholder="Search..."
      class="mb-4 block"
    />

    @if (treeLines().length > 0) {
      <p class="mb-3 text-sm" style="color: var(--p-text-muted-color)">{{ summary() }}</p>
      <div class="tree-block">
        @for (line of treeLines(); track $index) {
          <div class="tree-line">{{ line.prefix }}@if (line.warning) {⚠ }<a
            class="wiki-link"
            href="https://wiki.factorio.com/{{ line.key }}"
            target="_blank"
            rel="noreferrer noopener"
          >{{ line.key }}</a>{{ line.suffix }}</div>
        }
      </div>
      @if (warnings().length > 0) {
        <div class="mt-3 p-3 rounded-lg" style="background: var(--p-yellow-50); color: var(--p-yellow-800); border: 1px solid var(--p-yellow-300)">
          <strong>Warning:</strong> No path to a resource for: {{ warnings().join(', ') }}
        </div>
      }
    }
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

  private readonly treeResult = computed(() => {
    const key = this.selectedKey();
    if (!key) return null;
    const graph = buildGraph(this.productsService.products());
    return produceProduct(graph, key);
  });

  protected readonly treeLines = computed(() => {
    const result = this.treeResult();
    return result ? renderTreeLines(result.tree, new Set(result.warnings), '', '') : [];
  });

  protected readonly summary = computed(() => {
    const key = this.selectedKey();
    const result = this.treeResult();
    return result ? buildSummary(key, result.tree) : null;
  });

  protected readonly warnings = computed(() => this.treeResult()?.warnings ?? []);
}
