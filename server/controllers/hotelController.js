const { httpError } = require('../utils/errors');
const { getPrisma } = require('../prismaClient');

function apiBase(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  return `${proto}://${host}`;
}

function toMediaProxyUrl(req, rawUrl) {
  const u = String(rawUrl || '').trim();
  if (!u) return u;
  if (/\/api\/media\//.test(u)) return u;

  try {
    const parsed = new URL(u);
    const pathname = parsed.pathname || '';
    // MinIO public URL typically looks like: http://host:9001/<bucket>/<object>
    // Example: http://localhost:9001/yisu/images/xxx.png
    if (/^\/[\w-]+\//.test(pathname)) {
      return `${apiBase(req)}/api/media${pathname}`;
    }
    return u;
  } catch (e) {
    // If it's already a relative path like /yisu/images/xxx.png
    if (u.startsWith('/')) {
      if (/^\/[\w-]+\//.test(u)) return `${apiBase(req)}/api/media${u}`;
    }
    return u;
  }
}

function normalizeMediaFields(req, obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const fields = ['images', 'videos', 'medias', 'bannerMedias'];
  for (const f of fields) {
    if (Array.isArray(obj[f])) {
      obj[f] = obj[f].map((x) => toMediaProxyUrl(req, x));
    }
  }
  return obj;
}

function normalizeNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma();
    const { city, keyword, status, minPrice, maxPrice, star, sort } = req.query;
    const page = Math.max(1, normalizeNumber(req.query.page, 1));
    const pageSize = Math.min(50, Math.max(1, normalizeNumber(req.query.pageSize, 10)));

    const where = {};
    if (status) where.status = status;
    else where.status = 'approved';

    if (city) where.city = { contains: String(city) };

    if (keyword) {
      const kw = String(keyword);
      where.OR = [
        { nameZh: { contains: kw } },
        { nameEn: { contains: kw } },
        { address: { contains: kw } },
      ];
    }

    // Price Filter
    if (minPrice || maxPrice) {
      where.minPrice = {};
      if (minPrice) where.minPrice.gte = Number(minPrice);
      if (maxPrice) where.minPrice.lte = Number(maxPrice);
    }

    // Star Filter (e.g., star=3,4,5)
    if (star) {
      const stars = String(star).split(',').map(Number).filter(n => n > 0);
      if (stars.length > 0) {
        where.star = { in: stars };
      }
    }

    // Sorting
    let orderBy = { updatedAt: 'desc' };
    if (sort === 'price_asc') orderBy = { minPrice: 'asc' };
    else if (sort === 'price_desc') orderBy = { minPrice: 'desc' };
    else if (sort === 'score_desc') orderBy = { score: 'desc' };

    const [total, data] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          rooms: { orderBy: { price: 'asc' }, take: 1 },
        },
      }),
    ]);

    const items = data.map((h) => {
      // Use the stored minPrice if available, otherwise fall back to room price
      let currentMinPrice = h.minPrice;
      if (!currentMinPrice && h.rooms?.length > 0) {
        currentMinPrice = h.rooms[0].price;
      }

      const { rooms, ...rest } = h;
      return {
        ...normalizeMediaFields(req, { ...rest }),
        // For list cards, always return a usable minPrice (fallback to cheapest room)
        price: currentMinPrice ?? 0,
        minPrice: currentMinPrice ?? 0,
      };
    });

    res.json({ page, pageSize, total, items });
  } catch (e) {
    next(e);
  }
}

function detail(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    prisma.hotel
      .findFirst({
        where: { id, status: 'approved' },
        include: { rooms: { orderBy: { price: 'asc' } } },
      })
      .then((hotel) => {
        if (!hotel) throw httpError(404, 'hotel not found');
        const { rooms, ...rest } = hotel;
        const normalizedHotel = normalizeMediaFields(req, { ...rest });
        const normalizedRooms = (rooms || []).map((r) => normalizeMediaFields(req, { ...r }));
        res.json({ hotel: normalizedHotel, rooms: normalizedRooms });
      })
      .catch(next);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  detail,
};
