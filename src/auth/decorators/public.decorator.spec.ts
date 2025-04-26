import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

describe('Public Decorator', () => {
  it('should set metadata with IS_PUBLIC_KEY', () => {
    const reflector = new Reflector();

    @Public()
    class TestClass {}

    const isPublic = reflector.get(IS_PUBLIC_KEY, TestClass);
    expect(isPublic).toBe(true);
  });
});
