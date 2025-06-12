import { Injectable } from '@nestjs/common';
import { TemporalService } from 'nestjs-temporal-core';
import { Order } from '../activities/order.activities';

@Injectable()
export class OrderService {
  constructor(private readonly temporalService: TemporalService) {}

  async createOrder(
    order: Order,
  ): Promise<{ workflowId: string; trackingNumber?: string }> {
    const workflowId = `order-${order.orderId}`;

    try {
      const { result } = await this.temporalService.startWorkflow(
        'processOrder',
        [order],
        {
          workflowId,
          searchAttributes: {
            'customer-id': order.customerId,
            'order-amount': order.totalAmount,
          },
        },
      );

      const trackingNumber = await (result as Promise<string>);
      return { workflowId, trackingNumber };
    } catch (error) {
      console.error(`Order processing failed for ${order.orderId}:`, error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    const workflowId = `order-${orderId}`;
    await this.temporalService.signalWorkflow(workflowId, 'cancelOrder');
  }

  async getOrderStatus(orderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    error?: string;
  }> {
    const workflowId = `order-${orderId}`;

    try {
      const [status, trackingNumber, error] = await Promise.all([
        this.temporalService.queryWorkflow<string>(workflowId, 'getStatus'),
        this.temporalService.queryWorkflow<string>(
          workflowId,
          'getTrackingNumber',
        ),
        this.temporalService.queryWorkflow<string>(workflowId, 'getError'),
      ]);

      return { status, trackingNumber, error };
    } catch (error) {
      throw new Error(
        `Failed to get order status: ${(error as Error).message}`,
      );
    }
  }
}
