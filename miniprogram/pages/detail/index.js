const { request } = require('../../utils/request');

Page({
  data: {
    id: '',
    hotel: {},
    rooms: [],
    error: '',

    navTop: 0,
    navHeight: 44,

    bannerImages: [],
    facilities: [],

    checkIn: '',
    checkOut: '',
    nights: 1,
    guests: 2,
    roomCount: 1,

    today: ''
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
      const navTop = menu.top;
      const navHeight = menu.height + (menu.top - sys.statusBarHeight) * 2;
      this.setData({ navTop, navHeight });
    } catch (e) {
      this.setData({ navTop: 0, navHeight: 44 });
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

  normalizeImages(images) {
    const val = images;
    if (Array.isArray(val)) return val.filter(Boolean);
    return [];
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
          facilities: ['免费 WiFi', '停车场', '健身房', '早餐']
        },
        bannerImages: [
          'https://images.unsplash.com/photo-1501117716987-c8e1ecb210ff?auto=format&fit=crop&w=1200&q=60',
          'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=60'
        ],
        facilities: ['免费 WiFi', '停车场', '健身房', '早餐'],
        rooms: [{ id: 'r1', name: '标准间', price: 299 }]
      });
      return;
    }

    try {
      const data = await request({ url: `/api/hotel/detail/${id}` });
      const hotel = data.hotel || {};
      const rooms = (data.rooms || []).slice().sort((a, b) => Number(a.price) - Number(b.price));
      const bannerImages = this.normalizeImages(hotel.images);
      const facilities = this.normalizeFacilities(hotel.facilities);
      this.setData({ hotel, rooms, bannerImages, facilities });
    } catch (e) {
      this.setData({ error: e.message || '加载失败' });
    }
  }
});
