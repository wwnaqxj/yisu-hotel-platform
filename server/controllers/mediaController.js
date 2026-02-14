const { httpError } = require('../utils/errors');
const { getMinioClient } = require('../utils/minioClient');

function safeDecodeURIComponent(v) {
  try {
    return decodeURIComponent(String(v || ''));
  } catch (e) {
    return String(v || '');
  }
}

async function streamObject(req, res, next) {
  try {
    const bucket = safeDecodeURIComponent(req.params.bucket);
    const objectName = safeDecodeURIComponent(req.params[0] || '');

    if (!bucket) throw httpError(400, 'bucket is required');
    if (!objectName) throw httpError(400, 'objectName is required');

    const client = getMinioClient();

    const stat = await client.statObject(bucket, objectName).catch(() => null);
    if (!stat) throw httpError(404, 'object not found');

    const meta = stat?.metaData || {};
    const contentType = meta['content-type'] || meta['Content-Type'] || stat?.contentType;
    if (contentType) res.setHeader('Content-Type', contentType);
    if (stat?.etag) res.setHeader('ETag', String(stat.etag));
    if (stat?.lastModified) res.setHeader('Last-Modified', new Date(stat.lastModified).toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Accept-Ranges', 'bytes');

    const totalSize = Number(stat.size || 0);
    const range = req.headers.range;

    // Support single range: bytes=start-end
    if (range && /^bytes=\d*-\d*$/.test(range) && totalSize > 0) {
      const [startStr, endStr] = String(range).replace(/^bytes=/, '').split('-');
      const start = startStr ? Number(startStr) : 0;
      const end = endStr ? Number(endStr) : totalSize - 1;

      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
        throw httpError(416, 'invalid range');
      }

      const safeStart = Math.min(start, totalSize - 1);
      const safeEnd = Math.min(end, totalSize - 1);
      const length = safeEnd - safeStart + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${safeStart}-${safeEnd}/${totalSize}`);
      res.setHeader('Content-Length', String(length));

      const partial = await client.getPartialObject(bucket, objectName, safeStart, length);
      partial.on('error', (e) => next(e));
      partial.pipe(res);
      return;
    }

    res.setHeader('Content-Length', String(totalSize));
    const stream = await client.getObject(bucket, objectName);
    stream.on('error', (e) => next(e));
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  streamObject,
};
