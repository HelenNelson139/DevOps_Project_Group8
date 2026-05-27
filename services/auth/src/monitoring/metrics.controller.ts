import { Controller, Get, Header } from '@nestjs/common';
import { metricsRegistry } from './metrics';

@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(): string {
    return metricsRegistry.render();
  }
}
