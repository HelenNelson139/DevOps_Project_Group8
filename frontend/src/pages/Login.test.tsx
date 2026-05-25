import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login';

const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('Login page', () => {
  it('renders the login form controls', () => {
    const { container } = render(<Login />);

    expect(container.querySelector('#login_studentId')).not.toBeNull();
    expect(container.querySelector('#login_password')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')).not.toBeNull();
  });
});