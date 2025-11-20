import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    if (process.env.SKIP_DB === '1') {
      return; // Skip connection when generating OpenAPI or running lightweight tasks
    }
    await this.$connect();
  }
}
