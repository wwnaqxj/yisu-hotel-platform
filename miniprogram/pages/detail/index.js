const { request } = require('../../utils/request');

Page({
  data: {
    id: '',
    hotel: {},
    rooms: [],
    error: '',

    navTop: 0,
    navHeight: 44,
    navTotal: 44,
    navSafe: 68,

    bannerMedias: [],
    facilities: [],

    checkIn: '',
    checkOut: '',
    nights: 1,
    guests: 2,
    roomCount: 1,

    today: '',

    selectedRoom: null,

    lng: null,
    lat: null,
    markers: [],
    poisLoading: false,
    poisError: '',
    poisExpanded: false,
    poiPanelOpen: false,
    nearbySubway: [],
    nearbySubwayTop: [],
    nearbySubwayView: [],
    nearbyBus: [],
    nearbyBusTop: [],
    nearbyBusView: [],
    nearbyFood: [],
    nearbyFoodTop: [],
    nearbyFoodView: []
  },

  onLoad(options) {
    const id = options.id || 'demo';
    this.initNavMetrics();

    const today = this.formatDate(new Date());
    const checkIn = options.checkIn || today;
    const checkOut = options.checkOut || this.addDays(checkIn, 1);

    this.setData({ id, checkIn, checkOut, today });
    this.calcNights();
    this.fetchDetail();
  },

  initNavMetrics() {
    try {
      const sys = wx.getSystemInfoSync();
      const menu = wx.getMenuButtonBoundingClientRect();

      const statusBarHeight = Number(sys.statusBarHeight || 0);
      const navTop = statusBarHeight;

      const gap = Math.max(0, menu.top - statusBarHeight);
      const navHeight = menu.height + gap * 2;
      const navTotal = navTop + navHeight;

      const navSafe = navTotal + 24;

      this.setData({ navTop, navHeight, navTotal, navSafe });
    } catch (e) {
      this.setData({ navTop: 0, navHeight: 44, navTotal: 44, navSafe: 68 });
    }
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages && pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab ? wx.switchTab({ url: '/pages/home/index' }) : wx.reLaunch({ url: '/pages/home/index' });
    }
  },

  onCheckInChange(e) {
    const checkIn = e.detail.value;
    let { checkOut } = this.data;
    if (checkOut && checkOut <= checkIn) checkOut = this.addDays(checkIn, 1);
    this.setData({ checkIn, checkOut });
    this.calcNights();
  },

  onCheckOutChange(e) {
    const checkOut = e.detail.value;
    this.setData({ checkOut });
    this.calcNights();
  },

  calcNights() {
    const { checkIn, checkOut } = this.data;
    const inTs = Date.parse(checkIn);
    const outTs = Date.parse(checkOut);
    const diff = Number.isFinite(inTs) && Number.isFinite(outTs) ? Math.floor((outTs - inTs) / 86400000) : 1;
    this.setData({ nights: diff > 0 ? diff : 1 });
  },

  addDays(dateStr, days) {
    const ts = Date.parse(dateStr);
    const d = new Date(Number.isFinite(ts) ? ts : Date.now());
    d.setDate(d.getDate() + Number(days || 0));
    return this.formatDate(d);
  },

  formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  decGuests() {
    const v = Math.max(1, Number(this.data.guests) - 1);
    this.setData({ guests: v });
  },

  incGuests() {
    const v = Math.min(10, Number(this.data.guests) + 1);
    this.setData({ guests: v });
  },

  decRooms() {
    const v = Math.max(1, Number(this.data.roomCount) - 1);
    this.setData({ roomCount: v });
  },

  incRooms() {
    const v = Math.min(10, Number(this.data.roomCount) + 1);
    this.setData({ roomCount: v });
  },

  calcTotal(price) {
    const p = Number(price || 0);
    const nights = Number(this.data.nights || 1);
    const roomCount = Number(this.data.roomCount || 1);
    const total = Math.max(0, p) * Math.max(1, nights) * Math.max(1, roomCount);
    return total;
  },

  onSelectRoom(e) {
    const idx = Number(e?.currentTarget?.dataset?.index);
    const room = Number.isFinite(idx) ? this.data.rooms[idx] : null;
    if (!room) return;

    const { checkIn, checkOut, nights, guests, roomCount } = this.data;
    const total = this.calcTotal(room.price);

    const content =
      `房型：${room.name}\n` +
      `日期：${checkIn} - ${checkOut}（${nights}晚）\n` +
      `人数：${guests}  房间：${roomCount}\n` +
      `总价：¥ ${total}`;

    this.setData({ selectedRoom: room });

    wx.showModal({
      title: '确认预订',
      content,
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '预订成功（演示）', icon: 'success' });
        }
      }
    });
  },

  onPreviewMedia(e) {
    const idx = Number(e?.currentTarget?.dataset?.index);
    const { bannerMedias } = this.data;
    const i = Number.isFinite(idx) ? idx : 0;
    const list = Array.isArray(bannerMedias) ? bannerMedias : [];
    if (!list.length) return;

    const hasPreviewMedia = typeof wx.previewMedia === 'function';
    if (hasPreviewMedia) {
      const sources = list
        .filter((x) => x && x.url)
        .map((x) => ({
          url: x.url,
          type: x.type === 'video' ? 'video' : 'image',
        }));

      wx.previewMedia({
        sources,
        current: Math.min(Math.max(0, i), Math.max(0, sources.length - 1)),
      });
      return;
    }

    const images = list.filter((x) => x && x.type !== 'video' && x.url).map((x) => x.url);
    if (!images.length) return;
    const currentUrl = list[i] && list[i].type !== 'video' ? list[i].url : images[0];
    wx.previewImage({
      urls: images,
      current: currentUrl,
    });
  },

  normalizeMediaList(value) {
    if (!value) return [];

    // Prisma Json field may arrive as array/object, but in some cases could be a JSON string.
    if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v));

    if (typeof value === 'string') {
      const s = value.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map((v) => String(v));
        if (typeof parsed === 'string') return [parsed].filter(Boolean).map((v) => String(v));
        return [];
      } catch (e) {
        // treat as a single URL
        return [s];
      }
    }

    // Some backends may store as { list: [...] } or similar.
    if (typeof value === 'object') {
      const list = value.list || value.urls || value.items;
      if (Array.isArray(list)) return list.filter(Boolean).map((v) => String(v));
    }

    return [];
  },

  buildBannerMedias(hotel) {
    const images = this.normalizeMediaList(hotel?.images);
    const videos = this.normalizeMediaList(hotel?.videos);

    const medias = [];
    images.forEach((url) => medias.push({ type: 'image', url: this.toMediaProxyUrl(url) }));
    videos.forEach((url) => medias.push({ type: 'video', url: this.toMediaProxyUrl(url) }));
    return medias;
  },

  formatDistance(meters) {
    const d = Number(meters);
    if (!Number.isFinite(d) || d < 0) return '';
    if (d < 1000) return `${Math.round(d)}m`;
    return `${(d / 1000).toFixed(1)}km`;
  },

  buildMarkers(lng, lat) {
    if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) return [];
    return [
      {
        id: 1,
        longitude: Number(lng),
        latitude: Number(lat),
        width: 28,
        height: 28,
        callout: {
          content: '酒店位置',
          display: 'ALWAYS',
          padding: 6,
          borderRadius: 6
        }
      }
    ];
  },

  async fetchNearbyPois(lng, lat) {
    if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) {
      const poisExpanded = !!this.data.poisExpanded;
      this.setData({
        nearbySubway: [],
        nearbySubwayTop: [],
        nearbySubwayView: [],
        nearbyBus: [],
        nearbyBusTop: [],
        nearbyBusView: [],
        nearbyFood: [],
        nearbyFoodTop: [],
        nearbyFoodView: [],
        poisExpanded,
      });
      return;
    }

    this.setData({ poisLoading: true, poisError: '' });
    try {
      const q = (types) =>
        request({
          url: '/api/geo/nearby',
          method: 'GET',
          data: {
            lng: Number(lng),
            lat: Number(lat),
            radius: 3000,
            pageSize: 8,
            types
          }
        });

      const [subwayRes, busRes, foodRes] = await Promise.all([
        q('150500'),
        q('150700'),
        q('050100')
      ]);

      const pick = (res) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        return items
          .filter((x) => x && x.name)
          .map((x) => ({
            id: x.id,
            name: x.name,
            address: x.address,
            distance: x.distance,
            distanceText: this.formatDistance(x.distance),
            lng: x.lng,
            lat: x.lat
          }))
          .filter((x) => Number.isFinite(Number(x.lng)) && Number.isFinite(Number(x.lat)));
      };

      const nearbySubway = pick(subwayRes);
      const nearbySubwayTop = nearbySubway.slice(0, 1);
      const nearbyBus = pick(busRes);
      const nearbyBusTop = nearbyBus.slice(0, 1);
      const nearbyFood = pick(foodRes);
      const nearbyFoodTop = nearbyFood.slice(0, 1);

      const poisExpanded = !!this.data.poisExpanded;

      this.setData({
        nearbySubway,
        nearbySubwayTop,
        nearbySubwayView: poisExpanded ? nearbySubway : nearbySubwayTop,
        nearbyBus,
        nearbyBusTop,
        nearbyBusView: poisExpanded ? nearbyBus : nearbyBusTop,
        nearbyFood,
        nearbyFoodTop,
        nearbyFoodView: poisExpanded ? nearbyFood : nearbyFoodTop,
      });
    } catch (e) {
      this.setData({ poisError: e.message || '附近信息加载失败' });
    } finally {
      this.setData({ poisLoading: false });
    }
  },

  onTogglePois() {
    const next = !this.data.poisExpanded;
    const nearbySubwayView = next ? this.data.nearbySubway : this.data.nearbySubwayTop;
    const nearbyBusView = next ? this.data.nearbyBus : this.data.nearbyBusTop;
    const nearbyFoodView = next ? this.data.nearbyFood : this.data.nearbyFoodTop;
    this.setData({
      poisExpanded: next,
      nearbySubwayView,
      nearbyBusView,
      nearbyFoodView,
    });
  },

  onOpenPoiPanel() {
    this.setData({ poiPanelOpen: true });
  },

  onClosePoiPanel() {
    this.setData({ poiPanelOpen: false });
  },

  onOpenLocation() {
    const { lng, lat, hotel } = this.data;
    if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) return;
    wx.openLocation({
      longitude: Number(lng),
      latitude: Number(lat),
      name: hotel?.nameZh || hotel?.nameEn || '酒店',
      address: hotel?.address || ''
    });
  },

  onOpenPoiLocation(e) {
    const p = e?.currentTarget?.dataset || {};
    const lng = Number(p.lng);
    const lat = Number(p.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    wx.openLocation({
      longitude: lng,
      latitude: lat,
      name: p.name || '',
      address: p.address || ''
    });
  },

  toMediaProxyUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';

    // If already proxied.
    if (/\/api\/media\//.test(raw)) return raw;

    // Try to extract: http(s)://host/<bucket>/<objectName>
    const m = raw.match(/^https?:\/\/[^/]+\/([^/]+)\/(.+)$/);
    if (!m) return raw;

    const bucket = m[1];
    const objectName = m[2];

    const objectNameEncoded = objectName
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');

    const app = getApp();
    const baseURL = app?.globalData?.baseURL || 'http://localhost:3001';
    return `${baseURL}/api/media/${encodeURIComponent(bucket)}/${objectNameEncoded}`;
  },

  normalizeFacilities(facilities) {
    const val = facilities;
    if (Array.isArray(val)) return val.filter(Boolean);
    if (val && typeof val === 'object') {
      return Object.keys(val)
        .filter((k) => val[k])
        .map((k) => String(k));
    }
    return [];
  },

  async fetchDetail() {
    const { id } = this.data;
    this.setData({ error: '' });

    if (id === 'demo') {
      this.setData({
        hotel: {
          nameZh: '示例酒店（请先在商户端录入并管理员审核）',
          nameEn: 'Demo Hotel',
          address: '示例地址',
          star: 5,
          city: '上海',
          facilities: ['免费 WiFi', '停车场', '健身房', '早餐'],
          lng: 121.4737,
          lat: 31.2304
        },
        bannerMedias: [
          { type: 'image', url: 'https://images.unsplash.com/photo-1501117716987-c8e1ecb210ff?auto=format&fit=crop&w=1200&q=60' },
          { type: 'image', url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=60' },
        ],
        facilities: ['免费 WiFi', '停车场', '健身房', '早餐'],
        rooms: [{ id: 'r1', name: '标准间', price: 299 }]
      });
      const lng = 121.4737;
      const lat = 31.2304;
      this.setData({ lng, lat, markers: this.buildMarkers(lng, lat) });
      this.fetchNearbyPois(lng, lat);
      return;
    }

    try {
      const data = await request({ url: `/api/hotel/detail/${id}` });
      const hotel = data.hotel || {};
      const rooms = (data.rooms || []).slice().sort((a, b) => Number(a.price) - Number(b.price));
      const bannerMedias = this.buildBannerMedias(hotel);
      const facilities = this.normalizeFacilities(hotel.facilities);
      const lng = hotel?.lng;
      const lat = hotel?.lat;
      this.setData({ hotel, rooms, bannerMedias, facilities, lng, lat, markers: this.buildMarkers(lng, lat) });
      this.fetchNearbyPois(lng, lat);
    } catch (e) {
      this.setData({ error: e.message || '加载失败' });
    }
  }
});
