import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import bcryptjs from 'bcryptjs';

const bcrypt = bcryptjs.default || bcryptjs;

/**
 * ═══════════════════════════════════════════════════════════════
 * Tests E2E: Transacción de Producción
 * ═══════════════════════════════════════════════════════════════
 * 
 * Valida la lógica más crítica del sistema:
 *   1. Resta materia prima del inventario
 *   2. Suma producto terminado al inventario
 *   3. Crea ProductionLog
 *   4. Crea StockMovement tipo PRODUCCION
 *   5. Atomicidad: rollback completo si falla a mitad
 */
describe('Production Transaction (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  // IDs de datos de prueba para cleanup
  let testUserId: string;
  let testBranchId: number;
  let testProductId: number;
  let testCategoryId: number;
  let testRawMaterial1Id: number; // Harina Test
  let testRawMaterial2Id: number; // Levadura Test
  let testRecipeId: number;
  let testRecipeDisabledId: number;

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

    // 1. Crear sucursal de prueba
    const branch = await prisma.branch.create({
      data: { name: 'Sucursal Test Producción', slug: 'test-produccion', address: 'Test' },
    });
    testBranchId = branch.id;

    // 2. Crear usuario BAKER con sucursal asignada
    const passwordHash = await bcrypt.hash('baker-test-123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'baker-test-production@test.com',
        passwordHash,
        firstName: 'Baker',
        lastName: 'Test',
        role: 'BAKER',
        isActive: true,
        branchId: testBranchId,
      },
    });
    testUserId = user.id;

    // 3. Login para obtener token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'baker-test-production@test.com', password: 'baker-test-123' });
    accessToken = loginRes.body.token;

    // 4. Crear categoría y producto de prueba
    const cat = await prisma.category.create({
      data: { name: 'Test Producción Cat', slug: 'test-prod-cat', description: 'test' },
    });
    testCategoryId = cat.id;

    const product = await prisma.product.create({
      data: {
        sku: 'TEST-PROD-001',
        name: 'Pan Test Producción',
        slug: 'pan-test-produccion',
        basePrice: 1.00,
        unitsPerTray: 36,
        categoryId: testCategoryId,
        isAvailable: true,
        origin: 'PRODUCIDO',
      },
    });
    testProductId = product.id;

    // 5. Crear materias primas de prueba
    const rm1 = await prisma.rawMaterial.create({
      data: { name: 'Harina Test Prod', baseUnit: 'LB', costPerUnit: 2.50, minStock: 5 },
    });
    testRawMaterial1Id = rm1.id;

    const rm2 = await prisma.rawMaterial.create({
      data: { name: 'Levadura Test Prod', baseUnit: 'LB', costPerUnit: 15.00, minStock: 1 },
    });
    testRawMaterial2Id = rm2.id;

    // 6. Crear inventario de materia prima (Harina: 100 LB, Levadura: 10 LB)
    await prisma.rawMaterialInventory.create({
      data: { rawMaterialId: testRawMaterial1Id, branchId: testBranchId, quantity: 100 },
    });
    await prisma.rawMaterialInventory.create({
      data: { rawMaterialId: testRawMaterial2Id, branchId: testBranchId, quantity: 10 },
    });

    // 7. Crear receta activa (usa 50 LB harina + 2 LB levadura = 33 latas)
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Amasijo Test',
        productId: testProductId,
        standardTrays: 33,
        isActive: true,
        ingredients: {
          create: [
            { rawMaterialId: testRawMaterial1Id, quantity: 50 },  // 50 LB harina
            { rawMaterialId: testRawMaterial2Id, quantity: 2 },   // 2 LB levadura
          ],
        },
      },
    });
    testRecipeId = recipe.id;

    // 8. Crear receta desactivada
    const disabledRecipe = await prisma.recipe.create({
      data: {
        name: 'Amasijo Desactivado Test',
        productId: testProductId,
        standardTrays: 10,
        isActive: false,
        ingredients: {
          create: [
            { rawMaterialId: testRawMaterial1Id, quantity: 10 },
          ],
        },
      },
    });
    testRecipeDisabledId = disabledRecipe.id;
  }, 30000);

  // ─── TEARDOWN ────────────────────────────────────────────────
  afterAll(async () => {
    // Limpiar en orden inverso de dependencias FK
    await prisma.stockMovement.deleteMany({ where: { productId: testProductId } });
    await prisma.productionLog.deleteMany({ where: { recipeId: { in: [testRecipeId, testRecipeDisabledId] } } });
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: { in: [testRecipeId, testRecipeDisabledId] } } });
    await prisma.recipe.deleteMany({ where: { id: { in: [testRecipeId, testRecipeDisabledId] } } });
    await prisma.inventory.deleteMany({ where: { branchId: testBranchId } });
    await prisma.rawMaterialInventory.deleteMany({ where: { branchId: testBranchId } });
    await prisma.rawMaterial.deleteMany({ where: { id: { in: [testRawMaterial1Id, testRawMaterial2Id] } } });
    await prisma.product.deleteMany({ where: { id: testProductId } });
    await prisma.category.deleteMany({ where: { id: testCategoryId } });
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.branch.deleteMany({ where: { id: testBranchId } });
    await app.close();
  }, 15000);

  // ─── TESTS ───────────────────────────────────────────────────

  describe('POST /production — Happy Path', () => {
    it('debe registrar producción: restar MP, sumar producto, crear log y movement', async () => {
      // Estado ANTES
      const harinaBefore = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial1Id, branchId: testBranchId },
      });
      const levaduraBefore = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial2Id, branchId: testBranchId },
      });

      // Registrar 1 amasijo de 33 latas
      const res = await request(app.getHttpServer())
        .post('/production')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipeId: testRecipeId, traysProduced: 33, note: 'Test horneado' })
        .expect(201);

      // Verificar response
      expect(res.body.traysProduced).toBe(33);
      expect(res.body.unitsProduced).toBe(33 * 36); // 1188 unidades
      expect(res.body.recipeName).toBe('Amasijo Test');
      expect(res.body.message).toContain('1,188');

      // Verificar materia prima RESTADA
      const harinaAfter = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial1Id, branchId: testBranchId },
      });
      const levaduraAfter = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial2Id, branchId: testBranchId },
      });
      expect(Number(harinaAfter!.quantity)).toBe(Number(harinaBefore!.quantity) - 50);
      expect(Number(levaduraAfter!.quantity)).toBe(Number(levaduraBefore!.quantity) - 2);

      // Verificar producto terminado SUMADO al inventario
      const inventory = await prisma.inventory.findFirst({
        where: { productId: testProductId, branchId: testBranchId },
      });
      expect(inventory).toBeDefined();
      expect(inventory!.quantity).toBe(33 * 36);

      // Verificar ProductionLog creado
      const log = await prisma.productionLog.findFirst({
        where: { recipeId: testRecipeId, userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });
      expect(log).toBeDefined();
      expect(log!.traysProduced).toBe(33);
      expect(log!.unitsProduced).toBe(1188);
      expect(log!.note).toBe('Test horneado');

      // Verificar StockMovement creado
      const movement = await prisma.stockMovement.findFirst({
        where: { productionLogId: log!.id },
      });
      expect(movement).toBeDefined();
      expect(movement!.type).toBe('PRODUCCION');
      expect(movement!.quantity).toBe(1188);
      expect(movement!.toBranchId).toBe(testBranchId);
    }, 15000);
  });

  describe('POST /production — Validaciones de negocio', () => {
    it('debe retornar 404 con receta inexistente', async () => {
      const res = await request(app.getHttpServer())
        .post('/production')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipeId: 999999, traysProduced: 1 })
        .expect(404);

      expect(res.body.message).toContain('no encontrada');
    });

    it('debe retornar 400 con receta desactivada', async () => {
      const res = await request(app.getHttpServer())
        .post('/production')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipeId: testRecipeDisabledId, traysProduced: 1 })
        .expect(400);

      expect(res.body.message).toContain('desactivada');
    });

    it('debe retornar 400 si no hay suficiente materia prima', async () => {
      // La harina quedó en ~50 LB tras el happy path. Pedir un amasijo que necesita 50 más
      // pero solo hay ~50. Hagamos 2 amasijos para forzar el fallo.
      // Primero: gastar lo que queda
      const harinaActual = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial1Id, branchId: testBranchId },
      });

      // Poner la harina en solo 10 LB (la receta necesita 50)
      await prisma.rawMaterialInventory.update({
        where: { id: harinaActual!.id },
        data: { quantity: 10 },
      });

      const res = await request(app.getHttpServer())
        .post('/production')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipeId: testRecipeId, traysProduced: 33 })
        .expect(400);

      expect(res.body.message).toContain('insuficiente');
      expect(res.body.message).toContain('Harina Test Prod');

      // Restaurar harina para siguientes tests
      await prisma.rawMaterialInventory.update({
        where: { id: harinaActual!.id },
        data: { quantity: 100 },
      });
    }, 10000);
  });

  describe('POST /production — Atomicidad (Rollback)', () => {
    it('si falla por el 2do ingrediente, el 1ero NO se descuenta (rollback)', async () => {
      // Poner levadura en 0 (la receta necesita 2 LB), pero harina tiene 100
      const levaduraInv = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial2Id, branchId: testBranchId },
      });
      const harinaInv = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial1Id, branchId: testBranchId },
      });

      // Guardar valores antes
      const harinaBefore = Number(harinaInv!.quantity);

      // Poner levadura en 0 para forzar fallo
      await prisma.rawMaterialInventory.update({
        where: { id: levaduraInv!.id },
        data: { quantity: 0 },
      });

      // Intentar producir — debe fallar
      await request(app.getHttpServer())
        .post('/production')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipeId: testRecipeId, traysProduced: 33 })
        .expect(400);

      // Verificar que la HARINA NO se descontó (rollback)
      const harinaAfter = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial1Id, branchId: testBranchId },
      });
      expect(Number(harinaAfter!.quantity)).toBe(harinaBefore);

      // Restaurar levadura
      await prisma.rawMaterialInventory.update({
        where: { id: levaduraInv!.id },
        data: { quantity: 10 },
      });
    }, 10000);
  });

  describe('GET /production/today', () => {
    it('debe retornar solo los registros de producción de hoy', async () => {
      const res = await request(app.getHttpServer())
        .get('/production/today')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // Debe incluir el log que creamos en el happy path
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const log = res.body.find((l: any) => l.recipe?.name === 'Amasijo Test');
      expect(log).toBeDefined();
      expect(log.traysProduced).toBe(33);
      expect(log.unitsProduced).toBe(1188);
      expect(log.recipe.product.name).toBe('Pan Test Producción');
      expect(log.user.firstName).toBe('Baker');
      expect(log.branch.name).toBe('Sucursal Test Producción');
    });
  });

  describe('POST /production — Autorización', () => {
    it('debe rechazar sin token de autenticación', async () => {
      await request(app.getHttpServer())
        .post('/production')
        .send({ recipeId: testRecipeId, traysProduced: 1 })
        .expect(401);
    });
  });
});
