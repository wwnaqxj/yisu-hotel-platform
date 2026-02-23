const { PrismaClient } = require('@prisma/client');

let prisma;

function getPrisma() {
  if (!prisma) {
    console.log('Initializing Prisma Client...');
    try {
      prisma = new PrismaClient();
      console.log('Prisma Client initialized.');
    } catch (e) {
      console.error('Failed to initialize Prisma Client:', e);
      throw e;
    }
  }
  return prisma;
}

module.exports = {
  getPrisma,
};
