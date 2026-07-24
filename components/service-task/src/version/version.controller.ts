import { Controller, Get, Inject } from '@nestjs/common';

import { type VersionInfo, VersionService } from './version.service.js';

@Controller('version')
export class VersionController {
  constructor(@Inject(VersionService) private readonly version: VersionService) {}

  @Get()
  getVersion(): VersionInfo {
    return this.version.getVersion();
  }
}
