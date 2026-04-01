import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import bcryptjs from 'bcryptjs';

const bcrypt = bcryptjs.default || bcryptjs;

/**
 * ═══════════════════════════════════════════════════════════════
 * Tests E2E: Ciclo de vida completo de Órdenes
 * ═══════════════════════════════════════════════════════════════
 * 
 * Flujo transaccional:
 *   reserve → confirm → pickup (entrega)
 *   reserve → cancel
 *   Validaciones de stock, producto y sucursal
 */
describe('Orders Lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let cashierToken: string;

  // IDs para cleanup
  let testCustomerId: string;
  let testCashierId: string;
  let testBranchId: number;
  let testBranchSlug: string;
  let testCategoryId: number;
  let testProduct1Id: number;
  let testProduct1Slug: string;
  let testProduct2Id: number;
  let testProduct2Slug: string;
  const createdOrderIds: number[] = [];

  // ─── SETUP ───────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // 1. Sucursal
    const branch = await prisma.branch.create({
      data: { name: 'Sucursal Test Orders', slug: 'test-orders-branch', address: 'Test Address' },
    });
    testBranchId = branch.id;
    testBranchSlug = branch.slug;

    // 2. Categoría
    const cat = await prisma.category.create({
      data: { name: 'Test Orders Cat', slug: 'test-orders-cat', description: 'test' },
    });
    testCategoryId = cat.id;

    // 3. Productos
    const p1 = await prisma.product.create({
      data: {
        sku: 'TEST-ORD-001', name: 'Pan Test Orders', slug: 'pan-test-orders',
        basePrice: 1.50, categoryId: testCategoryId, isAvailable: true, origin: 'PRODUCIDO',
      },
    });
    testProduct1Id = p1.id;
    testProduct1Slug = p1.slug;

    const p2 = await prisma.product.create({
      data: {
        sku: 'TEST-ORD-002', name: 'Galleta Test Orders', slug: 'galleta-test-orders',
        basePrice: 2.00, categoryId: testCategoryId, isAvailable: true, origin: 'PRODUCIDO',
      },
    });
    testProduct2Id = p2.id;
    testProduct2Slug = p2.slug;

    // 4. Inventario: P1 = 50 unidades, P2 = 3 unidades (poco stock para tests de insuficiencia)
    await prisma.inventory.create({ data: { productId: testProduct1Id, branchId: testBranchId, quantity: 50, reserved: 0 } });
    await prisma.inventory.create({ data: { productId: testProduct2Id, branchId: testBranchId, quantity: 3, reserved: 0 } });

    // 5. Usuario CUSTOMER
    const customerHash = await bcrypt.hash('customer-test-123', 10);
    const customer = await prisma.user.create({
      data: { email: 'customer-test-orders@test.com', passwordHash: customerHash, firstName: 'Customer', lastName: 'Test', role: 'CUSTOMER', isActive: true },
    });
    testCustomerId = customer.id;
    const loginCustomer = await request(app.getHttpServer()).post('/auth/login').send({ email: 'customer-test-orders@test.com', password: 'customer-test-123' });
    customerToken = loginCustomer.body.token;

    // 6. Usuario CASHIER (para confirm/pickup)
    const cashierHash = await bcrypt.hash('cashier-test-123', 10);
    const cashier = await prisma.user.create({
      data: { email: 'cashier-test-orders@test.com', passwordHash: cashierHash, firstName: 'Cashier', lastName: 'Test', role: 'CASHIER', isActive: true, branchId: testBranchId },
    });
    testCashierId = cashier.id;
    const loginCashier = await request(app.getHttpServer()).post('/auth/login').send({ email: 'cashier-test-orders@test.com', password: 'cashier-test-123' });
    cashierToken = loginCashier.body.token;
  }, 30000);

  // ─── TEARDOWN ────────────────────────────────────────────────
  afterAll(async () => {
    // Limpiar órdenes y dependencias
    for (const orderId of createdOrderIds) {
      await prisma.stockMovement.deleteMany({ where: { productId: { in: [testProduct1Id, testProduct2Id] } } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
    }
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    await prisma.inventory.deleteMany({ where: { branchId: testBranchId } });
    await prisma.product.deleteMany({ where: { id: { in: [testProduct1Id, testProduct2Id] } } });
    await prisma.category.deleteMany({ where: { id: testCategoryId } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: [testCustomerId, testCashierId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testCustomerId, testCashierId] } } });
    await prisma.branch.deleteMany({ where: { id: testBranchId } });
    await app.close();
  }, 15000);

  // ─── TESTS ───────────────────────────────────────────────────

  describe('POST /orders/reserve — Reservar orden', () => {
    it('debe crear orden, calcular subtotal y reservar inventario', async () => {
      // Estado ANTES
      const inv1Before = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });

      const res = await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          branchSlug: testBranchSlug,
          items: [
            { productSlug: testProduct1Slug, quantity: 5 },
            { productSlug: testProduct2Slug, quantity: 2 },
          ],
        })
        .expect(201);

      createdOrderIds.push(res.body.id);

      // Verificar orden creada
      expect(res.body.status).toBe('PENDING');
      expect(res.body.orderNumber).toMatch(/^ORD-/);
      // Subtotal: 5 * 1.50 + 2 * 2.00 = 11.50
      expect(Number(res.body.subtotal)).toBe(11.50);
      expect(Number(res.body.total)).toBe(11.50);

      // Verificar que reserved se incrementó
      const inv1After = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });
      expect(inv1After!.reserved).toBe((inv1Before!.reserved ?? 0) + 5);

      const inv2After = await prisma.inventory.findFirst({ where: { productId: testProduct2Id, branchId: testBranchId } });
      expect(inv2After!.reserved).toBe(2);
    }, 15000);
  });

  describe('POST /orders/:id/confirm — Confirmar orden', () => {
    it('debe cambiar estado de PENDING a CONFIRMED', async () => {
      // Crear una orden primero
      const reserveRes = await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ branchSlug: testBranchSlug, items: [{ productSlug: testProduct1Slug, quantity: 1 }] })
        .expect(201);
      createdOrderIds.push(reserveRes.body.id);

      // Confirmar con rol CASHIER
      const res = await request(app.getHttpServer())
        .post(`/orders/${reserveRes.body.id}/confirm`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(201);

      expect(res.body.status).toBe('CONFIRMED');
    }, 10000);
  });

  describe('POST /orders/:id/pickup — Entregar orden', () => {
    it('debe descontar stock físico + reserved y crear StockMovement VENTA', async () => {
      // Crear + confirmar orden
      const reserveRes = await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ branchSlug: testBranchSlug, items: [{ productSlug: testProduct1Slug, quantity: 2 }] })
        .expect(201);
      createdOrderIds.push(reserveRes.body.id);

      await request(app.getHttpServer())
        .post(`/orders/${reserveRes.body.id}/confirm`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(201);

      // Estado del inventario ANTES del pickup
      const invBefore = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });

      // Pickup
      const res = await request(app.getHttpServer())
        .post(`/orders/${reserveRes.body.id}/pickup`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(201);
      expect(res.body.ok).toBe(true);

      // Verificar inventario DESPUÉS: quantity y reserved decrementados
      const invAfter = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });
      expect(invAfter!.quantity).toBe(invBefore!.quantity - 2);
      expect(invAfter!.reserved).toBe(invBefore!.reserved - 2);

      // Verificar StockMovement de tipo VENTA creado
      const movement = await prisma.stockMovement.findFirst({
        where: { productId: testProduct1Id, type: 'VENTA' },
        orderBy: { createdAt: 'desc' },
      });
      expect(movement).toBeDefined();
      expect(movement!.quantity).toBe(2);
    }, 15000);
  });

  describe('POST /orders/:id/cancel — Cancelar orden', () => {
    it('debe liberar reservas y marcar como CANCELLED', async () => {
      // Crear orden
      const reserveRes = await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ branchSlug: testBranchSlug, items: [{ productSlug: testProduct1Slug, quantity: 3 }] })
        .expect(201);
      createdOrderIds.push(reserveRes.body.id);

      const invBefore = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });

      // Cancelar (el customer puede cancelar su propia orden)
      const res = await request(app.getHttpServer())
        .post(`/orders/${reserveRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(201);
      expect(res.body.ok).toBe(true);

      // Verificar que reserved se decrementó
      const invAfter = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });
      expect(invAfter!.reserved).toBe(invBefore!.reserved - 3);

      // Verificar status
      const order = await prisma.order.findUnique({ where: { id: reserveRes.body.id } });
      expect(order!.status).toBe('CANCELLED');
    }, 10000);
  });

  describe('POST /orders/reserve — Validaciones', () => {
    it('debe retornar 400 si stock disponible es insuficiente', async () => {
      // P2 tiene solo 3 unidades, pedir 100
      const res = await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ branchSlug: testBranchSlug, items: [{ productSlug: testProduct2Slug, quantity: 100 }] })
        .expect(400);

      expect(res.body.message).toContain('insuficiente');
    });

    it('debe retornar 400 con producto inexistente', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ branchSlug: testBranchSlug, items: [{ productSlug: 'producto-fantasma-xyz', quantity: 1 }] })
        .expect(400);

      expect(res.body.message).toContain('no encontrado');
    });

    it('debe retornar 404 con sucursal inexistente', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ branchSlug: 'sucursal-fantasma', items: [{ productSlug: testProduct1Slug, quantity: 1 }] })
        .expect(404);

      expect(res.body.message).toContain('no encontrada');
    });
  });

  describe('POST /orders/reserve — Atomicidad', () => {
    it('si el 2do item no tiene stock, nada se reserva (rollback)', async () => {
      // P1 tiene 50, P2 tiene ~3 (o lo que quede)
      const inv1Before = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });
      const inv2Before = await prisma.inventory.findFirst({ where: { productId: testProduct2Id, branchId: testBranchId } });
      
      // Poner P2 en 0 disponibles para forzar fallo
      await prisma.inventory.update({
        where: { id: inv2Before!.id },
        data: { quantity: 0, reserved: 0 },
      });

      // Intentar reservar P1(5) + P2(1) — debe fallar por P2
      await request(app.getHttpServer())
        .post('/orders/reserve')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          branchSlug: testBranchSlug,
          items: [
            { productSlug: testProduct1Slug, quantity: 5 },
            { productSlug: testProduct2Slug, quantity: 1 },
          ],
        })
        .expect(400);

      // Verificar que P1 NO fue afectado (rollback completo)
      const inv1After = await prisma.inventory.findFirst({ where: { productId: testProduct1Id, branchId: testBranchId } });
      expect(inv1After!.reserved).toBe(inv1Before!.reserved);

      // Restaurar P2
      await prisma.inventory.update({
        where: { id: inv2Before!.id },
        data: { quantity: 3, reserved: 0 },
      });
    }, 10000);
  });
});
