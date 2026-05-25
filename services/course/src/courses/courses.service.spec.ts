import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { CoursesService } from './courses.service';

const createQueryBuilder = (classes: unknown[]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(async () => classes),
});

describe('CoursesService', () => {
  it('maps class stats with registered counts', async () => {
    const classes = [
      {
        id: 'class-1',
        classCode: 'SE101.N11',
        maxStudents: 60,
        dayOfWeek: '2',
        periods: '1,2,3',
        lecturerName: 'Lecturer A',
        startDate: new Date('2026-01-05T00:00:00Z'),
        endDate: new Date('2026-05-20T00:00:00Z'),
        biWeekly: null,
        course: {
          courseCode: 'SE101',
          name: 'Software Engineering',
          credits: 3,
        },
      },
    ];

    const courseRepo = {
      find: jest.fn(),
      delete: jest.fn(),
    };
    const classRepo = {
      createQueryBuilder: jest.fn(() => createQueryBuilder(classes)),
      manager: {
        query: jest.fn(async () => [{ class_id: 'class-1', cnt: 12 }]),
      },
      count: jest.fn(),
    };

    const service = new CoursesService(courseRepo as any, classRepo as any, { parse: jest.fn() } as any);

    await expect(service.stats(1, 2026)).resolves.toEqual([
      {
        classId: 'class-1',
        classCode: 'SE101.N11',
        courseCode: 'SE101',
        courseName: 'Software Engineering',
        credits: 3,
        maxStudents: 60,
        registeredCount: 12,
        dayOfWeek: '2',
        periods: '1,2,3',
        lecturerName: 'Lecturer A',
        startDate: '2026-01-05',
        endDate: '2026-05-20',
        biWeekly: null,
      },
    ]);
  });

  it('returns zero deletes when no courses match clearAll filter', async () => {
    const courseRepo = {
      find: jest.fn(async () => []),
      delete: jest.fn(),
    };
    const classRepo = {
      count: jest.fn(),
    };

    const service = new CoursesService(courseRepo as any, classRepo as any, { parse: jest.fn() } as any);

    await expect(service.clearAll(1, 2026)).resolves.toEqual({ deletedCourses: 0, deletedClasses: 0 });
    expect(courseRepo.delete).not.toHaveBeenCalled();
    expect(classRepo.count).not.toHaveBeenCalled();
  });
});

