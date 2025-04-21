import { Roles, ROLES_KEY } from './roles.decorator';
import { Role } from '@prisma/client';
import { Reflector } from '@nestjs/core';

describe('Roles Decorator', () => {
  it('should set metadata with provided roles', () => {
    const reflector = new Reflector();
    const roles = [Role.ADMIN, Role.SELLER, Role.SHOPPER];

    @Roles(roles)
    class TestClass {}

    const decoratorRoles = reflector.get(ROLES_KEY, TestClass);
    expect(decoratorRoles).toEqual(roles);
  });

  it('should handle single role', () => {
    const reflector = new Reflector();

    @Roles([Role.ADMIN])
    class TestClass {}

    const decoratorRoles = reflector.get(ROLES_KEY, TestClass);
    expect(decoratorRoles).toEqual([Role.ADMIN]);
  });
});