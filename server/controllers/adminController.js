const { hotels } = require('../data/db');
const { httpError } = require('../utils/errors');

function auditList(req, res) {
  const status = req.query.status || 'pending';
  const items = hotels.filter((h) => h.status === status);
  res.json({ items });
}

function approve(req, res, next) {
  try {
    const { id } = req.params;
    const hotel = hotels.find((h) => h.id === id);
    if (!hotel) throw httpError(404, 'hotel not found');

    hotel.status = 'approved';
    hotel.rejectReason = '';
    hotel.updatedAt = new Date().toISOString();

    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

function reject(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const hotel = hotels.find((h) => h.id === id);
    if (!hotel) throw httpError(404, 'hotel not found');

    hotel.status = 'rejected';
    hotel.rejectReason = reason || 'not specified';
    hotel.updatedAt = new Date().toISOString();

    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

function offline(req, res, next) {
  try {
    const { id } = req.params;
    const hotel = hotels.find((h) => h.id === id);
    if (!hotel) throw httpError(404, 'hotel not found');

    hotel.status = 'offline';
    hotel.updatedAt = new Date().toISOString();

    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

function online(req, res, next) {
  try {
    const { id } = req.params;
    const hotel = hotels.find((h) => h.id === id);
    if (!hotel) throw httpError(404, 'hotel not found');

    hotel.status = 'approved';
    hotel.updatedAt = new Date().toISOString();

    res.json({ hotel });
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
