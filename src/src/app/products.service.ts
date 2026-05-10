import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import Ajv from 'ajv';
import { load } from 'js-yaml';
import { forkJoin, map } from 'rxjs';
import { Product } from './products.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  readonly products = signal<Product[]>([]);
  readonly error = signal<string | null>(null);

  load() {
    return forkJoin({
      schema: this.http.get('products.schema.json'),
      text: this.http.get('products.yaml', { responseType: 'text' }),
    }).pipe(map(({ schema, text }) => this.parse(schema, text)));
  }

  private parse(schema: unknown, text: string): Product[] {
    const parsed = load(text);
    const validate = new Ajv().compile(schema as object);

    if (!validate(parsed)) {
      const messages = validate.errors!.map((e) => `${e.instancePath} ${e.message}`).join('; ');
      throw new Error(`Invalid products.yaml: ${messages}`);
    }

    return parsed as Product[];
  }
}
