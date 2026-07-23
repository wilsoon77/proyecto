import { ForbiddenException } from '@nestjs/common';
import { BranchScopeService } from './branch-scope.service.js';

describe('BranchScopeService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
  };
  const service = new BranchScopeService(prisma as never);
  const manager = { userId: 'manager-1', role: 'MANAGER' };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ branch: { id: 10, slug: 'central' } });
  });

  it('forces the assigned branch for an operational role', async () => {
    await expect(service.resolveBranchSlug(manager)).resolves.toBe('central');
    await expect(service.resolveBranchId(manager)).resolves.toBe(10);
    await expect(service.resolveBranchSlug(manager, 'north')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.resolveBranchId(manager, 20)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps global scope only for ADMIN', async () => {
    await expect(service.resolveBranchSlug({ userId: 'admin-1', role: 'ADMIN' }, 'north')).resolves.toBe('north');
    await expect(service.resolveBranchId({ userId: 'admin-1', role: 'ADMIN' }, 20)).resolves.toBe(20);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an operational actor trying to access an order in another branch', async () => {
    prisma.order.findUnique.mockResolvedValue({ branchId: 20 });

    await expect(service.assertOrderAccess(manager, 123)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
