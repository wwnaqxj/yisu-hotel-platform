/**
 * 酒店查询首页
 * 城市选择改为固定列表选择（不再使用定位）
 * 创新点1：智能推荐标签（mock/hotels.js TAGS_BY_CITY）- 根据当前城市展示热门标签
 * 创新点2：快捷日期选项（components/mobile/calendar）- 今天入住、明天入住、本周周末
 */
const { getTagsByCity } = require('../../mock/hotels');
const { request } = require('../../utils/request');

function toAbsMediaUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';

  const app = getApp();
  const baseURLRaw = app?.globalData?.baseURL || 'https://yisuhotel.qxj123.xyz';
  const baseURL = String(baseURLRaw).replace(/^http:\/\//, 'https://').replace(/\/$/, '');

  if (/^https?:\/\//.test(raw)) return raw.replace(/^http:\/\//, 'https://');
  if (raw.startsWith('/api/media/')) return `${baseURL}${raw}`;
  return raw;
}

Page({
  data: {
    city: '',
    keyword: '',
    checkIn: '',
    checkOut: '',
    stars: [],
    priceMin: '',
    priceMax: '',
    tags: [],
    tagItems: [],
    bannerList: []
  },

  onLoad() {
    this.loadBanner();
    this.tagItems = getTagsByCity('');
    this.setData({ tagItems: this.tagItems });

    const store = getApp().getStore();
    const q = store.getQuery();
    const initCity = q.city || '北京';
    const stars = Array.isArray(q.stars) ? q.stars.map((v) => String(v)) : [];
    this.setData({
      city: initCity,
      keyword: q.keyword,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      stars,
      priceMin: q.priceMin === undefined || q.priceMin === '' ? '' : String(q.priceMin),
      priceMax: q.priceMax === undefined || q.priceMax === '' ? '' : String(q.priceMax),
      tags: q.tags || []
    });
    this.syncTagItemsByCity(initCity);

    if (!q.city) {
      store.setQuery({ city: initCity });
    }
  },

  async loadBanner() {
    try {
      const res = await request({
        url: '/api/hotel/list',
        method: 'GET',
        data: {
          page: 1,
          pageSize: 5
        }
      });
      const items = Array.isArray(res.items) ? res.items : [];
      const bannerList = items
        .filter((h) => h && h.id != null)
        .slice(0, 5)
        .map((h) => ({
          id: h.id,
          title: h.nameZh || h.nameEn || '',
          image: toAbsMediaUrl(Array.isArray(h.images) && h.images.length ? h.images[0] : '')
        }))
        .filter((item) => item.image && item.title);
      this.setData({ bannerList });
    } catch (e) {
      console.error('[home] loadBanner error:', e);
      this.setData({ bannerList: [] });
    }
  },

  syncTagItemsByCity(city) {
    const items = getTagsByCity(city);
    this.setData({ tagItems: items });
  },

  onCityPickerChange(e) {
    const city = e.detail.city || '';
    this.setData({ city });
    getApp().getStore().setQuery({ city });
    this.syncTagItemsByCity(city);
  },

  onKeywordInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    getApp().getStore().setQuery({ keyword });
  },

  onCalendarChange(e) {
    const { checkIn, checkOut } = e.detail;
    this.setData({ checkIn, checkOut });
    getApp().getStore().setQuery({ checkIn, checkOut });
  },

  onStarChange(e) {
    const stars = e.detail.value || [];
    this.setData({ stars });
    // 全局查询条件中仍然用数字数组，方便列表页解析
    const starNums = stars.map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n));
    getApp().getStore().setQuery({ stars: starNums });
  },

  // 双滑块价格区间变更
  onPriceRangeChange(e) {
    const { low, high } = e.detail || {};
    const min = Number(low || 0);
    const max = Number(high || 0);
    this.setData({ priceMin: min, priceMax: max });
    getApp().getStore().setQuery({
      priceMin: min,
      priceMax: max,
    });
  },

  onPriceMinInput(e) {
    const priceMin = e.detail.value;
    this.setData({ priceMin });
    getApp().getStore().setQuery({ priceMin: priceMin === '' ? '' : Number(priceMin) });
  },

  onPriceMaxInput(e) {
    const priceMax = e.detail.value;
    this.setData({ priceMax });
    getApp().getStore().setQuery({ priceMax: priceMax === '' ? '' : Number(priceMax) });
  },

  onTagsChange(e) {
    const tags = e.detail.value || [];
    this.setData({ tags });
    getApp().getStore().setQuery({ tags });
  },

  onSearch() {
    const { city, keyword, checkIn, checkOut, stars, priceMin, priceMax, tags } = this.data;
    const starNums = (stars || []).map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n));
    getApp().getStore().setQuery({
      city,
      keyword,
      checkIn,
      checkOut,
      stars: starNums,
      priceMin: priceMin === '' ? '' : Number(priceMin),
      priceMax: priceMax === '' ? '' : Number(priceMax),
      tags: tags || []
    });

    const q = [];
    if (city) q.push('city=' + encodeURIComponent(city));
    if (keyword) q.push('keyword=' + encodeURIComponent(keyword));
    if (checkIn) q.push('checkIn=' + encodeURIComponent(checkIn));
    if (checkOut) q.push('checkOut=' + encodeURIComponent(checkOut));
    if (stars && stars.length) q.push('stars=' + encodeURIComponent(stars.join(',')));
    if (priceMin !== '') q.push('priceMin=' + encodeURIComponent(priceMin));
    if (priceMax !== '') q.push('priceMax=' + encodeURIComponent(priceMax));
    if (tags && tags.length) q.push('tags=' + encodeURIComponent(tags.join(',')));

    wx.navigateTo({
      url: '/pages/list/index?' + q.join('&')
    });
  }
});
