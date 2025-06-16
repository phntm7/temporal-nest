import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TemporalModule, WORKER_PRESETS } from 'nestjs-temporal-core';
import { OrderActivities } from './activities/order.activities';
import { OrderService } from './services/order.service';
import * as path from 'path';
// import { OrderWorkflow } from './workflows/order.workflow';

@Module({
  imports: [
    TemporalModule.register({
      connection: {
        address: 'localhost:7233',
        namespace: 'default',
      },
      taskQueue: 'orders-task-queue',
      worker: {
        workflowsPath: path.join(__dirname, 'workflows'),
        activityClasses: [OrderActivities],
        autoStart: true,
        workerOptions: WORKER_PRESETS.DEVELOPMENT,
      },
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, OrderService],
})
export class AppModule {}

console.log(path.join(__dirname, 'workflows'));
