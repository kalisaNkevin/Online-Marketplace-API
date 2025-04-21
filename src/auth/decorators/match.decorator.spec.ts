import { Match } from './match.decorator';
import { validate } from 'class-validator';

describe('Match Decorator', () => {
  class TestDto {
    password: string;

    @Match('password')
    passwordConfirm: string;
  }

  it('should validate matching fields', async () => {
    const dto = new TestDto();
    dto.password = 'password123';
    dto.passwordConfirm = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation for non-matching fields', async () => {
    const dto = new TestDto();
    dto.password = 'password123';
    dto.passwordConfirm = 'different';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('match');
  });

  it('should handle undefined values', async () => {
    const dto = new TestDto();
    dto.password = 'password123';
    dto.passwordConfirm = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});