import { Routes } from '@angular/router';
import { ProductsGraph } from './products-graph/products-graph';
import { ProductTree } from './product-tree/product-tree';

export const routes: Routes = [
  { path: '', pathMatch: 'full', children: [] },
  { path: 'products-graph', component: ProductsGraph, title: 'Products Graph' },
  { path: 'products-tree', component: ProductTree, title: 'Product Tree' },
];
