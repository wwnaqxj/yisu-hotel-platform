const { httpError } = require('../utils/errors');
const { getPrisma } = require('../prismaClient');

/**
 * GET /api/admin/audit
 * Params: status, page, pageSize, keyword
 * Returns: { items, total, page, pageSize, counts }
 */
async function auditList(req, res, next) {
  try {
    const prisma = getPrisma();
    const status = req.query.status || 'pending';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 15));
    const keyword = req.query.keyword ? String(req.query.keyword) : '';

    const where = { status };
    if (keyword) {
      where.OR = [
        { nameZh: { contains: keyword } },
        { city: { contains: keyword } },
        { address: { contains: keyword } },
      ];
    }

    // Count by each status for badge display
    const [total, items, counts] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, username: true } },
          rooms: { orderBy: { price: 'asc' }, take: 1 },
        },
      }),
      prisma.hotel.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const countMap = {};
    counts.forEach((c) => { countMap[c.status] = c._count.id; });

    res.json({ items, total, page, pageSize, countMap });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/admin/audit/:id  — single hotel detail
 */
async function auditDetail(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true } },
        rooms: { orderBy: { price: 'asc' } },
      },
    });
    if (!hotel) throw httpError(404, 'hotel not found');
    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

async function approve(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    const hotel = await prisma.hotel.update({
      where: { id },
      data: { status: 'approved', rejectReason: '' },
    }).catch((e) => { throw e.code === 'P2025' ? httpError(404, 'hotel not found') : e; });
    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

async function reject(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) throw httpError(400, '驳回原因不能为空');
    const hotel = await prisma.hotel.update({
      where: { id },
      data: { status: 'rejected', rejectReason: String(reason).trim() },
    }).catch((e) => { throw e.code === 'P2025' ? httpError(404, 'hotel not found') : e; });
    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

async function offline(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    // Only approved hotels can go offline
    const current = await prisma.hotel.findUnique({ where: { id }, select: { status: true } });
    if (!current) throw httpError(404, 'hotel not found');
    if (current.status !== 'approved') throw httpError(400, '只有已发布的酒店才能下线');
    const hotel = await prisma.hotel.update({ where: { id }, data: { status: 'offline' } });
    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

async function online(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    const current = await prisma.hotel.findUnique({ where: { id }, select: { status: true } });
    if (!current) throw httpError(404, 'hotel not found');
    if (current.status !== 'offline') throw httpError(400, '只有已下线的酒店才能恢复上线');
    const hotel = await prisma.hotel.update({ where: { id }, data: { status: 'approved' } });
    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

module.exports = { auditList, auditDetail, approve, reject, offline, online };
