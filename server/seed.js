const bcrypt = require('bcryptjs');
const { getPrisma } = require('./prismaClient');

async function ensureAdmin() {
  const prisma = getPrisma();

  const username = process.env.ADMIN_USERNAME || 'admin';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return;

  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'admin',
    },
  });
}

async function ensureMerchant() {
  const prisma = getPrisma();

  const username = process.env.MERCHANT_USERNAME || 'merchant';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return;

  const rawPassword = process.env.MERCHANT_PASSWORD || 'merchant123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'merchant',
    },
  });
}

module.exports = {
  ensureAdmin,
  ensureMerchant,
};
