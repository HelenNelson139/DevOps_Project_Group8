import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './notification/notification.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NotificationModule, MonitoringModule],
})
export class AppModule {}
