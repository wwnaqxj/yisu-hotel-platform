const { httpError } = require('../utils/errors');
const { getPrisma } = require('../prismaClient');
const https = require('https');

function httpsJsonPost(url, { headers, body, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = typeof body === 'string' ? body : JSON.stringify(body ?? {});

    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...(headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const status = res.statusCode || 0;
          let json;
          try {
            json = data ? JSON.parse(data) : {};
          } catch (e) {
            json = {};
          }
          resolve({ status, json });
        });
      }
    );

    req.on('error', reject);
    if (timeoutMs) {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error('Request timeout'));
      });
    }
    req.write(payload);
    req.end();
  });
}

function normStr(v) {
  if (v == null) return '';
  return String(v).trim();
}

function pickCityFromText(text) {
  const t = normStr(text);
  const m = t.match(/(?:在)?([\u4e00-\u9fa5]{2,10})\s*(?:市)?\s*(?:有|有哪些|有哪几家).*酒店/);
  return m?.[1] ? m[1].trim() : '';
}

function pickHotelNameFromText(text) {
  const t = normStr(text);
  const m = t.match(/([\u4e00-\u9fa5A-Za-z0-9·\s]{2,40}?)(?:酒店)?\s*(?:的)?\s*(?:有哪些|有什么)?\s*房型/);
  return m?.[1] ? m[1].trim() : '';
}

function isInventoryIntent(text) {
  const t = normStr(text);
  return /(还|还有|剩余|可订|库存|余房|剩下|还剩)/.test(t);
}

function cleanHotelName(name) {
  let n = normStr(name);
  if (!n) return '';
  n = n
    .replace(/(还|还有|剩余|可订|库存|余房|剩下|还剩).*/g, '')
    .replace(/(有哪些|有什么|还有哪些|还剩哪些|还剩什么).*/g, '')
    .replace(/的.*$/g, '')
    .trim();
  return n;
}

function pickInventoryQuery(text) {
  const t = normStr(text);
  let m = t.match(/([\u4e00-\u9fa5A-Za-z0-9·\s]{2,40}?)(?:酒店)\s*([\u4e00-\u9fa5A-Za-z0-9·\s]{1,40})?\s*(?:房型)?\s*(?:还|还有|剩余|可订|库存|余房).*?(?:多少|几间|几套)?/);
  if (m?.[1]) {
    const hotelName = m[1].trim();
    const roomName = m?.[2] ? m[2].trim() : '';
    return { hotelName, roomName };
  }

  m = t.match(/([\u4e00-\u9fa5A-Za-z0-9·\s]{2,40}?)(?:酒店)\s*(?:还|还有|剩余|可订|库存|余房)/);
  if (m?.[1]) return { hotelName: m[1].trim(), roomName: '' };

  return { hotelName: '', roomName: '' };
}

function pickHotelInfoNameFromText(text) {
  const t = normStr(text);
  const m = t.match(
    /([\u4e00-\u9fa5A-Za-z0-9·\s]{2,40}?)(?:酒店)?\s*(?:的)?\s*(?:信息|详情|介绍|简介|基本信息|地址|在哪|位置|开业|设施|图片|视频)/
  );
  return m?.[1] ? m[1].trim() : '';
}

function pickHotelRefFromText(text) {
  const t = normStr(text);
  if (!t) return { type: '', index: -1 };

  if (/(这家|这个|该酒店|这间|这家酒店)/.test(t)) return { type: 'this', index: 0 };

  let m = t.match(/第\s*([0-9]{1,2})\s*家/);
  if (m?.[1]) return { type: 'nth', index: Math.max(0, Number(m[1]) - 1) };

  m = t.match(/第\s*([一二三四五六七八九十]{1,3})\s*家/);
  if (m?.[1]) {
    const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const s = m[1];
    let n = 0;
    if (s.length === 1) n = map[s] || 0;
    else if (s.length === 2 && s[0] === '十') n = 10 + (map[s[1]] || 0);
    else if (s.length === 2 && s[1] === '十') n = (map[s[0]] || 0) * 10;
    else if (s.length === 3 && s[1] === '十') n = (map[s[0]] || 0) * 10 + (map[s[2]] || 0);
    if (n > 0) return { type: 'nth', index: Math.max(0, n - 1) };
  }

  return { type: '', index: -1 };
}

