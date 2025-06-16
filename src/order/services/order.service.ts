import { Injectable } from '@nestjs/common';
import { InjectTemporalClient } from 'nestjs-temporal';
import { WorkflowClient } from '@temporalio/client';
import { Order } from '../activities/order.activities';
import {
  processOrder,
  getStatusQuery,
  getTrackingNumberQuery,
  getErrorQuery,
  cancelOrderSignal,
} from '../workflows/order.workflow';

@Injectable()
export class OrderService {
  constructor(
    @InjectTemporalClient()
    private readonly temporalClient: WorkflowClient,
  ) {}

  async createOrder(
    order: Order,
  ): Promise<{ workflowId: string; trackingNumber?: string }> {
    const workflowId = `order-${order.orderId}`;

    try {
      const handle = await this.temporalClient.start(processOrder, {
        args: [order],
        taskQueue: 'orders-task-queue',
        workflowId,
        // searchAttributes: {
        //   customerId: [order.customerId],
        //   totalAmount: [order.totalAmount],
        // },
      });

      const trackingNumber = await handle.result();
      return { workflowId, trackingNumber };
    } catch (error) {
      console.error(`Order processing failed for ${order.orderId}:`, error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    const workflowId = `order-${orderId}`;
    const handle = this.temporalClient.getHandle(workflowId);
    await handle.signal(cancelOrderSignal);
  }

  async getOrderStatus(orderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    error?: string;
  }> {
    const workflowId = `order-${orderId}`;
    const handle = this.temporalClient.getHandle(workflowId);

    try {
      const [status, trackingNumber, error] = await Promise.all([
        handle.query(getStatusQuery),
        handle.query(getTrackingNumberQuery),
        handle.query(getErrorQuery),
      ]);

      return { status, trackingNumber, error };
    } catch (error) {
      throw new Error(
        `Failed to get order status: ${(error as Error).message}`,
      );
    }
  }
}
