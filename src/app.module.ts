import { Module } from '@nestjs/common';
import { TemporalModule } from 'nestjs-temporal';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    TemporalModule.registerWorker({
      connectionOptions: {
        // CHANGE HERE
        address: 'localhost:7233',
      },
      workerOptions: {
        taskQueue: 'orders-task-queue',
        workflowsPath: require.resolve('./workflows'),
      },
    }),

    TemporalModule.registerClient(),
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
