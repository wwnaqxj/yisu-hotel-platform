const bcrypt = require('bcryptjs');
const { getPrisma } = require('./prismaClient');

// ─── Hotel Data Pool ────────────────────────────────────────────────────────
const HOTELS = [
  // 北京
  {
    nameZh: '北京王府井希尔顿酒店', nameEn: 'Hilton Beijing Wangfujing', city: '北京',
    address: '北京市东城区王府井大街8号', star: 5, score: 4.8,
    description: '位于北京市中心王府井商业区，毗邻故宫。酒店设有多家餐厅酒吧，室内泳池，全方位健身中心。',
    facilities: ['免费WiFi', '室内游泳池', '健身中心', '商务中心', '停车场', '24小时前台', '餐厅', '行政酒廊'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'
    ],
    rooms: [{ name: '豪华大床房', price: 1580 }, { name: '行政套房', price: 3200 }, { name: '总统套房', price: 9800 }]
  },
  {
    nameZh: '北京国际饭店', nameEn: 'China World Hotel Beijing', city: '北京',
    address: '北京市朝阳区建国门外大街1号', star: 5, score: 4.7,
    description: '坐落于北京黄金商圈，临近国贸中心，集豪华住宿、商务会议、精致餐饮于一体的顶级酒店。',
    facilities: ['免费WiFi', '游泳池', '健身房', '水疗中心', '多功能宴会厅', '行政商务中心'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80'
    ],
    rooms: [{ name: '高级大床房', price: 1380 }, { name: '豪华套房', price: 2800 }]
  },
  {
    nameZh: '北京亚朵酒店·三里屯店', nameEn: 'Atour Hotel Beijing Sanlitun', city: '北京',
    address: '北京市朝阳区三里屯路19号', star: 4, score: 4.7,
    description: '亚朵精品酒店，主打人文体验。三里屯店毗邻酒吧街和使馆区，设计风格独特，提供阅读角和茶饮服务。',
    facilities: ['免费WiFi', '24小时前台', '图书馆', '茶饮吧', '健身房', '行李寄存'],
    images: [
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
      'https://images.unsplash.com/photo-1596701062351-8ac031b6adbd?w=800&q=80',
    ],
    rooms: [{ name: '标准双床房', price: 580 }, { name: '亚朵大床房', price: 720 }]
  },
  {
    nameZh: '北京汉庭酒店·西直门店', nameEn: 'Hanting Hotel Beijing Xizhimen', city: '北京',
    address: '北京市西城区西直门外大街2号', star: 3, score: 4.3,
    description: '经济型连锁酒店，交通便利，毗邻西直门地铁站，适合商旅人士和自由行旅客。',
    facilities: ['免费WiFi', '停车场', '24小时前台', '叫醒服务'],
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    ],
    rooms: [{ name: '标准单床房', price: 249 }, { name: '标准双床房', price: 289 }]
  },

  // 上海
  {
    nameZh: '上海外滩华尔道夫酒店', nameEn: 'Waldorf Astoria Shanghai on the Bund', city: '上海',
    address: '上海市黄浦区中山东一路2号', star: 5, score: 4.9,
    description: '坐落于外滩历史建筑群，俯瞰浦江美景，融合1930年代上海装饰艺术风格与现代奢华，是上海最具历史意义的豪华酒店之一。',
    facilities: ['免费WiFi', '游泳池', '水疗中心', '健身中心', '外滩景观', '管家服务', '餐厅', '酒吧'],
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80',
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80'
    ],
    rooms: [{ name: '豪华江景房', price: 3680 }, { name: '豪华套房', price: 6800 }, { name: '总统套房', price: 15000 }]
  },
  {
    nameZh: '上海浦东香格里拉大酒店', nameEn: 'Shangri-La Hotel Pudong Shanghai', city: '上海',
    address: '上海市浦东新区富城路33号', star: 5, score: 4.8,
    description: '浦东标志性五星酒店，坐拥黄浦江及浦西天际线无敌美景，毗邻陆家嘴金融区。',
    facilities: ['免费WiFi', '室内游泳池', '健身中心', '水疗', '餐厅', '行政酒廊', '商务中心'],
    images: [
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
      'https://images.unsplash.com/photo-1508184964240-ee96bb9677a7?w=800&q=80',
    ],
    rooms: [{ name: '豪华双床房', price: 2200 }, { name: '江景套房', price: 4500 }]
  },
  {
    nameZh: '上海全季酒店·人民广场店', nameEn: 'Ji Hotel Shanghai People Square', city: '上海',
    address: '上海市黄浦区西藏中路288号', star: 4, score: 4.6,
    description: '全季酒店旗下中高档品牌，地处人民广场核心地带，南京路步行街近在咫尺，购物出行两相宜。',
    facilities: ['免费WiFi', '24小时前台', '商务中心', '行李寄存', '叫醒服务'],
    images: [
      'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    ],
    rooms: [{ name: '标准大床房', price: 480 }, { name: '豪华双人间', price: 560 }]
  },
  {
    nameZh: '上海锦江之星·虹桥机场店', nameEn: 'Jinjiang Inn Shanghai Hongqiao Airport', city: '上海',
    address: '上海市闵行区虹桥路1号', star: 3, score: 4.2,
    description: '紧邻虹桥机场，提供便捷的机场接送服务，适合过境旅客短暂休憩或早班航班旅客。',
    facilities: ['免费WiFi', '停车场', '接送机服务', '24小时前台'],
    images: [
      'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&q=80',
    ],
    rooms: [{ name: '标准单人房', price: 199 }, { name: '标准双床房', price: 230 }]
  },

  // 广州
  {
    nameZh: '广州白云国际会议中心洲际酒店', nameEn: 'InterContinental Guangzhou Exhibition Center', city: '广州',
    address: '广州市白云区云城东路1号', star: 5, score: 4.7,
    description: '广州白云国际会议中心配套五星酒店，拥有豪华客房、高端餐饮和全面会议设施，是广交会首选住所。',
    facilities: ['免费WiFi', '游泳池', '健身房', '餐厅', '大型会议室', '停车场', '商务中心'],
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    ],
    rooms: [{ name: '豪华大床房', price: 1280 }, { name: '行政套房', price: 2600 }]
  },
  {
    nameZh: '广州越秀宾馆', nameEn: 'Guangzhou Yuexiu Hotel', city: '广州',
    address: '广州市越秀区解放北路2099号', star: 4, score: 4.4,
    description: '坐落于广州越秀公园旁，紧邻中山纪念堂，商务休闲两相宜，是了解广州历史文化的绝佳据点。',
    facilities: ['免费WiFi', '停车场', '餐厅', '商务中心', '会议室'],
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    ],
    rooms: [{ name: '标准双人房', price: 430 }, { name: '豪华单间', price: 520 }]
  },

  // 深圳
  {
    nameZh: '深圳湾万丽酒店', nameEn: 'Renaissance Shenzhen Bay Hotel', city: '深圳',
    address: '深圳市南山区滨海大道1号', star: 5, score: 4.8,
    description: '坐拥深圳湾180度无敌海景，濒临海滨休闲带，毗邻腾讯、华为等科技公司总部，是商务与度假的完美选择。',
    facilities: ['免费WiFi', '无边泳池', '健身中心', '水疗', '海景餐厅', '儿童乐园', '网球场'],
    images: [
      'https://images.unsplash.com/photo-1587213811864-c02d31250965?w=800&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
      'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80'
    ],
    rooms: [{ name: '海景大床房', price: 1650 }, { name: '豪华套房', price: 3200 }, { name: '总统套房', price: 8800 }]
  },
  {
    nameZh: '深圳福朋喜来登酒店·益田假日广场', nameEn: 'Four Points by Sheraton Shenzhen Futian', city: '深圳',
    address: '深圳市福田区福华一路98号', star: 5, score: 4.6,
    description: '位于深圳核心商务区华强北附近，步行可达本地核心商圈，设施齐全，是出差深圳的理想选择。',
    facilities: ['免费WiFi', '健身房', '商务中心', '停车场', '24小时前台', '餐厅'],
    images: [
      'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800&q=80',
    ],
    rooms: [{ name: '高级大床房', price: 980 }, { name: '行政双床房', price: 1180 }]
  },
  {
    nameZh: '深圳亚朵酒店·罗湖火车站店', nameEn: 'Atour Hotel Shenzhen Luohu Railway Station', city: '深圳',
    address: '深圳市罗湖区人民南路3001号', star: 4, score: 4.6,
    description: '紧邻深圳罗湖口岸和罗湖火车站，往来港深两地极其便利，酒店设计融合岭南文化元素。',
    facilities: ['免费WiFi', '图书馆', '茶饮服务', '健身房', '24小时便利'],
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    ],
    rooms: [{ name: '标准大床房', price: 520 }, { name: '亲子家庭房', price: 780 }]
  },

  // 成都
  {
    nameZh: '成都棕榈岛扉美酒店', nameEn: 'Temple House Chengdu', city: '成都',
    address: '成都市锦江区东华门街23号', star: 5, score: 4.9,
    description: '隐于成都老城区，将宋代古庙与现代设计融为一体，馆内保存有珍贵历史遗迹，是成都最独特的精品酒店。',
    facilities: ['免费WiFi', '室外游泳池', '水疗中心', '茶舍', '餐厅', '文化讲座'],
    images: [
      'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    ],
    rooms: [{ name: '庭院大床房', price: 2200 }, { name: '古韵套房', price: 4500 }]
  },
  {
    nameZh: '成都IFS财富中心万豪酒店', nameEn: 'Marriott Hotel City Centre Chengdu', city: '成都',
    address: '成都市锦江区红星路三段99号', star: 5, score: 4.7,
    description: '位于成都 IFS 国际金融中心上方，步行直达春熙路商圈，设施豪华，视野开阔。',
    facilities: ['免费WiFi', '室内游泳池', '健身中心', '水疗', '高档餐厅', '商务中心', '停车场'],
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    ],
    rooms: [{ name: '豪华大床房', price: 1450 }, { name: '行政套房', price: 2900 }]
  },
  {
    nameZh: '成都麓湖·阿丽拉酒店', nameEn: 'Alila Chengdu', city: '成都',
    address: '成都市天府新区麓鸣路1666号', star: 5, score: 4.8,
    description: '坐落于成都麓湖生态城内，四面环湖，远山为屏，提供私人湖岸线和无边泳池，是成都最具自然气息的度假酒店。',
    facilities: ['免费WiFi', '无边泳池', '水上运动', '水疗', '有机餐厅', '自行车租赁', '亲子活动'],
    images: [
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    ],
    rooms: [{ name: '湖景大床房', price: 1800 }, { name: '湖畔别墅', price: 5600 }]
  },
  {
    nameZh: '成都锦里全季酒店', nameEn: 'Ji Hotel Chengdu Jinli', city: '成都',
    address: '成都市武侯区武侯祠大街231号', star: 4, score: 4.5,
    description: '紧邻锦里古街和武侯祠风景区，感受成都三国文化，方便游览宽窄巷子和人民公园。',
    facilities: ['免费WiFi', '24小时前台', '行李寄存', '特色早餐'],
    images: [
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
    ],
    rooms: [{ name: '标准大床房', price: 420 }, { name: '家庭双床房', price: 520 }]
  },

  // 杭州
  {
    nameZh: '杭州西湖柏悦酒店', nameEn: 'Park Hyatt Hangzhou', city: '杭州',
    address: '杭州市西湖区湖滨路1号', star: 5, score: 4.9,
    description: '凌驾于西湖之畔，提供私人阳台可俯瞰西湖全景，每间客房配有专属管家，近距离体验"最忆是杭州"的无限风光。',
    facilities: ['免费WiFi', '西湖景观泳池', '水疗', '健身中心', '中西餐厅', '管家服务', '茶道体验'],
    images: [
      'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
    ],
    rooms: [{ name: '西湖景大床房', price: 3800 }, { name: '总统湖景套房', price: 12000 }]
  },
  {
    nameZh: '杭州西溪悦榕庄', nameEn: 'Banyan Tree Hangzhou', city: '杭州',
    address: '杭州市余杭区西溪路588号', star: 5, score: 4.8,
    description: '藏于西溪湿地国家公园内，以独栋别墅形式分布于水系间，舟游水巷，感受东方桃源意境，是度蜜月及家庭度假首选。',
    facilities: ['免费WiFi', '私人泳池', '水疗', '湿地观鸟', '烧烤露台', '自行车租赁', '厨艺体验'],
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
    ],
    rooms: [{ name: '湿地水畔大床房', price: 4200 }, { name: '豪华别墅套房', price: 9800 }]
  },
  {
    nameZh: '杭州雷迪森庄园大酒店', nameEn: 'Radisson Blu Pudong Area Hangzhou', city: '杭州',
    address: '杭州市余杭区塘栖镇广济桥路88号', star: 4, score: 4.5,
    description: '坐落于大运河畔，集精品住宿、会议、餐饮于一体，感受江南水乡独特魅力。',
    facilities: ['免费WiFi', '游泳池', '健身中心', '餐厅', '停车场'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    ],
    rooms: [{ name: '高级大床房', price: 680 }, { name: '家庭亲子套房', price: 980 }]
  },
  {
    nameZh: '杭州西湖维景国际大酒店', nameEn: 'InterContinental Hangzhou', city: '杭州',
    address: '杭州市上城区湖滨路99号', star: 5, score: 4.7,
    description: '地处西湖东岸最繁华的湖滨商圈，步行即可到达南宋御街，是体验杭州历史文化最便捷的豪华酒店。',
    facilities: ['免费WiFi', '游泳池', '水疗', '健身房', '中西餐厅', '商务中心', '行程规划'],
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    ],
    rooms: [{ name: '西湖景豪华房', price: 1980 }, { name: '行政套房', price: 3600 }]
  },
  {
    nameZh: '杭州滨江如家酒店', nameEn: 'Home Inn Hangzhou Binjiang', city: '杭州',
    address: '杭州市滨江区江南大道616号', star: 3, score: 4.3,
    description: '毗邻滨江高科技园区，阿里巴巴总部附近，专为商务人士提供高性价比住宿，地铁直达西湖景区。',
    facilities: ['免费WiFi', '停车场', '24小时前台'],
    images: [
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
    ],
    rooms: [{ name: '标准大床房', price: 259 }, { name: '标准双床房', price: 299 }]
  }
];

