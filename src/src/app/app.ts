import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Toolbar } from 'primeng/toolbar';
import { ProductsService } from './products.service';

type ThemeMode = 'system' | 'light' | 'dark';

@Component({
  selector: 'tor-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toolbar, Button, SelectButton, FormsModule],
  template: `
    <p-toolbar>
      <ng-template #start>
        <p-button
          label="Tor"
          icon="pi pi-home"
          [text]="true"
          routerLink="/"
        />
        <p-button
          label="Product Tree"
          routerLink="/products-tree"
          routerLinkActive="p-button-outlined"
          styleClass="ml-2"
        />
        <p-button
          label="Products Graph"
          routerLink="/products-graph"
          routerLinkActive="p-button-outlined"
          styleClass="ml-2"
        />
      </ng-template>
      <ng-template #end>
        <p-selectbutton
          [options]="themeModeOptions"
          [ngModel]="themeMode()"
          (ngModelChange)="setTheme($event)"
          optionValue="value"
        >
          <ng-template #item let-item>
            <i [class]="item.icon"></i>
          </ng-template>
        </p-selectbutton>
      </ng-template>
    </p-toolbar>

    @if (productsService.error()) {
      <div class="page-content">
        <p style="color: var(--p-red-500)">{{ productsService.error() }}</p>
      </div>
    } @else {
      <div class="page-content">
        <router-outlet />
      </div>
    }
  `,
  styles: [],
})
export class App implements OnInit {
  protected readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  protected readonly themeMode = signal<ThemeMode>('system');

  protected readonly themeModeOptions: { value: ThemeMode; icon: string }[] = [
    { value: 'system', icon: 'pi pi-desktop' },
    { value: 'light', icon: 'pi pi-sun' },
    { value: 'dark', icon: 'pi pi-moon' },
  ];

  private applyTheme(mode: ThemeMode): void {
    const isDark = mode === 'dark' || (mode === 'system' && this.mediaQuery.matches);
    document.documentElement.classList.toggle('p-dark', isDark);
  }

  protected setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    this.applyTheme(mode);
  }

  ngOnInit() {
    this.applyTheme('system');
    const handler = () => {
      if (this.themeMode() === 'system') this.applyTheme('system');
    };
    this.mediaQuery.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => this.mediaQuery.removeEventListener('change', handler));

    this.productsService.load().subscribe({
      next: (products) => this.productsService.products.set(products),
      error: (err: unknown) =>
        this.productsService.error.set(err instanceof Error ? err.message : String(err)),
    });
  }
}
