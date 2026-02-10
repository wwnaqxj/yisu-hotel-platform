const { hotels, rooms } = require('../data/db');
const { httpError } = require('../utils/errors');

function upsertRooms(hotelId, roomItems) {
  if (!Array.isArray(roomItems)) return;

  // Remove existing rooms for hotel
  for (let i = rooms.length - 1; i >= 0; i--) {
    if (rooms[i].hotelId === hotelId) rooms.splice(i, 1);
  }

  roomItems.forEach((r, idx) => {
    rooms.push({
      id: r.id || `r_${hotelId}_${idx}_${Date.now()}`,
      hotelId,
      name: r.name || `Room ${idx + 1}`,
      price: Number(r.price || 0),
    });
  });
}

function createHotel(req, res, next) {
  try {
    const ownerId = req.user.id;
    const {
      nameZh,
      nameEn,
      city,
      address,
      star,
      openTime,
      facilities,
      images,
      roomTypes,
    } = req.body;

    if (!nameZh || !nameEn || !address || !star || !openTime) {
      throw httpError(400, 'missing required fields');
    }

    const hotel = {
      id: `h_${Date.now()}`,
      ownerId,
      nameZh,
      nameEn,
      city: city || '',
      address,
      star,
      openTime,
      facilities: facilities || [],
      images: images || [],
      status: 'pending',
      rejectReason: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    hotels.push(hotel);
    upsertRooms(hotel.id, roomTypes);

    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

function updateHotel(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;
    const hotel = hotels.find((h) => h.id === id);
    if (!hotel) throw httpError(404, 'hotel not found');
    if (hotel.ownerId !== ownerId) throw httpError(403, 'forbidden');

    const patch = req.body || {};

    hotel.nameZh = patch.nameZh ?? hotel.nameZh;
    hotel.nameEn = patch.nameEn ?? hotel.nameEn;
    hotel.city = patch.city ?? hotel.city;
    hotel.address = patch.address ?? hotel.address;
    hotel.star = patch.star ?? hotel.star;
    hotel.openTime = patch.openTime ?? hotel.openTime;
    hotel.facilities = patch.facilities ?? hotel.facilities;
    hotel.images = patch.images ?? hotel.images;

    // Editing sends back to pending for re-audit
    hotel.status = 'pending';
    hotel.rejectReason = '';
    hotel.updatedAt = new Date().toISOString();

    upsertRooms(hotel.id, patch.roomTypes);

    res.json({ hotel });
  } catch (e) {
    next(e);
  }
}

function myHotels(req, res) {
  const ownerId = req.user.id;
  const items = hotels.filter((h) => h.ownerId === ownerId);
  res.json({ items });
}

module.exports = {
  createHotel,
  updateHotel,
  myHotels,
};
