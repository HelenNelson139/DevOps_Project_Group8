import { describe, expect, it, jest } from '@jest/globals';
import { MailService } from './mail.service';

describe('MailService', () => {
  it('does not send enrolled email when transporter is not configured', async () => {
    const service = new MailService();

    await expect(
      service.sendEnrolledEmail('student@example.com', 'Student Name', [
        { classCode: 'SE101.N11', courseName: 'Software Engineering' },
      ]),
    ).resolves.toBeUndefined();
  });

  it('sends cancelled email when transporter is configured', async () => {
    const service = new MailService();
    const sendMail = jest.fn(async () => undefined);
    (service as any).transporter = { sendMail };

    await service.sendCancelledEmail('student@example.com', 'Student Name', 'SE101.N11', 'Software Engineering');

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'student@example.com',
        from: 'noreply@uit-dkhp.local',
      }),
    );
  });
});