// ─── Helpers ────────────────────────────────────────────────────────────────
async function ensureAdmin(prismaInstance) {
  const prisma = prismaInstance || getPrisma();
  const username = process.env.ADMIN_USERNAME || 'admin';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return exists;
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  return prisma.user.create({ data: { username, passwordHash, role: 'admin' } });
}

async function ensureMerchant(prismaInstance) {
  const prisma = prismaInstance || getPrisma();
  const username = process.env.MERCHANT_USERNAME || 'merchant';
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return exists;
  const passwordHash = await bcrypt.hash(process.env.MERCHANT_PASSWORD || 'merchant123', 10);
  return prisma.user.create({ data: { username, passwordHash, role: 'merchant' } });
}

async function ensureHotels(prisma, merchantId) {
  const count = await prisma.hotel.count({ where: { status: 'approved' } });
  if (count >= HOTELS.length) {
    console.log(`Skipping hotel seed – already have ${count} approved hotels.`);
    return;
  }

  console.log('Seeding hotels...');
  for (const h of HOTELS) {
    const existing = await prisma.hotel.findFirst({ where: { nameZh: h.nameZh } });
    if (existing) continue;

    const hotel = await prisma.hotel.create({
      data: {
        ownerId: merchantId,
        nameZh: h.nameZh,
        nameEn: h.nameEn,
        city: h.city,
        address: h.address,
        star: h.star,
        score: h.score,
        openTime: '2010-06-01',
        description: h.description,
        status: 'approved',
        facilities: h.facilities,
        images: h.images,
        minPrice: Math.min(...h.rooms.map(r => r.price)),
        rooms: { create: h.rooms }
      }
    });
    console.log(`  Created: ${hotel.nameZh}`);
  }
  console.log('Hotels seeded.');
}

