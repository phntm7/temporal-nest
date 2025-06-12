import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { OrderService } from './services/order.service';

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

  @Post('order')
  createOrder() {
    return this.orderService.createOrder({
      orderId: '12345',
      customerId: 'cust-001',
      items: [
        { productId: 'prod-001', quantity: 2, price: 50 },
        { productId: 'prod-002', quantity: 1, price: 100 },
      ],
      totalAmount: 200,
      status: 'new',
    });
  }
}
