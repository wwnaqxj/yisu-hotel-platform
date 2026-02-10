const { httpError } = require('../utils/errors');
const { getPrisma } = require('../prismaClient');

function auditList(req, res) {
  const prisma = getPrisma();
  const status = req.query.status || 'pending';
  prisma.hotel
    .findMany({ where: { status }, orderBy: { updatedAt: 'desc' } })
    .then((items) => res.json({ items }))
    .catch((e) => res.status(500).json({ message: e.message || 'Server error' }));
}

function approve(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    prisma.hotel
      .update({
        where: { id },
        data: { status: 'approved', rejectReason: '' },
      })
      .then((hotel) => res.json({ hotel }))
      .catch((e) => {
        if (e.code === 'P2025') return next(httpError(404, 'hotel not found'));
        return next(e);
      });
  } catch (e) {
    next(e);
  }
}

function reject(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    const { reason } = req.body;
    prisma.hotel
      .update({
        where: { id },
        data: { status: 'rejected', rejectReason: reason || 'not specified' },
      })
      .then((hotel) => res.json({ hotel }))
      .catch((e) => {
        if (e.code === 'P2025') return next(httpError(404, 'hotel not found'));
        return next(e);
      });
  } catch (e) {
    next(e);
  }
}

function offline(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    prisma.hotel
      .update({ where: { id }, data: { status: 'offline' } })
      .then((hotel) => res.json({ hotel }))
      .catch((e) => {
        if (e.code === 'P2025') return next(httpError(404, 'hotel not found'));
        return next(e);
      });
  } catch (e) {
    next(e);
  }
}

function online(req, res, next) {
  try {
    const prisma = getPrisma();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    prisma.hotel
      .update({ where: { id }, data: { status: 'approved' } })
      .then((hotel) => res.json({ hotel }))
      .catch((e) => {
        if (e.code === 'P2025') return next(httpError(404, 'hotel not found'));
        return next(e);
      });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  auditList,
  approve,
  reject,
  offline,
  online,
};
