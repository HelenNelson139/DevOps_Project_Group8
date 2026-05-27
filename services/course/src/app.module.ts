import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from './courses/courses.module';
import { Course } from './courses/entities/course.entity';
import { Class } from './courses/entities/class.entity';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Course, Class],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
    }),
    CoursesModule,
    MonitoringModule,
  ],
})
export class AppModule {}
