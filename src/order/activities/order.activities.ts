import { Injectable } from '@nestjs/common';
import { Activities, Activity } from 'nestjs-temporal';
import { log } from '@temporalio/activity';
import { MailService } from 'src/mail/mail.service';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
}

export interface IOrderActivities {
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

@Injectable()
@Activities()
export class OrderActivities implements IOrderActivities {
  constructor(private readonly mailService: MailService) {}

  @Activity()
  async validateOrder(order: Order): Promise<boolean> {
    log.info(`Validating order ${order.orderId}`);
    // Validate order data, customer info, etc.
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Simulate validation time
    this.mailService.sendMail();
    return order.items.length > 0 && order.totalAmount > 0;
  }

  @Activity()
  async checkInventory(items: OrderItem[]): Promise<boolean> {
    console.info('Checking inventory for items:', items);
    // Fail in 50% of cases to simulate inventory issues
    if (Math.random() < 0.5) {
      throw new Error('Inventory check failed');
    }
    // Check if all items are in stock
    for (const item of items) {
      const available = await this.getAvailableQuantity(item.productId);
      if (available < item.quantity) {
        return false;
      }
    }
    this.mailService.sendMail();

    return true;
  }

  @Activity()
  async reserveInventory(items: OrderItem[]): Promise<string> {
    console.info('Reserving inventory for items:', items);
    // Reserve items in inventory system
    if (Math.random() < 0.5) {
      throw new Error('Inventory reservation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate reservation time

    const reservationId = `res_${Date.now()}`;
    // Implementation...
    this.mailService.sendMail();

    return reservationId;
  }

  @Activity()
  async processPayment(
    orderId: string,
    amount: number,
    customerId: string,
  ): Promise<string> {
    log.info(
      `Processing payment for customer ${customerId} order ${orderId}: $${amount}`,
    );

    if (Math.random() < 0.5) {
      throw new Error('Payment processing failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate payment processing time
    // Process payment through payment gateway
    const paymentId = `pay_${Date.now()}`;
    // Implementation...
    this.mailService.sendMail();

    return paymentId;
  }

  @Activity()
  async fulfillOrder(orderId: string, items: OrderItem[]): Promise<string> {
    log.info(`Fulfilling order ${orderId}`, { items });

    if (Math.random() < 0.5) {
      throw new Error('Inventory fulfillment failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulate fulfillment time
    // Create shipping label, pack items, etc.
    const trackingNumber = `track_${Date.now()}`;
    // Implementation...
    this.mailService.sendMail();

    return trackingNumber;
  }

  @Activity()
  async sendOrderConfirmation(
    orderId: string,
    customerId: string,
    trackingNumber: string,
  ): Promise<void> {
    log.info(
      `Sending confirmation for order ${orderId} to customer ${customerId} with tracking ${trackingNumber}`,
    );

    if (Math.random() < 0.5) {
      throw new Error('Sending confirmation email failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate email sending time
    // Send email with tracking information
  }

  @Activity()
  async compensateInventory(reservationId: string): Promise<void> {
    if (Math.random() < 0.5) {
      throw new Error('Compensation failed');
    }

    log.info(`Compensating inventory reservation ${reservationId}`);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate compensation time
    // Release reserved inventory
  }

  @Activity()
  async refundPayment(paymentId: string): Promise<void> {
    log.info(`Refunding payment ${paymentId}`);

    if (Math.random() < 0.5) {
      throw new Error('Refund processing failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulate refund processing time
    // Process refund
  }

  private async getAvailableQuantity(productId: string): Promise<number> {
    // Mock implementation
    log.info(`Checking available quantity for product ${productId}`);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async operation
    return Math.floor(Math.random() * 100) + 10;
  }
}
