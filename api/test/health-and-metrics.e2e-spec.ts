import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

describe('Health and Metrics (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.SKIP_DB = '1';
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const server = express();
    app = moduleFixture.createNestApplication(new ExpressAdapter(server));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) should respond with ok', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime');
  });

  it('/metrics (GET) should return prometheus metrics text', async () => {
    const res = await request(app.getHttpServer()).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });
});