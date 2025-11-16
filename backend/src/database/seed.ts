import { prisma } from './prisma.client';

/**
 * Seed database with demo user
 * Run with: npx ts-node src/database/seed.ts
 */
async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Create demo user if it doesn't exist
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@loopdesk.com' },
      update: {},
      create: {
        id: 'demo-user-123',
        email: 'demo@loopdesk.com',
        name: 'Demo User',
        timezone: 0,
      },
    });

    console.log('✅ Demo user created/updated:');
    console.log(`   ID: ${demoUser.id}`);
    console.log(`   Email: ${demoUser.email}`);
    console.log(`   Name: ${demoUser.name}\n`);

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
