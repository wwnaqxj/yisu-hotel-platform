const { hotels, rooms } = require('../data/db');
const { httpError } = require('../utils/errors');

function normalizeNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function list(req, res) {
  const { city, keyword, status } = req.query;
  const page = Math.max(1, normalizeNumber(req.query.page, 1));
  const pageSize = Math.min(50, Math.max(1, normalizeNumber(req.query.pageSize, 10)));

  let result = hotels.slice();

  if (status) {
    result = result.filter((h) => h.status === status);
  } else {
    // C-side default: show approved only
    result = result.filter((h) => h.status === 'approved');
  }

  if (city) result = result.filter((h) => (h.city || '').toLowerCase().includes(String(city).toLowerCase()));
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    result = result.filter((h) => {
      return (
        String(h.nameZh || '').toLowerCase().includes(kw) ||
        String(h.nameEn || '').toLowerCase().includes(kw) ||
        String(h.address || '').toLowerCase().includes(kw)
      );
    });
  }

  const total = result.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = result.slice(start, end);

  res.json({
    page,
    pageSize,
    total,
    items,
  });
}

function detail(req, res, next) {
  try {
    const { id } = req.params;
    const hotel = hotels.find((h) => h.id === id);
    if (!hotel) throw httpError(404, 'hotel not found');

    const roomList = rooms
      .filter((r) => r.hotelId === id)
      .slice()
      .sort((a, b) => Number(a.price) - Number(b.price));

    res.json({ hotel, rooms: roomList });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  detail,
};
