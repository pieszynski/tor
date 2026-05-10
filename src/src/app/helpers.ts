import { Product } from './products.model';

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: string[];
  edges: GraphEdge[];
  roots: string[];
  /** Maps product key → number of items produced per craft (1 for resources) */
  outMap: Record<string, number>;
}

export interface ProductTreeNode {
  key: string;
  /** Amount of this product needed relative to producing 1 unit of the tree root */
  weight: number;
  /** Number of items produced per craft (from the product definition) */
  out: number;
  isResource: boolean;
  children: ProductTreeNode[];
}

export function buildGraph(products: Product[]): Graph {
  const nodes = products.map((p) => p.key);
  const roots = products.filter((p) => p.resource === true).map((p) => p.key);
  const edges: GraphEdge[] = [];
  const outMap: Record<string, number> = {};

  for (const product of products) {
    outMap[product.key] = product.resource ? 1 : (product.out ?? 1);

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

  return { nodes, edges, roots, outMap };
}

/**
 * Builds a tree rooted at `productKey` by walking edges backwards through the graph.
 * Each node's `weight` is the total amount needed to produce 1 unit of the root product.
 * Branches never share nodes — each occurrence is an independent subtree.
 * Leaves are resource nodes (graph.roots).
 *
 * Example for Electronic_circuit:
 *   Electronic_circuit (1)
 *   ├── Copper_cable (3)       ← 3 cables needed
 *   │   └── Copper_plate (1.5) ← 3 × (1/2 per cable)
 *   │       └── Copper_ore (1.5) [resource]
 *   └── Iron_plate (1)
 *       └── Iron_ore (1) [resource]
 */
export function produceProduct(graph: Graph, productKey: string): ProductTreeNode {
  return buildNode(graph, productKey, 1, new Set<string>());
}

function buildNode(
  graph: Graph,
  productKey: string,
  weight: number,
  ancestors: ReadonlySet<string>,
): ProductTreeNode {
  const isResource = graph.roots.includes(productKey);
  const children: ProductTreeNode[] = [];

  if (!isResource && !ancestors.has(productKey)) {
    const nextAncestors = new Set(ancestors).add(productKey);
    for (const edge of graph.edges.filter((e) => e.to === productKey)) {
      children.push(buildNode(graph, edge.from, weight * edge.weight, nextAncestors));
    }
  }

  return { key: productKey, weight, out: graph.outMap[productKey] ?? 1, isResource, children };
}