// ─── Test Hotels for Admin Demo ─────────────────────────────────────────────
const TEST_HOTELS = [
  {
    nameZh: '北京朝阳亚朵S酒店（待审核）', nameEn: 'Atour S Hotel Beijing Chaoyang', city: '北京',
    address: '北京市朝阳区望京西路4号', star: 4, score: 0, status: 'pending',
    description: '亚朵S系列高端精品酒店，主打深度睡眠体验，配备专业睡眠系统和顶级寝具。', rejectReason: '',
    facilities: ['免费WiFi', '健身房', '24小时前台', '茶饮吧'],
    images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80'],
    rooms: [{ name: '睡眠大床房', price: 680 }, { name: '豪华双床房', price: 760 }]
  },
  {
    nameZh: '上海浦西皇冠假日酒店（待审核）', nameEn: 'Crowne Plaza Shanghai Puxi', city: '上海',
    address: '上海市长宁区延安西路2450号', star: 5, score: 0, status: 'pending',
    description: '矗立于上海西区，毗邻虹桥枢纽与中山公园，是典雅大气的商务型五星酒店。', rejectReason: '',
    facilities: ['免费WiFi', '游泳池', '健身房', '餐厅', '商务中心'],
    images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
    rooms: [{ name: '高级大床房', price: 1080 }, { name: '行政套房', price: 2200 }]
  },
  {
    nameZh: '成都天府新区瑞吉酒店（待审核）', nameEn: 'The St. Regis Chengdu Tianfu', city: '成都',
    address: '成都市天府新区兴隆湖畔88号', star: 5, score: 0, status: 'pending',
    description: '坐落于天府新区科学城兴隆湖畔，融汇巴蜀文化与现代奢华，打造西南顶级商务度假目的地。', rejectReason: '',
    facilities: ['免费WiFi', '无边泳池', '水疗', '管家服务', '湖景餐厅'],
    images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80'],
    rooms: [{ name: '湖景豪华房', price: 2400 }, { name: '皇家套房', price: 6800 }]
  },
  {
    nameZh: '广州天河汉庭酒店（已驳回）', nameEn: 'Hanting Hotel Guangzhou Tianhe', city: '广州',
    address: '广州市天河区天河路385号', star: 3, score: 0, status: 'rejected',
    description: '位于广州天河CBD，毗邻正佳广场，经济实惠，出行便利。', rejectReason: '提交的酒店图片分辨率过低，无法清晰展示客房情况；同时地址信息缺少详细门牌号，请补全后重新提交。',
    facilities: ['免费WiFi', '停车场', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'],
    rooms: [{ name: '标准大床房', price: 269 }, { name: '标准双床房', price: 299 }]
  },
  {
    nameZh: '深圳南山布丁酒店（已驳回）', nameEn: 'Pudding Hotel Shenzhen Nanshan', city: '深圳',
    address: '深圳市南山区科技园中路', star: 3, score: 0, status: 'rejected',
    description: '深圳科技园配套经济型酒店，适合短期商务出差。', rejectReason: '营业执照信息缺失，请补充酒店营业执照扫描件及消防安全合格证明文件，审核要求所有材料真实有效。',
    facilities: ['免费WiFi', '24小时前台'],
    images: ['https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&q=80'],
    rooms: [{ name: '标准间', price: 199 }]
  },
  {
    nameZh: '杭州湖滨喜来登酒店（已下线）', nameEn: 'Sheraton Hangzhou Lakeside Hotel', city: '杭州',
    address: '杭州市上城区湖滨路8号', star: 5, score: 4.6, status: 'offline',
    description: '坐落于西湖东岸核心位置，拥有湖景客房，提供全方位五星级服务，酒店现因设施改造暂时下线。', rejectReason: '',
    facilities: ['免费WiFi', '游泳池', '健身房', '西湖景观', '餐厅', '水疗'],
    images: ['https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&q=80'],
    rooms: [{ name: '湖景高级房', price: 1680 }, { name: '行政套房', price: 3200 }]
  },
];

async function ensureTestHotels(prisma, merchantId) {
  for (const h of TEST_HOTELS) {
    const existing = await prisma.hotel.findFirst({ where: { nameZh: h.nameZh } });
    if (existing) continue;
    await prisma.hotel.create({
      data: {
        ownerId: merchantId,
        nameZh: h.nameZh, nameEn: h.nameEn, city: h.city,
        address: h.address, star: h.star, score: h.score,
        openTime: '2020-01-01',
        description: h.description,
        status: h.status,
        rejectReason: h.rejectReason || '',
        facilities: h.facilities,
        images: h.images,
        minPrice: Math.min(...h.rooms.map(r => r.price)),
        rooms: { create: h.rooms }
      }
    });
    console.log(`  Created test hotel [${h.status}]: ${h.nameZh}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const prisma = getPrisma();
  try {
    await ensureAdmin(prisma);
    const merchant = await ensureMerchant(prisma);
    await ensureHotels(prisma, merchant.id);
    await ensureTestHotels(prisma, merchant.id);
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
