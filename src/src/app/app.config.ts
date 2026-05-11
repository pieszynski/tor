import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, TitleStrategy } from '@angular/router';
import { AppTitleStrategy } from './title-strategy';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const BurntOrangePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fdf3e7',
      100: '#fbe0bf',
      200: '#f8ca94',
      300: '#f5b468',
      400: '#f29843',
      500: '#ca6702',
      600: '#bb3e03',
      700: '#9a3303',
      800: '#7a2902',
      900: '#5a1e01',
      950: '#3a1301'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    providePrimeNG({
      theme: {
        preset: BurntOrangePreset,
        options: {
          darkModeSelector: '.p-dark'
        }
      }
    })
  ]
};
