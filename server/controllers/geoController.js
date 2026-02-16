const https = require('https');
const { URL } = require('url');
const { httpError } = require('../utils/errors');

function getAmapKey() {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) throw httpError(500, 'AMAP_WEB_KEY is not configured');
  return key;
}

function httpsGetJson(urlString) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString);
    https
      .get(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          protocol: u.protocol,
          timeout: 10000,
        },
        (res) => {
          let raw = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(raw);
              resolve(json);
            } catch (e) {
              reject(httpError(502, 'Invalid JSON from Amap'));
            }
          });
        }
      )
      .on('error', (e) => reject(httpError(502, e.message || 'Amap request failed')))
      .on('timeout', function () {
        this.destroy();
        reject(httpError(504, 'Amap request timeout'));
      });
  });
}

async function geocode(req, res, next) {
  try {
    const { keyword, city } = req.body || {};
    const kw = String(keyword || '').trim();
    if (!kw) throw httpError(400, 'keyword is required');

    const key = getAmapKey();
    const u = new URL('https://restapi.amap.com/v3/geocode/geo');
    u.searchParams.set('key', key);
    u.searchParams.set('address', kw);
    if (city) u.searchParams.set('city', String(city));

    const data = await httpsGetJson(u.toString());
    if (String(data.status) !== '1') throw httpError(502, data.info || 'Amap geocode failed');

    const first = Array.isArray(data.geocodes) ? data.geocodes[0] : null;
    if (!first || !first.location) throw httpError(404, 'no geocode result');

    const [lngStr, latStr] = String(first.location).split(',');
    const lng = Number(lngStr);
    const lat = Number(latStr);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw httpError(502, 'invalid geocode location');

    res.json({ lng, lat, geocode: first });
  } catch (e) {
    next(e);
  }
}

async function nearby(req, res, next) {
  try {
    const key = getAmapKey();

    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw httpError(400, 'lng/lat is required');

    const keywords = String(req.query.keywords || '').trim();
    const types = String(req.query.types || '').trim();
    const radius = Number(req.query.radius || 2000);
    const pageSize = Math.min(25, Math.max(1, Number(req.query.pageSize || 10)));

    const u = new URL('https://restapi.amap.com/v3/place/around');
    u.searchParams.set('key', key);
    u.searchParams.set('location', `${lng},${lat}`);
    u.searchParams.set('radius', String(Number.isFinite(radius) ? radius : 2000));
    u.searchParams.set('sortrule', 'distance');
    u.searchParams.set('extensions', 'base');
    u.searchParams.set('offset', String(pageSize));
    if (keywords) u.searchParams.set('keywords', keywords);
    if (types) u.searchParams.set('types', types);

    const data = await httpsGetJson(u.toString());
    if (String(data.status) !== '1') throw httpError(502, data.info || 'Amap nearby failed');

    const pois = Array.isArray(data.pois) ? data.pois : [];
    const items = pois.map((p) => {
      const [plng, plat] = String(p.location || '').split(',');
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        typecode: p.typecode,
        address: p.address,
        distance: p.distance != null ? Number(p.distance) : undefined,
        lng: Number(plng),
        lat: Number(plat),
      };
    });

    res.json({ items, raw: data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  geocode,
  nearby,
};
