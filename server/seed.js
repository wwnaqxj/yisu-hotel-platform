const bcrypt = require('bcryptjs');
const { getPrisma } = require('./prismaClient');

const CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州'];
const HOTEL_NAMES = [
  '季季红酒店', '如家快捷酒店', '希尔顿酒店', '万豪酒店', '全季酒店',
  '汉庭酒店', '桔子水晶酒店', '亚朵酒店', '喜来登酒店', '香格里拉大酒店',
  '维也纳国际酒店', '锦江之星', '莫泰168', '布丁酒店', '7天连锁酒店'
];
const FACILITIES = ['免费WiFi', '免费停车', '健身房', '游泳池', '会议室', '接送机服务', '餐厅', '酒吧'];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset(arr, min = 1, max = 5) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * (max - min + 1)) + min);
}

async function ensureAdmin(prismaInstance) {
  const prisma = prismaInstance || getPrisma();
  if (!prisma) {
    console.error('Prisma instance is missing in ensureAdmin');
    return;
  }
  const username = process.env.ADMIN_USERNAME || 'admin';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return exists;

  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  return prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'admin',
    },
  });
}

async function ensureMerchant(prismaInstance) {
  const prisma = prismaInstance || getPrisma();
  if (!prisma) {
    console.error('Prisma instance is missing in ensureMerchant');
    return;
  }
  const username = process.env.MERCHANT_USERNAME || 'merchant';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return exists;

  const rawPassword = process.env.MERCHANT_PASSWORD || 'merchant123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  return prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'merchant',
    },
  });
}

async function ensureHotels(prisma, merchantId) {
  const count = await prisma.hotel.count();
  if (count > 5) {
    console.log('Skipping hotel seed, already populated.');
    return;
  }

  console.log('Seeding hotels...');

  for (let i = 0; i < 20; i++) {
    const city = getRandom(CITIES);
    const nameZh = `${getRandom(HOTEL_NAMES)} (${city}店 ${i + 1})`;
    const star = Math.floor(Math.random() * 3) + 3; // 3-5 stars
    const score = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5 - 5.0

    const hotel = await prisma.hotel.create({
      data: {
        ownerId: merchantId,
        nameZh,
        nameEn: `Hotel ${i + 1} in ${city}`,
        city,
        address: `${city}市某区某路${Math.floor(Math.random() * 1000)}号`,
        star,
        score: parseFloat(score),
        openTime: '2010-01-01',
        description: '这是一个位于' + city + '的舒适酒店，交通便利，环境优雅。',
        status: 'approved',
        facilities: getRandomSubset(FACILITIES),
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
          "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        ],
        rooms: {
          create: [
            { name: '标准双人间', price: Math.floor(Math.random() * 200) + 200 },
            { name: '豪华大床房', price: Math.floor(Math.random() * 300) + 400 },
            { name: '行政套房', price: Math.floor(Math.random() * 500) + 800 },
          ]
        }
      },
      include: {
        rooms: true
      }
    });

    // Update minPrice
    const minPrice = Math.min(...hotel.rooms.map(r => r.price));
    await prisma.hotel.update({
      where: { id: hotel.id },
      data: { minPrice }
    });
  }

  console.log('Hotels seeded.');
}

async function main() {
  const prisma = getPrisma();
  try {
    const admin = await ensureAdmin(prisma);
    const merchant = await ensureMerchant(prisma);
    await ensureHotels(prisma, merchant.id);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { ensureAdmin, ensureMerchant };
