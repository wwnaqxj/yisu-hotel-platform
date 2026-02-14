const { Client } = require('minio');

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
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

module.exports = {
  getMinioClient,
  putObjectFromBuffer,
  sanitizeFileName,
};
