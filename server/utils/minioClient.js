const { Client } = require('minio');

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

function safeDecodeURIComponent(s) {
  try {
    return decodeURIComponent(s);
  } catch (e) {
    return s;
  }
}

function getMinioClient() {
  const endPointRaw = process.env.MINIO_ENDPOINT || 'localhost';
  const endPoint = String(endPointRaw).replace(/^https?:\/\//, '');
  const port = Number(process.env.MINIO_PORT || 9000);
  const useSSL = String(process.env.MINIO_USE_SSL || 'false') === 'true';

  const accessKey = requiredEnv('MINIO_ACCESS_KEY');
  const secretKey = requiredEnv('MINIO_SECRET_KEY');

  return new Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });
}

function getPublicBaseUrl() {
  return process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
}

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

async function ensureBucket(client, bucket) {
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
  }
}

function sanitizeFileName(name) {
  const raw = String(name || 'file');
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function putObjectFromBuffer({
  bucket,
  objectName,
  buffer,
  size,
  contentType,
}) {
  const client = getMinioClient();
  await ensureBucket(client, bucket);

  await client.putObject(bucket, objectName, buffer, size, {
    'Content-Type': contentType || 'application/octet-stream',
  });

  const base = getPublicBaseUrl();
  return {
    bucket,
    objectName,
    url: joinUrl(base, `${bucket}/${objectName}`),
  };
}

async function removeObject({ bucket, objectName }) {
  if (!bucket || !objectName) return;
  const client = getMinioClient();
  try {
    await client.removeObject(bucket, objectName);
  } catch (e) {
    if (e && (e.code === 'NoSuchKey' || e.code === 'NotFound')) return;
    throw e;
  }
}

function parseObjectFromMediaUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;

  const apiIdx = raw.indexOf('/api/media/');
  if (apiIdx >= 0) {
    const tail = raw.slice(apiIdx + '/api/media/'.length);
    const parts = tail.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const bucket = safeDecodeURIComponent(parts[0]);
    const objectName = parts
      .slice(1)
      .map((seg) => safeDecodeURIComponent(seg))
      .join('/');
    if (!bucket || !objectName) return null;
    return { bucket, objectName };
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      const pathParts = u.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) return null;
      const bucket = safeDecodeURIComponent(pathParts[0]);
      const objectName = pathParts
        .slice(1)
        .map((seg) => safeDecodeURIComponent(seg))
        .join('/');
      if (!bucket || !objectName) return null;
      return { bucket, objectName };
    } catch (e) {
      return null;
    }
  }

  return null;
}

module.exports = {
  getMinioClient,
  putObjectFromBuffer,
  sanitizeFileName,
  removeObject,
  parseObjectFromMediaUrl,
};
