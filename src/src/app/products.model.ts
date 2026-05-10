export interface RecipeEntry {
  key: string;
  in: number;
}

export interface Product {
  key: string;
  resource?: true;
  out?: number;
  recipe?: RecipeEntry[];
}
