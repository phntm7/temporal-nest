import * as workflow from '@temporalio/workflow';
import type { Order } from '../activities/order.activities';
import { IOrderActivities } from '../activities/order.activities';

const { proxyActivities, defineSignal, defineQuery } = workflow;

const activities = proxyActivities<IOrderActivities>({
  startToCloseTimeout: '2m',
  retry: {
    maximumAttempts: 3,
    initialInterval: 1000,
    maximumInterval: 10000,
  },
});

export const getStatusQuery = defineQuery<string>('getStatus');
export const getTrackingNumberQuery = defineQuery<string | undefined>(
  'getTrackingNumber',
);
export const getErrorQuery = defineQuery<string | undefined>('getError');
export const cancelOrderSignal = defineSignal<[]>('cancelOrder');

export async function processOrder(order: Order): Promise<string> {
  let status = 'pending';
  let reservationId: string | undefined;
  let paymentId: string | undefined;
  let trackingNumber: string | undefined;
  let error: string | undefined;

  // Define query handlers
  workflow.setHandler(getStatusQuery, () => status);
  workflow.setHandler(getTrackingNumberQuery, () => trackingNumber);
  workflow.setHandler(getErrorQuery, () => error);

  // Define signal handler
  workflow.setHandler(cancelOrderSignal, async () => {
    if (status === 'completed') {
      throw new Error('Cannot cancel completed order');
    }

    status = 'cancelling';

    // Perform compensation
    if (paymentId) {
      await activities.refundPayment(paymentId);
    }

    if (reservationId) {
      await activities.compensateInventory(reservationId);
    }

    status = 'cancelled';
  });

  try {
    status = 'validating';

    // Step 1: Validate order
    const isValid = await activities.validateOrder(order);
    if (!isValid) {
      throw new Error('Order validation failed');
    }

    status = 'checking-inventory';

    // Step 2: Check inventory
    const inventoryAvailable = await activities.checkInventory(order.items);
    if (!inventoryAvailable) {
      throw new Error('Insufficient inventory');
    }

    status = 'reserving-inventory';

    // Step 3: Reserve inventory
    reservationId = await activities.reserveInventory(order.items);

    status = 'processing-payment';

    // Step 4: Process payment
    paymentId = await activities.processPayment(
      order.orderId,
      order.totalAmount,
      order.customerId,
    );

    status = 'fulfilling';

    // Step 5: Fulfill order
    trackingNumber = await activities.fulfillOrder(order.orderId, order.items);

    status = 'confirming';

    // Step 6: Send confirmation
    await activities.sendOrderConfirmation(
      order.orderId,
      order.customerId,
      trackingNumber,
    );

    status = 'completed';
    if (!trackingNumber) {
      throw new Error('Tracking number not generated');
    }
    return trackingNumber;
  } catch (err) {
    error = (err as Error).message;
    status = 'compensating';

    // Compensation logic
    if (paymentId) {
      await activities.refundPayment(paymentId);
    }

    if (reservationId) {
      await activities.compensateInventory(reservationId);
    }

    status = 'failed';
    throw err;
  }
}
