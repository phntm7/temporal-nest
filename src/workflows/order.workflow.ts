import {
  WorkflowController,
  WorkflowMethod,
  Signal,
  Query,
} from 'nestjs-temporal-core';
import { proxyActivities } from '@temporalio/workflow';
import type { Order, OrderItem } from '../activities/order.activities';

interface OrderActivities {
  validateOrder(order: Order): Promise<boolean>;
  checkInventory(items: OrderItem[]): Promise<boolean>;
  reserveInventory(items: OrderItem[]): Promise<string>;
  processPayment(
    orderId: string,
    amount: number,
    customerId: string,
  ): Promise<string>;
  fulfillOrder(orderId: string, items: OrderItem[]): Promise<string>;
  sendOrderConfirmation(
    orderId: string,
    customerId: string,
    trackingNumber: string,
  ): Promise<void>;
  compensateInventory(reservationId: string): Promise<void>;
  refundPayment(paymentId: string): Promise<void>;
}

const activities = proxyActivities<OrderActivities>({
  startToCloseTimeout: '2m',
  retry: {
    maximumAttempts: 3,
    initialInterval: 1000,
    maximumInterval: 10000,
  },
});

@WorkflowController({ taskQueue: 'orders' })
export class OrderWorkflow {
  private status = 'pending';
  private reservationId?: string;
  private paymentId?: string;
  private trackingNumber?: string;
  private error?: string;

  @WorkflowMethod()
  async processOrder(order: Order): Promise<string> {
    try {
      this.status = 'validating';

      // Step 1: Validate order
      const isValid = await activities.validateOrder(order);
      if (!isValid) {
        throw new Error('Order validation failed');
      }

      this.status = 'checking-inventory';

      // Step 2: Check inventory
      const inventoryAvailable = await activities.checkInventory(order.items);
      if (!inventoryAvailable) {
        throw new Error('Insufficient inventory');
      }

      this.status = 'reserving-inventory';

      // Step 3: Reserve inventory
      this.reservationId = await activities.reserveInventory(order.items);

      this.status = 'processing-payment';

      // Step 4: Process payment
      this.paymentId = await activities.processPayment(
        order.orderId,
        order.totalAmount,
        order.customerId,
      );

      this.status = 'fulfilling';

      // Step 5: Fulfill order
      this.trackingNumber = await activities.fulfillOrder(
        order.orderId,
        order.items,
      );

      this.status = 'confirming';

      // Step 6: Send confirmation
      await activities.sendOrderConfirmation(
        order.orderId,
        order.customerId,
        this.trackingNumber,
      );

      this.status = 'completed';
      return this.trackingNumber;
    } catch (error) {
      this.error = (error as Error).message;
      this.status = 'compensating';

      // Compensation logic
      if (this.paymentId) {
        await activities.refundPayment(this.paymentId);
      }

      if (this.reservationId) {
        await activities.compensateInventory(this.reservationId);
      }

      this.status = 'failed';
      throw error;
    }
  }

  @Signal('cancelOrder')
  async cancelOrder(): Promise<void> {
    if (this.status === 'completed') {
      throw new Error('Cannot cancel completed order');
    }

    this.status = 'cancelling';

    // Perform compensation
    if (this.paymentId) {
      await activities.refundPayment(this.paymentId);
    }

    if (this.reservationId) {
      await activities.compensateInventory(this.reservationId);
    }

    this.status = 'cancelled';
  }

  @Query('getStatus')
  getStatus(): string {
    return this.status;
  }

  @Query('getTrackingNumber')
  getTrackingNumber(): string | undefined {
    return this.trackingNumber;
  }

  @Query('getError')
  getError(): string | undefined {
    return this.error;
  }
}
