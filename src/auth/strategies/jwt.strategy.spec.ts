import { Test } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should validate user payload', async () => {
    const payload = { sub: '1', email: 'test@example.com' };
    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: payload.sub,
      email: payload.email,
    });
  });

  it('should throw UnauthorizedException for invalid payload', async () => {
    const payload = { invalid: 'data' };
    await expect(strategy.validate(payload as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
