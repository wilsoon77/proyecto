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

  it('gives MANAGER global read scope and keeps an assigned write default', async () => {
    await expect(service.resolveBranchSlug(manager)).resolves.toBeUndefined();
    await expect(service.resolveBranchId(manager)).resolves.toBeUndefined();
    await expect(service.resolveBranchSlug(manager, 'north')).resolves.toBe('north');
    await expect(service.resolveBranchId(manager, 20)).resolves.toBe(20);
    await expect(service.resolveWriteBranchSlug(manager)).resolves.toBe('central');
    await expect(service.resolveWriteBranchId(manager)).resolves.toBe(10);
  });

  it('keeps global scope only for ADMIN', async () => {
    await expect(service.resolveBranchSlug({ userId: 'admin-1', role: 'ADMIN' }, 'north')).resolves.toBe('north');
    await expect(service.resolveBranchId({ userId: 'admin-1', role: 'ADMIN' }, 20)).resolves.toBe(20);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows MANAGER to access an order in either branch', async () => {
    prisma.order.findUnique.mockResolvedValue({ branchId: 20 });

    await expect(service.assertOrderAccess(manager, 123)).resolves.toBeUndefined();
  });
});
