const bcrypt = require('bcryptjs');
const { getPrisma } = require('./prismaClient');

/** 示例酒店数据，便于列表/详情/筛选调试 */
const SAMPLE_HOTELS = [
  {
    nameZh: '易宿精选·北京国贸店',
    nameEn: 'Yisu Select Beijing Guomao',
    city: '北京',
    address: '朝阳区建国门外大街1号',
    star: 5,
    openTime: '2020-06',
    description: '毗邻国贸商圈，商务出行便捷，配备智能客房与健身中心。',
    facilities: ['免费WiFi', '含早餐', '停车场', '健身房', '24小时前台', '可退款'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    lat: 39.91,
    lng: 116.46,
    rooms: [
      { name: '高级大床房', price: 588 },
      { name: '豪华双床房', price: 688 },
    ],
  },
  {
    nameZh: '易宿·北京中关村店',
    nameEn: 'Yisu Beijing Zhongguancun',
    city: '北京',
    address: '海淀区中关村大街27号',
    star: 4,
    openTime: '2019-03',
    description: '近中关村软件园，适合差旅与学术出行。',
    facilities: ['免费WiFi', '含早餐', '停车场', '近地铁'],
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'],
    lat: 39.98,
    lng: 116.31,
    rooms: [
      { name: '标准间', price: 368 },
      { name: '大床房', price: 398 },
    ],
  },
  {
    nameZh: '易宿·上海外滩店',
    nameEn: 'Yisu Shanghai The Bund',
    city: '上海',
    address: '黄浦区中山东一路88号',
    star: 5,
    openTime: '2018-11',
    description: '外滩江景酒店，部分客房可览陆家嘴天际线。',
    facilities: ['免费WiFi', '含早餐', '停车场', '游泳池', '24小时前台', '接送机', '可退款'],
    images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80'],
    lat: 31.24,
    lng: 121.49,
    rooms: [
      { name: '江景大床房', price: 888 },
      { name: '行政套房', price: 998 },
    ],
  },
  {
    nameZh: '易宿·上海虹桥店',
    nameEn: 'Yisu Shanghai Hongqiao',
    city: '上海',
    address: '闵行区申虹路333号',
    star: 4,
    openTime: '2021-01',
    description: '近虹桥枢纽，适合赶早班机与展会客。',
    facilities: ['免费WiFi', '含早餐', '停车场', '接送机', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    lat: 31.19,
    lng: 121.32,
    rooms: [
      { name: '标准大床房', price: 328 },
      { name: '家庭房', price: 498 },
    ],
  },
  {
    nameZh: '易宿·广州珠江新城店',
    nameEn: 'Yisu Guangzhou Zhujiang New Town',
    city: '广州',
    address: '天河区珠江新城花城大道88号',
    star: 5,
    openTime: '2019-08',
    description: '珠江新城核心区，步行可达广州塔与博物馆。',
    facilities: ['免费WiFi', '含早餐', '停车场', '健身房', '游泳池', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'],
    lat: 23.12,
    lng: 113.32,
    rooms: [
      { name: '城景双床房', price: 520 },
      { name: '塔景大床房', price: 680 },
    ],
  },
  {
    nameZh: '易宿·深圳科技园店',
    nameEn: 'Yisu Shenzhen Science Park',
    city: '深圳',
    address: '南山区科技园南路18号',
    star: 3,
    openTime: '2022-05',
    description: '科技园周边，性价比之选，适合短期出差。',
    facilities: ['免费WiFi', '近地铁', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80'],
    lat: 22.54,
    lng: 113.94,
    rooms: [
      { name: '经济大床房', price: 198 },
      { name: '标准双床房', price: 238 },
    ],
  },
  {
    nameZh: '易宿·成都太古里店',
    nameEn: 'Yisu Chengdu Taikoo Li',
    city: '成都',
    address: '锦江区红星路三段1号',
    star: 4,
    openTime: '2021-09',
    description: '临近太古里与春熙路商圈，适合休闲与商务出行。',
    facilities: ['免费WiFi', '含早餐', '停车场', '近地铁', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80'],
    lat: 30.65,
    lng: 104.08,
    rooms: [
      { name: '舒适大床房', price: 328 },
      { name: '观景双床房', price: 388 },
    ],
  },
  {
    nameZh: '易宿·杭州西湖店',
    nameEn: 'Yisu Hangzhou West Lake',
    city: '杭州',
    address: '西湖区龙井路88号',
    star: 5,
    openTime: '2020-04',
    description: '靠近西湖风景区，部分房型可远眺湖景，适合度假休闲。',
    facilities: ['免费WiFi', '含早餐', '停车场', '游泳池', '健身房', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?w=800&q=80'],
    lat: 30.24,
    lng: 120.13,
    rooms: [
      { name: '园景大床房', price: 568 },
      { name: '湖景豪华房', price: 768 },
    ],
  },
  {
    nameZh: '易宿·重庆解放碑店',
    nameEn: 'Yisu Chongqing Jiefangbei',
    city: '重庆',
    address: '渝中区解放碑步行街88号',
    star: 4,
    openTime: '2019-12',
    description: '位于解放碑商圈中心，周边餐饮购物丰富，交通便捷。',
    facilities: ['免费WiFi', '含早餐', '近地铁', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1542317854-ff88f85f5a62?w=800&q=80'],
    lat: 29.56,
    lng: 106.57,
    rooms: [
      { name: '城市大床房', price: 298 },
      { name: '江景双床房', price: 368 },
    ],
  },
];

// ─── Seed Admin / Merchant ───────────────────────────────────────────────────
async function ensureAdmin() {
  const prisma = getPrisma();
  const username = process.env.ADMIN_USERNAME || 'admin';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return exists;
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  return prisma.user.create({ data: { username, passwordHash, role: 'admin' } });
}

async function ensureMerchant() {
  const prisma = getPrisma();
  const username = process.env.MERCHANT_USERNAME || 'merchant';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return exists;
  const passwordHash = await bcrypt.hash(process.env.MERCHANT_PASSWORD || 'merchant123', 10);
  return prisma.user.create({ data: { username, passwordHash, role: 'merchant' } });
}

// ─── Seed Hotels ─────────────────────────────────────────────────────────────
async function ensureHotels() {
  const prisma = getPrisma();

  let merchant = await prisma.user.findUnique({ where: { username: 'merchant' } });
  if (!merchant) {
    await ensureMerchant();
    merchant = await prisma.user.findUnique({ where: { username: 'merchant' } });
  }
  if (!merchant) return;

  const existing = await prisma.hotel.count({ where: { status: 'approved' } });
  if (existing > 0) return;

  for (const h of SAMPLE_HOTELS) {
    const { rooms, ...hotelData } = h;
    const hotel = await prisma.hotel.create({
      data: {
        ownerId: merchant.id,
        nameZh: hotelData.nameZh,
        nameEn: hotelData.nameEn,
        city: hotelData.city,
        address: hotelData.address,
        star: hotelData.star,
        openTime: hotelData.openTime,
        description: hotelData.description || '',
        facilities: hotelData.facilities || [],
        images: hotelData.images || [],
        lat: hotelData.lat,
        lng: hotelData.lng,
        status: 'approved',
      },
    });
    for (const r of rooms) {
      await prisma.room.create({
        data: {
          hotelId: hotel.id,
          name: r.name,
          price: r.price,
          totalRooms: 10,
          availableRooms: 8,
        },
      });
    }
  }
}

module.exports = {
  ensureAdmin,
  ensureMerchant,
  ensureHotels,
};