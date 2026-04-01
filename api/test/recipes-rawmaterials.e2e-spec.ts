import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import bcryptjs from 'bcryptjs';

const bcrypt = bcryptjs.default || bcryptjs;

/**
 * ═══════════════════════════════════════════════════════════════
 * Tests E2E: Recetas CRUD + Materia Prima (compras y conversión)
 * ═══════════════════════════════════════════════════════════════
 */
describe('Recipes & Raw Materials (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let managerToken: string;

  // IDs para cleanup
  let testManagerId: string;
  let testBranchId: number;
  let testCategoryId: number;
  let testProductId: number;
  let testRawMaterial1Id: number;
  let testRawMaterial2Id: number;
  const createdRecipeIds: number[] = [];
  const createdRawMaterialIds: number[] = [];

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
      data: { name: 'Sucursal Test Recipes', slug: 'test-recipes-branch', address: 'Test' },
    });
    testBranchId = branch.id;

    // 2. Usuario MANAGER
    const hash = await bcrypt.hash('manager-test-123', 10);
    const manager = await prisma.user.create({
      data: { email: 'manager-test-recipes@test.com', passwordHash: hash, firstName: 'Manager', lastName: 'Test', role: 'MANAGER', isActive: true, branchId: testBranchId },
    });
    testManagerId = manager.id;
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email: 'manager-test-recipes@test.com', password: 'manager-test-123' });
    managerToken = login.body.token;

    // 3. Categoría + Producto
    const cat = await prisma.category.create({ data: { name: 'Test Recipes Cat', slug: 'test-recipes-cat', description: 'test' } });
    testCategoryId = cat.id;

    const product = await prisma.product.create({
      data: { sku: 'TEST-REC-001', name: 'Pan Test Recetas', slug: 'pan-test-recetas', basePrice: 1.00, unitsPerTray: 36, categoryId: testCategoryId, isAvailable: true, origin: 'PRODUCIDO' },
    });
    testProductId = product.id;

    // 4. Materias primas de prueba
    const rm1 = await prisma.rawMaterial.create({ data: { name: 'Harina Test Rec', baseUnit: 'LB', costPerUnit: 2.50, minStock: 10 } });
    testRawMaterial1Id = rm1.id;
    const rm2 = await prisma.rawMaterial.create({ data: { name: 'Azúcar Test Rec', baseUnit: 'LB', costPerUnit: 3.00, minStock: 5 } });
    testRawMaterial2Id = rm2.id;
  }, 30000);

  // ─── TEARDOWN ────────────────────────────────────────────────
  afterAll(async () => {
    for (const id of createdRecipeIds) {
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    }
    await prisma.recipe.deleteMany({ where: { id: { in: createdRecipeIds } } });
    await prisma.rawMaterialInventory.deleteMany({ where: { branchId: testBranchId } });
    for (const id of createdRawMaterialIds) {
      await prisma.rawMaterial.delete({ where: { id } }).catch(() => {});
    }
    await prisma.rawMaterial.deleteMany({ where: { id: { in: [testRawMaterial1Id, testRawMaterial2Id] } } });
    await prisma.product.deleteMany({ where: { id: testProductId } });
    await prisma.category.deleteMany({ where: { id: testCategoryId } });
    await prisma.refreshToken.deleteMany({ where: { userId: testManagerId } });
    await prisma.user.deleteMany({ where: { id: testManagerId } });
    await prisma.branch.deleteMany({ where: { id: testBranchId } });
    await app.close();
  }, 15000);

  // ─── RECIPES CRUD ────────────────────────────────────────────

  describe('POST /recipes — Crear receta con ingredientes', () => {
    it('debe crear receta con ingredientes nested', async () => {
      const res = await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Amasijo Test CRUD',
          productId: testProductId,
          standardTrays: 25,
          ingredients: [
            { rawMaterialId: testRawMaterial1Id, quantity: 40 },
            { rawMaterialId: testRawMaterial2Id, quantity: 8 },
          ],
        })
        .expect(201);

      createdRecipeIds.push(res.body.id);

      expect(res.body.name).toBe('Amasijo Test CRUD');
      expect(res.body.standardTrays).toBe(25);
      expect(res.body.product.name).toBe('Pan Test Recetas');
      expect(res.body.ingredients).toHaveLength(2);
      expect(res.body.ingredients[0].rawMaterial.name).toBeDefined();
    }, 10000);
  });

  describe('PATCH /recipes/:id — Actualizar receta (replace ingredientes)', () => {
    it('debe reemplazar ingredientes y actualizar nombre', async () => {
      const recipeId = createdRecipeIds[0];

      const res = await request(app.getHttpServer())
        .patch(`/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Amasijo Test Actualizado',
          standardTrays: 30,
          ingredients: [
            { rawMaterialId: testRawMaterial1Id, quantity: 55 }, // Solo harina ahora
          ],
        })
        .expect(200);

      expect(res.body.name).toBe('Amasijo Test Actualizado');
      expect(res.body.standardTrays).toBe(30);
      // Solo 1 ingrediente ahora (azúcar fue removida)
      expect(res.body.ingredients).toHaveLength(1);
      expect(Number(res.body.ingredients[0].quantity)).toBe(55);
    }, 10000);
  });

  describe('DELETE /recipes/:id — Desactivar receta (soft delete)', () => {
    it('debe poner isActive = false sin eliminar de la base de datos', async () => {
      const recipeId = createdRecipeIds[0];

      await request(app.getHttpServer())
        .delete(`/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Verificar directamente en DB
      const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
      expect(recipe).toBeDefined();
      expect(recipe!.isActive).toBe(false);
    });
  });

  describe('GET /recipes — Listar solo activas', () => {
    it('no debe incluir la receta desactivada', async () => {
      // Crear una receta activa para tener algo en la lista
      const newRecipe = await prisma.recipe.create({
        data: {
          name: 'Amasijo Activo Test',
          productId: testProductId,
          standardTrays: 10,
          isActive: true,
          ingredients: { create: [{ rawMaterialId: testRawMaterial1Id, quantity: 20 }] },
        },
      });
      createdRecipeIds.push(newRecipe.id);

      const res = await request(app.getHttpServer())
        .get('/recipes')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // La desactivada NO debe aparecer
      const deactivated = res.body.find((r: any) => r.name === 'Amasijo Test Actualizado');
      expect(deactivated).toBeUndefined();
      // La activa SÍ debe aparecer
      const active = res.body.find((r: any) => r.name === 'Amasijo Activo Test');
      expect(active).toBeDefined();
    });
  });

  // ─── RAW MATERIALS + PURCHASE ────────────────────────────────

  describe('POST /raw-materials/purchase — Conversión de unidades', () => {
    it('debe convertir 1 QUINTAL a 100 LB y sumar al inventario', async () => {
      const res = await request(app.getHttpServer())
        .post('/raw-materials/purchase')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          rawMaterialId: testRawMaterial1Id,
          branchId: testBranchId,
          purchaseQuantity: 2,
          unitOfPurchase: 'QUINTAL',
          note: 'Compra test',
        })
        .expect(201);

      // 2 QUINTAL = 200 LB
      expect(res.body.converted).toBe('200 LB');
      expect(res.body.message).toContain('200 LB');

      // Verificar inventario en DB
      const inv = await prisma.rawMaterialInventory.findFirst({
        where: { rawMaterialId: testRawMaterial1Id, branchId: testBranchId },
      });
      expect(inv).toBeDefined();
      expect(Number(inv!.quantity)).toBe(200);
    }, 10000);
  });

  describe('POST /raw-materials/purchase — Unidad inválida', () => {
    it('debe retornar 400 con unidad de compra no reconocida', async () => {
      const res = await request(app.getHttpServer())
        .post('/raw-materials/purchase')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          rawMaterialId: testRawMaterial1Id,
          branchId: testBranchId,
          purchaseQuantity: 1,
          unitOfPurchase: 'TONELADA',
        })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /raw-materials + PATCH — CRUD materia prima', () => {
    it('debe crear, actualizar y consultar materia prima', async () => {
      // CREATE
      const createRes = await request(app.getHttpServer())
        .post('/raw-materials')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Manteca Test CRUD', baseUnit: 'LB', costPerUnit: 8.00, minStock: 5 })
        .expect(201);

      createdRawMaterialIds.push(createRes.body.id);
      expect(createRes.body.name).toBe('Manteca Test CRUD');
      expect(createRes.body.baseUnit).toBe('LB');

      // UPDATE
      const updateRes = await request(app.getHttpServer())
        .patch(`/raw-materials/${createRes.body.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ costPerUnit: 9.50, minStock: 10 })
        .expect(200);

      expect(Number(updateRes.body.costPerUnit)).toBe(9.50);
      expect(Number(updateRes.body.minStock)).toBe(10);

      // GET BY ID
      const getRes = await request(app.getHttpServer())
        .get(`/raw-materials/${createRes.body.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(getRes.body.name).toBe('Manteca Test CRUD');
      expect(Number(getRes.body.costPerUnit)).toBe(9.50);
    }, 10000);
  });
});