function normalizeHotelsForContext(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((h) => ({
      id: h?.id,
      nameZh: h?.nameZh || '',
      nameEn: h?.nameEn || '',
      city: h?.city || '',
      address: h?.address || '',
      star: h?.star,
    }))
    .filter((h) => h.id);
}

async function callSiliconFlowChat({ message }) {
  const baseURL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
  const apiKey = process.env.SILICONFLOW_API_KEY;
  const model = process.env.SILICONFLOW_MODEL || 'Qwen/Qwen3-8B';

  if (!apiKey) throw httpError(500, 'missing SILICONFLOW_API_KEY');

  const url = baseURL.replace(/\/+$/, '') + '/chat/completions';
  const { status, json } = await httpsJsonPost(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      model,
      messages: [
        {
          role: 'system',
          content:
            '你是易宿酒店平台的数字助手。\n' +
            '要求：\n' +
            '1) 回答用中文，结构化输出，尽量给出可执行建议。\n' +
            '2) 绝不编造酒店/房型/库存等数据库事实；不确定就说“我无法从数据库确定”。\n' +
            '3) 当用户在问酒店/房型/库存时，优先提示用户使用精确酒店名或城市名以便查询。\n' +
            '4) 语气专业友好，信息尽量详细但不冗长。',
        },
        { role: 'user', content: normStr(message) },
      ],
      temperature: 0.2,
    },
    timeoutMs: 25_000,
  });

  if (status < 200 || status >= 300) {
    throw httpError(status || 500, json?.error?.message || json?.message || 'LLM request failed');
  }

  const reply = json?.choices?.[0]?.message?.content;
  return {
    reply: normStr(reply) || '我暂时无法回答这个问题。',
    raw: json,
  };
}

