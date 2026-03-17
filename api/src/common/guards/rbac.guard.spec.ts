import { RolesGuard } from './rbac.guard';

describe('RolesGuard', () => {
  it('allows SUPER_ADMIN for any required role', () => {
    const reflector = {
      getAllAndOverride: () => ['ADMIN'],
    } as any;

    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'SUPER_ADMIN' },
        }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});

