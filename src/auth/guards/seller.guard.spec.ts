import { SellerGuard } from './seller.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('SellerGuard', () => {
  let guard: SellerGuard;

  beforeEach(() => {
    guard = new SellerGuard();
  });

  it('should allow seller access', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: Role.SELLER },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException for non-seller access', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: Role.SHOPPER },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Only sellers can access this resource',
    );
  });

  it('should handle missing user', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
