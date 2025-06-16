import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { OrderService } from './order/services/order.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly orderService: OrderService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
