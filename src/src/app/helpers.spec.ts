import { buildGraph, Graph, produceProduct, ProductTreeNode, ProductTreeResult } from './helpers';
import { Product } from './products.model';

// ─── helpers ─────────────────────────────────────────────────────────────────

function node(
  key: string,
  weight: number,
  out: number,
  isResource: boolean,
  children: ProductTreeNode[] = [],
): ProductTreeNode {
  return { key, weight, out, isResource, children };
}

function graphOf(products: Product[]): Graph {
  return buildGraph(products);
}

// ─── test data ────────────────────────────────────────────────────────────────

/** Case 1 – one resource → one product */
const simpleProducts: Product[] = [
  { key: 'Iron_ore', resource: true },
  { key: 'Iron_plate', out: 1, recipe: [{ key: 'Iron_ore', in: 2 }] },
];

/**
 * Case 2 – two different resources → one product with intermediate products
 *
 * Electronic_circuit (out:1) requires:
 *   3x Copper_cable (out:2, needs 1x Copper_plate → 1x Copper_ore)
 *   1x Iron_plate   (out:1, needs 1x Iron_ore)
 */
const multiResourceProducts: Product[] = [
  { key: 'Iron_ore', resource: true },
  { key: 'Copper_ore', resource: true },
  { key: 'Iron_plate', out: 1, recipe: [{ key: 'Iron_ore', in: 1 }] },
  { key: 'Copper_plate', out: 1, recipe: [{ key: 'Copper_ore', in: 1 }] },
  { key: 'Copper_cable', out: 2, recipe: [{ key: 'Copper_plate', in: 1 }] },
  {
    key: 'Electronic_circuit',
    out: 1,
    recipe: [
      { key: 'Copper_cable', in: 3 },
      { key: 'Iron_plate', in: 1 },
    ],
  },
];

/**
 * Case 3 – one resource appears on multiple leaves; Iron_plate also appears on
 * multiple leaves; two different resources (Copper_ore, Iron_ore).
 *
 * Gadget (out:1) requires:
 *   1x Widget_A (out:1, needs 1x Iron_plate)
 *   1x Widget_B (out:1, needs 1x Iron_plate + 1x Copper_ore)
 *
 * So Iron_plate must appear twice (once per intermediate), each with weight 1,
 * and Iron_ore must appear twice as well.
 * Copper_ore appears once (under Widget_B) with weight 1.
 */
const multiLeafProducts: Product[] = [
  { key: 'Iron_ore', resource: true },
  { key: 'Copper_ore', resource: true },
  { key: 'Iron_plate', out: 1, recipe: [{ key: 'Iron_ore', in: 1 }] },
  { key: 'Widget_A', out: 1, recipe: [{ key: 'Iron_plate', in: 1 }] },
  {
    key: 'Widget_B',
    out: 1,
    recipe: [
      { key: 'Iron_plate', in: 1 },
      { key: 'Copper_ore', in: 1 },
    ],
  },
  {
    key: 'Gadget',
    out: 1,
    recipe: [
      { key: 'Widget_A', in: 1 },
      { key: 'Widget_B', in: 1 },
    ],
  },
];

// ─── tests ───────────────────────────────────────────────────────────────────

