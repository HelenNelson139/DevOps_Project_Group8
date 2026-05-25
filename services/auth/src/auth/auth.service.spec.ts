import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Pick<UsersService, 'findByStudentId'>;
  let jwtService: Pick<JwtService, 'sign'>;
  let user: User;

  beforeEach(async () => {
    user = {
      id: 'user-1',
      studentId: '23521023',
      passwordHash: await bcrypt.hash('password', 10),
      fullName: 'Hoang Thai Ngoc',
      faculty: 'Computer Networks',
      batch: '2023',
      role: 'student',
      email: '23521023@gm.uit.edu.vn',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    usersService = {
      findByStudentId: jest.fn(async () => user),
    };
    jwtService = {
      sign: jest.fn(() => 'signed-token'),
    };

    authService = new AuthService(usersService as UsersService, jwtService as JwtService);
  });

  it('returns the user when credentials are valid', async () => {
    await expect(authService.validateUser('23521023', 'password')).resolves.toEqual(user);
    expect(usersService.findByStudentId).toHaveBeenCalledWith('23521023');
  });

  it('returns null when password is invalid', async () => {
    await expect(authService.validateUser('23521023', 'wrong-password')).resolves.toBeNull();
  });

  it('returns an access token and profile when login succeeds', async () => {
    const result = await authService.login('23521023', 'password');

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.studentId).toBe('23521023');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: user.id,
      studentId: user.studentId,
      role: user.role,
    });
  });

  it('throws UnauthorizedException when login fails', async () => {
    jest.spyOn(authService, 'validateUser').mockImplementation(async () => null);

    await expect(authService.login('23521023', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
