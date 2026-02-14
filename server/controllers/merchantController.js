const { httpError } = require('../utils/errors');
const { getPrisma } = require('../prismaClient');

function normalizeRoomItems(roomItems) {
  if (!Array.isArray(roomItems)) return [];
  return roomItems
    .filter((r) => r && (r.name || r.price != null))
    .map((r, idx) => ({
      name: r.name || `Room ${idx + 1}`,
      price: Number(r.price || 0),
    }));
}

function normalizeMediaList(v) {
  if (v == null) return undefined;

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        return normalizeMediaList(JSON.parse(s));
      } catch (e) {
        return [s];
      }
    }
    return [s];
  }

  if (Array.isArray(v)) {
    const arr = v
      .map((x) => (typeof x === 'string' ? x.trim() : x))
      .filter((x) => typeof x === 'string' && x);
    return arr.length ? arr : undefined;
  }

  return undefined;
}

function createHotel(req, res, next) {
  try {
    const prisma = getPrisma();
    const ownerId = req.user.id;
    const {
      nameZh,
      nameEn,
      city,
      address,
      star,
      openTime,
      description,
      facilities,
      images,
      videos,
      roomTypes,
    } = req.body;

    const imagesNorm = normalizeMediaList(images);
    const videosNorm = normalizeMediaList(videos);
    console.log('[merchant.createHotel] media:', { rawImages: images, rawVideos: videos, images: imagesNorm, videos: videosNorm });

    if (!nameZh || !nameEn || !address || !star || !openTime) {
      throw httpError(400, 'missing required fields');
    }

    const rooms = normalizeRoomItems(roomTypes);
    prisma.hotel
      .create({
        data: {
          ownerId,
          nameZh,
          nameEn,
          city: city || '',
          address,
          star: Number(star),
          openTime,
          description: description ?? undefined,
          facilities: facilities ?? undefined,
          images: imagesNorm,
          videos: videosNorm,
          status: 'pending',
          rejectReason: '',
          rooms: rooms.length ? { create: rooms } : undefined,
        },
      })
      .then((hotel) => res.json({ hotel }))
      .catch(next);
  } catch (e) {
    next(e);
  }
}

function updateHotel(req, res, next) {
  try {
    const prisma = getPrisma();
    const ownerId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');
    const patch = req.body || {};

    const images = patch.images;
    const videos = patch.videos;
    const imagesNorm = normalizeMediaList(images);
    const videosNorm = normalizeMediaList(videos);
    console.log('[merchant.updateHotel] media:', { rawImages: images, rawVideos: videos, images: imagesNorm, videos: videosNorm });

    prisma.hotel
      .findUnique({ where: { id } })
      .then((hotel) => {
        if (!hotel) throw httpError(404, 'hotel not found');
        if (hotel.ownerId !== ownerId) throw httpError(403, 'forbidden');

        const rooms = normalizeRoomItems(patch.roomTypes);

        return prisma.hotel.update({
          where: { id },
          data: {
            nameZh: patch.nameZh ?? undefined,
            nameEn: patch.nameEn ?? undefined,
            city: patch.city ?? undefined,
            address: patch.address ?? undefined,
            star: patch.star != null ? Number(patch.star) : undefined,
            openTime: patch.openTime ?? undefined,
            description: patch.description ?? undefined,
            facilities: patch.facilities ?? undefined,
            images: imagesNorm,
            videos: videosNorm,
            status: 'pending',
            rejectReason: '',
            rooms: rooms.length
              ? {
                  deleteMany: {},
                  create: rooms,
                }
              : undefined,
          },
        });
      })
      .then((hotel) => res.json({ hotel }))
      .catch(next);
  } catch (e) {
    next(e);
  }
}

function myHotels(req, res) {
  const prisma = getPrisma();
  const ownerId = req.user.id;
  prisma.hotel
    .findMany({ where: { ownerId }, orderBy: { updatedAt: 'desc' } })
    .then((items) => res.json({ items }))
    .catch((e) => res.status(500).json({ message: e.message || 'Server error' }));
}

function hotelDetail(req, res, next) {
  try {
    const prisma = getPrisma();
    const ownerId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'invalid id');

    prisma.hotel
      .findUnique({
        where: { id },
        include: { rooms: { orderBy: { price: 'asc' } } },
      })
      .then((hotel) => {
        if (!hotel) throw httpError(404, 'hotel not found');
        if (hotel.ownerId !== ownerId) throw httpError(403, 'forbidden');
        res.json({ hotel, rooms: hotel.rooms || [] });
      })
      .catch(next);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createHotel,
  updateHotel,
  myHotels,
  hotelDetail,
};
