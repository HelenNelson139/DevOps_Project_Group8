import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsModule } from './registrations/registrations.module';
import { Class } from './registrations/entities/class.entity';
import { Course } from './registrations/entities/course.entity';
import { Enrollment } from './registrations/entities/enrollment.entity';
import { User } from './registrations/entities/user.entity';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Course, Class, Enrollment, User],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
      extra: {
        connectTimeoutMillis: 15000,
        connectionTimeoutMillis: 15000,
      },
    }),
    RegistrationsModule,
    MonitoringModule,
  ],
})
export class AppModule {}
