const { httpError } = require('../utils/errors');
const { getPrisma } = require('../prismaClient');

function normalizeNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma();
    const { city, keyword, status } = req.query;
    const page = Math.max(1, normalizeNumber(req.query.page, 1));
    const pageSize = Math.min(50, Math.max(1, normalizeNumber(req.query.pageSize, 10)));

    const where = {};
    if (status) where.status = status;
    else where.status = 'approved';

    if (city) where.city = { contains: String(city), mode: 'insensitive' };

    if (keyword) {
      const kw = String(keyword);
      where.OR = [
        { nameZh: { contains: kw, mode: 'insensitive' } },
        { nameEn: { contains: kw, mode: 'insensitive' } },
        { address: { contains: kw, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          rooms: { orderBy: { price: 'asc' }, take: 1 },
        },
      }),
    ]);

    const items = data.map((h) => {
      const minPrice = h.rooms?.[0]?.price;
      // keep response shape compatible with existing frontends
      const { rooms, ...rest } = h;
      return {
        ...rest,
        price: typeof minPrice === 'number' ? minPrice : undefined,
        minPrice: typeof minPrice === 'number' ? minPrice : undefined,
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
