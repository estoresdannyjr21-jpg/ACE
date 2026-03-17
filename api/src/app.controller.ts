import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'Ace Truckers Corp ERP API',
      version: '1.0',
      docs: '/api',
      health: 'ok',
    };
  }
}
