import { PrismaClient } from '../../../prisma/generated/client';

const prisma = new PrismaClient();

async function seed() {
  // Clear existing data
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const user1 = await prisma.user.create({
    data: {
      username: 'player1',
      email: 'player1@example.com',
      passwordHash: 'hashed_password_1',
    },
  });
  console.log('User created:', user1);
  const user2 = await prisma.user.create({
    data: {
      username: 'player2',
      email: 'player2@example.com',
      passwordHash: 'hashed_password_2',
    },
  });
  console.log('User created:', user2);
  // Create matches
  await prisma.match.create({
    data: {
      player1: {
        connect: { id: user1.id },
      },
      player2: {
        connect: { id: user2.id },
      },
      score1: 1,
      score2: 2,
      winnerId: user2.id,
    },
  });
  console.log('Match created between', user1.username, 'and', user2.username);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
