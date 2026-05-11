import { Injectable } from '@angular/core';
import { devBuildInfo } from '../environments/environment';

export interface BuildInfo {
  author: string;
  version: string;
  repo: string;
  repoLabel: string;
}

@Injectable({ providedIn: 'root' })
export class BuildInfoService {
  readonly info: BuildInfo | null;

  constructor() {
    const content = document.querySelector('meta[name="build-info"]')?.getAttribute('content') ?? '';
    const [author, version, repo] = content.split('|');
    if (!author || author.startsWith('%%')) {
      this.info = devBuildInfo;
      return;
    }
    this.info = {
      author,
      version,
      repo,
      repoLabel: repo.replace('https://github.com/', 'gh/'),
    };
  }
}
