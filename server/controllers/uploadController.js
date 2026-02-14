const multer = require('multer');
const { httpError } = require('../utils/errors');
const { putObjectFromBuffer, sanitizeFileName } = require('../utils/minioClient');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

function extFromMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/jpeg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/gif') return 'gif';
  if (m === 'video/mp4') return 'mp4';
  if (m === 'video/webm') return 'webm';
  if (m === 'video/quicktime') return 'mov';
  return '';
}

function randomKey(prefix, originalName, mimeType) {
  const safe = sanitizeFileName(originalName);
  const ext = extFromMime(mimeType);
  const hasExt = /\.[a-z0-9]+$/i.test(safe);
  const name = hasExt ? safe : ext ? `${safe}.${ext}` : safe;
  const ts = Date.now();
  const rnd = Math.random().toString(16).slice(2);
  return `${prefix}/${ts}_${rnd}_${name}`;
}

function assertType(type) {
  const t = String(type || '').toLowerCase();
  if (t !== 'image' && t !== 'video') {
    throw httpError(400, 'type must be image|video');
  }
  return t;
}

function assertMime(type, mime) {
  const m = String(mime || '').toLowerCase();
  if (type === 'image') {
    if (!m.startsWith('image/')) throw httpError(400, 'invalid image mime');
  }
  if (type === 'video') {
    if (!m.startsWith('video/')) throw httpError(400, 'invalid video mime');
  }
}

async function uploadSingle(req, res, next) {
  try {
    const type = assertType(req.query.type);

    const file = req.file;
    if (!file) throw httpError(400, 'file is required');

    assertMime(type, file.mimetype);

    const bucket = process.env.MINIO_BUCKET || 'yisu';
    const prefix = type === 'image' ? 'images' : 'videos';
    const objectName = randomKey(prefix, file.originalname, file.mimetype);

    const result = await putObjectFromBuffer({
      bucket,
      objectName,
      buffer: file.buffer,
      size: file.size,
      contentType: file.mimetype,
    });

    res.json({
      url: result.url,
      bucket: result.bucket,
      objectName: result.objectName,
      mimeType: file.mimetype,
      size: file.size,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  upload,
  uploadSingle,
};
