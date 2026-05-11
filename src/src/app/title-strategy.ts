import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const parts: string[] = [];

    if (routeTitle === 'Product Tree') {
      const product = snapshot.root.queryParams['product'];
      if (product) parts.push(product);
    }

    if (routeTitle) parts.push(routeTitle);
    parts.push('Tor');

    this.title.setTitle(parts.join(' | '));
  }
}
