import { Module } from '@nestjs/common';
import { TemporalModule } from 'nestjs-temporal';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    TemporalModule.registerClient({
      connection: {
        address: '10.0.4.74:7233',
      },
    }),
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
