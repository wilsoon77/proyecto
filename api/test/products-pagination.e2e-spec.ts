import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ProductsController } from '../src/products/products.controller.js';
import { ProductsService } from '../src/products/products.service.js';

const mockService: Partial<ProductsService> = {
  findAll: async () => ({
    data: [
      {
        id: 1,
        name: 'Concha',
        slug: 'concha',
        description: 'Pan dulce tradicional',
        basePrice: 0.50,
        category: 'Pan dulce',
        categorySlug: 'pan-dulce',
        origin: 'PRODUCIDO',
        isNew: true,
        isActive: true,
        isAvailable: true,
        comboQuantity: 3,
        comboPrice: 1.25,
        unitsPerTray: 36,
        available: 24,
        images: [],
      },
    ],
    meta: { total: 1, pageCount: 1, page: 1, pageSize: 10 },
  }),
};

describe('Products pagination (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockService },
      ],
    }).compile();

    const server = express();
    app = moduleRef.createNestApplication(new ExpressAdapter(server));
    await app.init();
  });

  afterAll(async () => app.close());

  it('/products returns data and meta', async () => {
    const res = await request(app.getHttpServer()).get('/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toEqual({ total: 1, pageCount: 1, page: 1, pageSize: 10 });
    expect(res.headers['x-total-count']).toBe('1');
  });
});