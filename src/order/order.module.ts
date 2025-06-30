import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './services/order.service';
import { OrderActivities } from './activities/order.activities';
import { MailModule } from 'src/mail/mail.module';
import { TemporalModule } from 'nestjs-temporal';

@Module({
  imports: [
    MailModule,
    TemporalModule.registerWorker({
      connectionOptions: {
        // address: 'localhost:7233',
        address: '10.0.4.74:7233',
      },
      workerOptions: {
        taskQueue: 'orders-task-queue',
        workflowsPath: require.resolve('./workflows'),
        // tuner: {
        //   tunerOptions: {
        //     targetMemoryUsage: 0.8,
        //     targetCpuUsage: 0.9,
        //   },
        // },
      },
      activityClasses: [OrderActivities],
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderActivities],
})
export class OrderModule {}
