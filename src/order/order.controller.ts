import { Controller, Post } from '@nestjs/common';
import { OrderService } from './services/order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder() {
    const orderId = Math.random().toString(36).substring(2, 9);
    return this.orderService.createOrder({
      orderId: orderId,
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
