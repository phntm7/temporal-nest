import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TemporalModule } from 'nestjs-temporal-core';
import { OrderActivities } from './activities/order.activities';
import { OrderService } from './services/order.service';
// import * as path from 'path';
import { OrderController } from './workflows';

@Module({
  imports: [
    TemporalModule.register({
      connection: {
        address: 'localhost:7233',
        namespace: 'default',
      },
      taskQueue: 'orders-task-queue',
      worker: {
        workflowsPath: './dist/workflows',
        activityClasses: [OrderActivities],
        autoStart: true,
      },
      isGlobal: true,
    }),
  ],
  controllers: [AppController, OrderController],
  providers: [AppService, OrderService],
})
export class AppModule {}
