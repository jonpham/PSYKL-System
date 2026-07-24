import { Injectable } from '@nestjs/common';

export interface VersionInfo {
  component: string;
  commit: string;
}

@Injectable()
export class VersionService {
  getVersion(): VersionInfo {
    const raw = process.env.GIT_SHA;
    const commit = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : 'dev';
    return { component: 'service-task', commit };
  }
}
