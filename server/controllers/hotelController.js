const { httpError } = require('../utils/errors');
const { getPrisma } = require('../prismaClient');

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

    if (city) where.city = { contains: String(city) }; // Removed 'mode: insensitive' for MySQL compatibility if needed, but Prisma usually handles it.

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
        ...rest,
        price: currentMinPrice,
        minPrice: currentMinPrice,
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
        res.json({ hotel, rooms: hotel.rooms || [] });
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
