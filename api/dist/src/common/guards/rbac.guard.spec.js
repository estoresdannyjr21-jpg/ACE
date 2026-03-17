"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_guard_1 = require("./rbac.guard");
describe('RolesGuard', () => {
    it('allows SUPER_ADMIN for any required role', () => {
        const reflector = {
            getAllAndOverride: () => ['ADMIN'],
        };
        const guard = new rbac_guard_1.RolesGuard(reflector);
        const context = {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { role: 'SUPER_ADMIN' },
                }),
            }),
        };
        expect(guard.canActivate(context)).toBe(true);
    });
});
//# sourceMappingURL=rbac.guard.spec.js.map