describe('produceProduct', () => {
  // ── Case 1 ──────────────────────────────────────────────────────────────

  describe('one resource producing one product', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = graphOf(simpleProducts);
    });

    it('root has weight 1 and is not a resource', () => {
      const { tree } = produceProduct(graph, 'Iron_plate');
      expect(tree).toEqual(
        node('Iron_plate', 1, 1, false, [node('Iron_ore', 2, 1, true)]),
      );
    });

    it('weight of the resource leaf equals the recipe `in` amount', () => {
      const { tree } = produceProduct(graph, 'Iron_plate');
      expect(tree.children[0].weight).toBe(2);
    });

    it('resource leaf has no children', () => {
      const { tree } = produceProduct(graph, 'Iron_plate');
      expect(tree.children[0].children).toEqual([]);
    });

    it('calling produceProduct on a resource node returns a leaf', () => {
      const { tree } = produceProduct(graph, 'Iron_ore');
      expect(tree).toEqual(node('Iron_ore', 1, 1, true));
    });
  });

  // ── Case 2 ──────────────────────────────────────────────────────────────

  describe('different resources producing one product with intermediate products', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = graphOf(multiResourceProducts);
    });

    it('builds the full tree for Electronic_circuit', () => {
      const { tree } = produceProduct(graph, 'Electronic_circuit');

      expect(tree.key).toBe('Electronic_circuit');
      expect(tree.weight).toBe(1);
      expect(tree.isResource).toBe(false);
      expect(tree.children.length).toBe(2);
    });

    it('Copper_cable branch has weight 3 (in:3 / out:1)', () => {
      const { tree } = produceProduct(graph, 'Electronic_circuit');
      const cable = tree.children.find((c) => c.key === 'Copper_cable')!;
      expect(cable.weight).toBe(3);
      expect(cable.out).toBe(2);
    });

    it('Copper_plate under Copper_cable has weight 1.5 (3 × 1/2)', () => {
      const { tree } = produceProduct(graph, 'Electronic_circuit');
      const cable = tree.children.find((c) => c.key === 'Copper_cable')!;
      const plate = cable.children[0];
      expect(plate.key).toBe('Copper_plate');
      expect(plate.weight).toBeCloseTo(1.5);
    });

    it('Copper_ore leaf under Copper_plate has weight 1.5', () => {
      const { tree } = produceProduct(graph, 'Electronic_circuit');
      const cable = tree.children.find((c) => c.key === 'Copper_cable')!;
      const ore = cable.children[0].children[0];
      expect(ore.key).toBe('Copper_ore');
      expect(ore.weight).toBeCloseTo(1.5);
      expect(ore.isResource).toBe(true);
    });

    it('Iron_plate branch has weight 1 (in:1 / out:1)', () => {
      const { tree } = produceProduct(graph, 'Electronic_circuit');
      const ironPlate = tree.children.find((c) => c.key === 'Iron_plate')!;
      expect(ironPlate.weight).toBe(1);
    });

    it('Iron_ore leaf under Iron_plate has weight 1', () => {
      const { tree } = produceProduct(graph, 'Electronic_circuit');
      const ironPlate = tree.children.find((c) => c.key === 'Iron_plate')!;
      const ironOre = ironPlate.children[0];
      expect(ironOre.key).toBe('Iron_ore');
      expect(ironOre.weight).toBe(1);
      expect(ironOre.isResource).toBe(true);
    });
  });

  // ── Case 3 ──────────────────────────────────────────────────────────────

  describe('one resource on multiple leaves with two different resources', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = graphOf(multiLeafProducts);
    });

    it('Gadget tree has two children (Widget_A and Widget_B)', () => {
      const { tree } = produceProduct(graph, 'Gadget');
      expect(tree.children.length).toBe(2);
      const keys = tree.children.map((c) => c.key).sort();
      expect(keys).toEqual(['Widget_A', 'Widget_B']);
    });

    it('Widget_A has one Iron_plate child with weight 1', () => {
      const { tree } = produceProduct(graph, 'Gadget');
      const widgetA = tree.children.find((c) => c.key === 'Widget_A')!;
      expect(widgetA.children.length).toBe(1);
      expect(widgetA.children[0].key).toBe('Iron_plate');
      expect(widgetA.children[0].weight).toBe(1);
    });

    it('Widget_B has Iron_plate and Copper_ore children each with weight 1', () => {
      const { tree } = produceProduct(graph, 'Gadget');
      const widgetB = tree.children.find((c) => c.key === 'Widget_B')!;
      expect(widgetB.children.length).toBe(2);

      const ironPlate = widgetB.children.find((c) => c.key === 'Iron_plate')!;
      const copperOre = widgetB.children.find((c) => c.key === 'Copper_ore')!;

      expect(ironPlate.weight).toBe(1);
      expect(copperOre.weight).toBe(1);
      expect(copperOre.isResource).toBe(true);
    });

    it('Iron_plate appears as a separate node in each branch (branches do not cross)', () => {
      const { tree } = produceProduct(graph, 'Gadget');
      const widgetA = tree.children.find((c) => c.key === 'Widget_A')!;
      const widgetB = tree.children.find((c) => c.key === 'Widget_B')!;

      const ironPlateA = widgetA.children.find((c) => c.key === 'Iron_plate')!;
      const ironPlateB = widgetB.children.find((c) => c.key === 'Iron_plate')!;

      // Must be distinct object instances
      expect(ironPlateA).not.toBe(ironPlateB);
    });

    it('Iron_ore appears under each Iron_plate independently', () => {
      const { tree } = produceProduct(graph, 'Gadget');
      const widgetA = tree.children.find((c) => c.key === 'Widget_A')!;
      const widgetB = tree.children.find((c) => c.key === 'Widget_B')!;

      const ironOreA = widgetA.children.find((c) => c.key === 'Iron_plate')!.children[0];
      const ironOreB = widgetB.children
        .find((c) => c.key === 'Iron_plate')!
        .children[0];

      expect(ironOreA.key).toBe('Iron_ore');
      expect(ironOreB.key).toBe('Iron_ore');
      expect(ironOreA.weight).toBe(1);
      expect(ironOreB.weight).toBe(1);
      expect(ironOreA).not.toBe(ironOreB);
    });
  });

  // ── Case 4 – warnings for products missing path to resource ───────────────

  describe('warnings for products with no path to a resource', () => {
    /**
     * Plastic_bar references Coal and Petroleum_gas which are not defined in
     * the graph (neither as resources nor as manufactured products).
     */
    const missingResourceProducts: Product[] = [
      { key: 'Iron_ore', resource: true },
      { key: 'Iron_plate', out: 1, recipe: [{ key: 'Iron_ore', in: 1 }] },
      {
        key: 'Plastic_bar',
        out: 2,
        recipe: [
          { key: 'Coal', in: 1 },
          { key: 'Petroleum_gas', in: 20 },
        ],
      },
      {
        key: 'Advanced_circuit',
        out: 1,
        recipe: [
          { key: 'Iron_plate', in: 1 },
          { key: 'Plastic_bar', in: 2 },
        ],
      },
    ];

    it('returns no warnings for a fully connected product', () => {
      const graph = graphOf(simpleProducts);
      const { warnings } = produceProduct(graph, 'Iron_plate');
      expect(warnings).toEqual([]);
    });

    it('returns warnings for leaves that are not resources', () => {
      const graph = graphOf(missingResourceProducts);
      const { warnings } = produceProduct(graph, 'Advanced_circuit');
      expect(warnings).toContain('Coal');
      expect(warnings).toContain('Petroleum_gas');
    });

    it('does not include resource leaves in warnings', () => {
      const graph = graphOf(missingResourceProducts);
      const { warnings } = produceProduct(graph, 'Advanced_circuit');
      expect(warnings).not.toContain('Iron_ore');
    });

    it('each missing key appears only once in warnings even if used multiple times', () => {
      // Two products both referencing the same undefined ingredient
      const products: Product[] = [
        {
          key: 'Widget_X',
          out: 1,
          recipe: [{ key: 'Coal', in: 1 }],
        },
        {
          key: 'Widget_Y',
          out: 1,
          recipe: [{ key: 'Coal', in: 2 }],
        },
        {
          key: 'Product_Z',
          out: 1,
          recipe: [
            { key: 'Widget_X', in: 1 },
            { key: 'Widget_Y', in: 1 },
          ],
        },
      ];
      const graph = graphOf(products);
      const { warnings } = produceProduct(graph, 'Product_Z');
      expect(warnings.filter((w) => w === 'Coal').length).toBe(1);
    });

    it('tree is still fully built even when warnings are present', () => {
      const graph = graphOf(missingResourceProducts);
      const { tree } = produceProduct(graph, 'Advanced_circuit');
      const plasticBranch = tree.children.find((c) => c.key === 'Plastic_bar')!;
      expect(plasticBranch).toBeDefined();
      expect(plasticBranch.children.length).toBe(2);
      const childKeys = plasticBranch.children.map((c) => c.key).sort();
      expect(childKeys).toEqual(['Coal', 'Petroleum_gas']);
    });
  });
});
