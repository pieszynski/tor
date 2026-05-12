import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Toolbar } from 'primeng/toolbar';
import { BuildInfoService } from './build-info.service';
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
        @if (isNarrow()) {
          <p-button
            [icon]="themeIcon()"
            [text]="true"
            (onClick)="cycleTheme()"
          />
        } @else {
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
        }
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

    @if (buildInfo.info; as info) {
      <footer class="build-footer">
        <span>{{ info.author }}</span>
        <span class="sep">|</span>
        <span>{{ info.version }}</span>
        <span class="sep">|</span>
        <a [href]="info.repo" target="_blank" rel="noreferrer noopener">{{ info.repoLabel }}</a>
      </footer>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    :host > :not(footer) {
      flex-shrink: 0;
    }
    :host > footer {
      margin-top: auto;
    }
    .build-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      font-size: 0.75rem;
      color: var(--p-text-muted-color);
      border-top: 1px solid var(--p-surface-border);
      margin-top: 2rem;
    }
    .build-footer a {
      color: inherit;
      text-decoration: none;
    }
    .build-footer a:hover {
      color: var(--p-primary-color);
    }
    .sep { opacity: 0.4; }
  `],
})
export class App implements OnInit {
  protected readonly productsService = inject(ProductsService);
  protected readonly buildInfo = inject(BuildInfoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  protected readonly themeMode = signal<ThemeMode>('system');

  protected readonly isNarrow = signal(window.innerWidth < 700);

  protected readonly themeIcon = computed(() => {
    const mode = this.themeMode();
    return mode === 'light' ? 'pi pi-sun' : mode === 'dark' ? 'pi pi-moon' : 'pi pi-desktop';
  });

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

  protected cycleTheme(): void {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(this.themeMode()) + 1) % order.length];
    this.setTheme(next);
  }

  ngOnInit() {
    this.applyTheme('system');
    const handler = () => {
      if (this.themeMode() === 'system') this.applyTheme('system');
    };
    this.mediaQuery.addEventListener('change', handler);

    const resizeHandler = () => this.isNarrow.set(window.innerWidth < 700);
    window.addEventListener('resize', resizeHandler);
    this.destroyRef.onDestroy(() => {
      this.mediaQuery.removeEventListener('change', handler);
      window.removeEventListener('resize', resizeHandler);
    });

    this.productsService.load().subscribe({
      next: (products) => this.productsService.products.set(products),
      error: (err: unknown) =>
        this.productsService.error.set(err instanceof Error ? err.message : String(err)),
    });
  }
}
