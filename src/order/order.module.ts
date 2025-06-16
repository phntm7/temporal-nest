import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './services/order.service';
import { OrderActivities } from './activities/order.activities';

@Module({
  imports: [],
  controllers: [OrderController],
  providers: [OrderService, OrderActivities],
})
export class OrderModule {}
