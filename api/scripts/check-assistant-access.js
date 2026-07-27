/**
 * Quick script to check and create AssistantAccess for ADMIN/MANAGER users.
 * Usage: node scripts/check-assistant-access.js [--create]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const shouldCreate = process.argv.includes('--create');

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    select: { id: true, email: true, firstName: true, role: true, assistantAccess: true },
  });

  console.log('\n=== ADMIN/MANAGER users ===');
  for (const u of users) {
    const access = u.assistantAccess;
    console.log(
      `  ${u.role.padEnd(8)} ${u.email.padEnd(35)} ${u.firstName.padEnd(15)} AssistantAccess: ${
        access ? `enabled=${access.enabled}, scope=${access.scope}` : '❌ NOT CONFIGURED'
      }`
    );
  }

  if (shouldCreate) {
    console.log('\n--- Creating/updating AssistantAccess for all ADMIN/MANAGER users ---');
    for (const u of users) {
      await prisma.assistantAccess.upsert({
        where: { userId: u.id },
        create: { userId: u.id, enabled: true, scope: 'ALL_BRANCHES' },
        update: { enabled: true, scope: 'ALL_BRANCHES' },
      });
      console.log(`  ✅ ${u.email} → enabled=true, scope=ALL_BRANCHES`);
    }
  } else {
    console.log('\nRun with --create to enable AssistantAccess for all listed users.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