async function chat(req, res, next) {
  try {
    const prisma = getPrisma();
    const message = normStr(req.body?.message);
    if (!message) throw httpError(400, 'message required');

    const clientCtx = req.body?.context || {};
    const lastHotels = Array.isArray(clientCtx?.lastHotels) ? clientCtx.lastHotels : [];
    const lastHotelId = clientCtx?.lastHotelId || '';

    const debugEnabled = process.env.ASSISTANT_DEBUG === '1';
    const debug = debugEnabled
      ? {
          message,
          picked: {
            city: pickCityFromText(message),
            hotelInfoName: cleanHotelName(pickHotelInfoNameFromText(message)),
            inventory: pickInventoryQuery(message),
            hotelRoomsName: cleanHotelName(pickHotelNameFromText(message)),
            isInventoryIntent: isInventoryIntent(message),
            hotelRef: pickHotelRefFromText(message),
            ctx: {
              lastHotelId,
              lastHotelsCount: lastHotels.length,
            },
          },
          version: 'assistantController_v2_rules',
        }
      : undefined;

    // Resolve references like “这家酒店/第一家/第二家” from lastHotels
    const hotelRef = pickHotelRefFromText(message);
    const refHotel =
      hotelRef.type && lastHotels.length > 0 && hotelRef.index >= 0 && hotelRef.index < lastHotels.length
        ? lastHotels[hotelRef.index]
        : null;

    // 1) City -> hotels
    const city = pickCityFromText(message);
    if (city) {
      const items = await prisma.hotel.findMany({
        where: {
          status: 'approved',
          city: { contains: city },
        },
        orderBy: { updatedAt: 'desc' },
        include: { rooms: { orderBy: { price: 'asc' }, take: 1 } },
        take: 20,
      });

      const reply =
        items.length > 0
          ? `${city}当前可查询到 ${items.length} 家酒店（最多展示20家）：\n` +
            items
              .map((h, i) => {
                const name = h.nameZh || h.nameEn || `酒店#${h.id}`;
                const addr = h.address ? `地址：${h.address}` : '';
                const star = h.star != null ? `${h.star}星` : '';
                const minPrice = h.rooms?.[0]?.price != null ? `¥${h.rooms[0].price}/晚起` : '';
                const extra = [star, minPrice, addr].filter(Boolean).join('，');
                return `${i + 1}. ${name}${extra ? `（${extra}）` : ''}`;
              })
              .join('\n')
          : `${city}暂未查询到已上架酒店。你也可以换个城市名或确认酒店已审核通过。`;

      const ctxHotels = normalizeHotelsForContext(items);
      const context = { lastHotels: ctxHotels, lastHotelId: ctxHotels?.[0]?.id || '' };
      res.json({ reply, intent: 'city_hotels', data: { city, items }, context, ...(debugEnabled ? { debug } : {}) });
      return;
    }

    // 2) Hotel info/detail
    const hotelNameForInfo = cleanHotelName(pickHotelInfoNameFromText(message)) || cleanHotelName(refHotel?.nameZh || refHotel?.nameEn);
    if (hotelNameForInfo) {
      const hotel = await prisma.hotel.findFirst({
        where: {
          status: 'approved',
          OR: [
            { nameZh: { equals: hotelNameForInfo } },
            { nameEn: { equals: hotelNameForInfo } },
            { nameZh: { contains: hotelNameForInfo } },
            { nameEn: { contains: hotelNameForInfo } },
          ],
        },
      });

      if (!hotel) {
        res.json({ reply: `没有查询到与“${hotelNameForInfo}”匹配的酒店。`, intent: 'hotel_info', data: { hotelName: hotelNameForInfo }, ...(debugEnabled ? { debug } : {}) });
        return;
      }

      const name = hotel.nameZh || hotel.nameEn || `酒店#${hotel.id}`;
      const reply =
        `“${name}”酒店信息：\n` +
        `- 城市：${hotel.city || '-'}\n` +
        `- 地址：${hotel.address || '-'}\n` +
        `- 星级：${hotel.star != null ? hotel.star : '-'}\n` +
        `- 开业时间：${hotel.openTime || '-'}\n` +
        `- 设施：${hotel.facilities || '-'}\n` +
        `- 简介：${hotel.description || '-'}\n` +
        `- 坐标：${hotel.lat != null && hotel.lng != null ? `${hotel.lat}, ${hotel.lng}` : '-'}\n` +
        `如果你想看“可订房型/剩余房间”，可以问：${name}还剩什么房间。`;

      const context = { lastHotels, lastHotelId: hotel.id };
      res.json({ reply, intent: 'hotel_info', data: { hotelId: hotel.id }, context, ...(debugEnabled ? { debug } : {}) });
      return;
    }

    // 3) Inventory query (place before hotel->rooms to avoid mis-parsing like “快乐酒店还剩什么房间/房型”)
    const inv = pickInventoryQuery(message);
    const invHotelNameFromRef = cleanHotelName(refHotel?.nameZh || refHotel?.nameEn);
    if ((inv.hotelName || invHotelNameFromRef) && isInventoryIntent(message)) {
      const hotelName = cleanHotelName(inv.hotelName) || invHotelNameFromRef || inv.hotelName;
      const hotel = await prisma.hotel.findFirst({
        where: {
          status: 'approved',
          OR: [
            { nameZh: { equals: hotelName } },
            { nameEn: { equals: hotelName } },
            { nameZh: { contains: hotelName } },
            { nameEn: { contains: hotelName } },
          ],
        },
        include: { rooms: { orderBy: { price: 'asc' } } },
      });

      if (!hotel) {
        res.json({ reply: `没有查询到与“${hotelName}”匹配的酒店。`, intent: 'inventory', data: { ...inv, hotelName }, ...(debugEnabled ? { debug } : {}) });
        return;
      }

      let rooms = hotel.rooms || [];
      if (inv.roomName) {
        rooms = rooms.filter((r) => String(r.name || '').toLowerCase().includes(inv.roomName.toLowerCase()));
      }

      // If user asks “还剩什么房间/可订哪些房型”，优先只展示可订(availableRooms>0)的
      if (isInventoryIntent(message)) {
        const hasAvail = rooms.some((r) => r.availableRooms != null);
        if (hasAvail) rooms = rooms.filter((r) => (r.availableRooms == null ? true : Number(r.availableRooms) > 0));
      }

      if (rooms.length === 0) {
        const base = `“${hotel.nameZh || hotel.nameEn}”`;
        res.json({
          reply: inv.roomName ? `${base}中没有匹配“${inv.roomName}”的可订房型。` : `${base}当前没有可订房型（剩余房间数为0）。`,
          intent: 'inventory',
          data: { hotelId: hotel.id, roomName: inv.roomName || '' },
          ...(debugEnabled ? { debug } : {}),
        });
        return;
      }

      const hotelTitle = hotel.nameZh || hotel.nameEn;
      const hotelInfo = [
        hotel.city ? `城市：${hotel.city}` : '',
        hotel.star != null ? `星级：${hotel.star}` : '',
        hotel.address ? `地址：${hotel.address}` : '',
      ]
        .filter(Boolean)
        .join('，');

      const reply =
        `“${hotelTitle}”当前可订房型如下：\n` +
        (hotelInfo ? `${hotelInfo}\n` : '') +
        rooms
          .map((r, i) => {
            const a = r.availableRooms != null ? r.availableRooms : '未知';
            const t = r.totalRooms != null ? r.totalRooms : '未知';
            const meta = [r.bedType, r.area != null ? `${r.area}㎡` : '', r.breakfast].filter(Boolean).join(' · ');
            const price = r.price != null ? `¥${r.price}/晚` : '';
            const extra = [price, meta].filter(Boolean).join('，');
            return `${i + 1}. ${r.name}：剩余 ${a} / 总 ${t}${extra ? `（${extra}）` : ''}`;
          })
          .join('\n');

      const context = { lastHotels, lastHotelId: hotel.id };
      res.json({ reply, intent: 'inventory', data: { hotelId: hotel.id, roomName: inv.roomName || '' }, context, ...(debugEnabled ? { debug } : {}) });
      return;
    }

    // 4) Hotel -> rooms
    const hotelNameForRooms = cleanHotelName(pickHotelNameFromText(message)) || cleanHotelName(refHotel?.nameZh || refHotel?.nameEn);
    if (hotelNameForRooms && !isInventoryIntent(message)) {
      const hotel = await prisma.hotel.findFirst({
        where: {
          status: 'approved',
          OR: [{ nameZh: { contains: hotelNameForRooms } }, { nameEn: { contains: hotelNameForRooms } }],
        },
        include: { rooms: { orderBy: { price: 'asc' } } },
      });

      if (!hotel) {
        res.json({ reply: `没有查询到与“${hotelNameForRooms}”匹配的酒店。`, intent: 'hotel_rooms', data: { hotelName: hotelNameForRooms }, ...(debugEnabled ? { debug } : {}) });
        return;
      }

      const rooms = hotel.rooms || [];
      const reply =
        rooms.length > 0
          ? `“${hotel.nameZh || hotel.nameEn}”共有 ${rooms.length} 个房型：\n` +
            rooms
              .map((r, i) => {
                const price = r.price != null ? `¥${r.price}/晚` : '价格未知';
                const meta = [r.bedType, r.area != null ? `${r.area}㎡` : '', r.breakfast].filter(Boolean).join(' · ');
                const inv =
                  r.availableRooms != null || r.totalRooms != null
                    ? `库存：剩余${r.availableRooms != null ? r.availableRooms : '未知'} / 总${r.totalRooms != null ? r.totalRooms : '未知'}`
                    : '';
                const parts = [price, meta, inv].filter(Boolean).join('，');
                return `${i + 1}. ${r.name}${parts ? `（${parts}）` : ''}`;
              })
              .join('\n')
          : `“${hotel.nameZh || hotel.nameEn}”暂未录入房型。`;

      const context = { lastHotels, lastHotelId: hotel.id };
      res.json({ reply, intent: 'hotel_rooms', data: { hotelId: hotel.id }, context, ...(debugEnabled ? { debug } : {}) });
      return;
    }

    // 5) fallback to LLM
    const llm = await callSiliconFlowChat({ message });
    const context = { lastHotels, lastHotelId };
    res.json({ reply: llm.reply, intent: 'llm', usage: llm.raw?.usage, context, ...(debugEnabled ? { debug } : {}) });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  chat,
};
