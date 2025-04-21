import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guards';
import { Reflector } from '@nestjs/core';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for public routes', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
  });
});
