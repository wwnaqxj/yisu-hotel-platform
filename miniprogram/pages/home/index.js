/**
 * 酒店查询首页
 * 创新点1：定位失败兜底（utils/location.js）- 失败时使用兜底城市并提示
 * 创新点2：智能推荐标签（mock/hotels.js TAGS_BY_CITY）- 根据当前城市展示热门标签
 * 创新点3：快捷日期选项（components/mobile/calendar）- 今天入住、明天入住、本周周末
 */
const { getCurrentCity } = require('../../utils/location');
const { getBannerList, getTagsByCity } = require('../../mock/hotels');

Page({
  data: {
    city: '',
    locationStatus: 'loading',
    locationError: '',
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
    this.bannerList = getBannerList();
    this.setData({ bannerList: this.bannerList });
    this.tagItems = getTagsByCity('');
    this.setData({ tagItems: this.tagItems });

    const store = getApp().getStore();
    const q = store.getQuery();
    this.setData({
      city: q.city,
      keyword: q.keyword,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      stars: q.stars || [],
      priceMin: q.priceMin === undefined || q.priceMin === '' ? '' : String(q.priceMin),
      priceMax: q.priceMax === undefined || q.priceMax === '' ? '' : String(q.priceMax),
      tags: q.tags || []
    });
    this.syncTagItemsByCity(this.data.city);
    this.tryLocation();
  },

  onRelocate() {
    this.tryLocation();
  },

  tryLocation() {
    this.setData({ locationStatus: 'loading', locationError: '' });
    getCurrentCity().then((res) => {
      const store = getApp().getStore();
      if (res.status === 'success') {
        store.setQuery({ city: res.city });
        this.setData({
          city: res.city,
          locationStatus: 'success',
          locationError: ''
        });
      } else {
        store.setQuery({ city: res.city });
        this.setData({
          city: res.city,
          locationStatus: 'fail',
          locationError: res.error || '定位失败，已默认选择北京'
        });
      }
      this.syncTagItemsByCity(this.data.city);
    });
  },

  syncTagItemsByCity(city) {
    const items = getTagsByCity(city);
    this.setData({ tagItems: items });
  },

  onCityInput(e) {
    const city = e.detail.value;
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
    const stars = e.detail.value.map((v) => parseInt(v, 10));
    this.setData({ stars });
    getApp().getStore().setQuery({ stars });
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
    getApp().getStore().setQuery({
      city,
      keyword,
      checkIn,
      checkOut,
      stars: stars || [],
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
