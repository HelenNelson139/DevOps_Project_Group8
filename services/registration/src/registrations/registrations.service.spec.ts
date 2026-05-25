import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';

const registeredCountQuery = (rows: unknown[] = []) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(async () => rows),
});

describe('RegistrationsService', () => {
  const baseClass = {
    id: 'class-1',
    classCode: 'SE101.N11',
    maxStudents: 60,
    dayOfWeek: '2',
    periods: '1,2,3',
    startDate: new Date('2026-01-05T00:00:00Z'),
    endDate: new Date('2026-05-20T00:00:00Z'),
    lecturerName: 'Lecturer A',
    biWeekly: null,
    course: {
      courseCode: 'SE101',
      name: 'Software Engineering',
      credits: 3,
    },
  };

  it('enrolls available classes and publishes an event', async () => {
    const enrollment = { userId: 'user-1', classId: 'class-1', status: 'registered' };
    const enrollmentRepo = {
      createQueryBuilder: jest.fn(() => registeredCountQuery()),
      find: jest.fn(async () => []),
      create: jest.fn().mockReturnValue(enrollment),
      save: jest.fn(async () => [enrollment]),
    };
    const classRepo = {
      find: jest.fn(async () => [baseClass]),
    };
    const rabbit = {
      publishEnrolled: jest.fn(async () => undefined),
      publishCancelled: jest.fn(),
    };

    const service = new RegistrationsService(
      enrollmentRepo as any,
      classRepo as any,
      {} as any,
      rabbit as any,
    );

    await expect(
      service.enroll('user-1', '23521023', 'student@example.com', 'Student Name', ['class-1']),
    ).resolves.toEqual({ enrolled: ['SE101.N11'], failed: [] });

    expect(enrollmentRepo.save).toHaveBeenCalledWith([enrollment]);
    expect(rabbit.publishEnrolled).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        studentId: '23521023',
        classIds: ['class-1'],
        classDetails: [{ classCode: 'SE101.N11', courseName: 'Software Engineering' }],
      }),
    );
  });

  it('rejects empty enrollment requests', async () => {
    const service = new RegistrationsService({} as any, {} as any, {} as any, {} as any);

    await expect(service.enroll('user-1', '23521023', undefined, undefined, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

