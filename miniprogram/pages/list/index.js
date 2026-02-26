/**
 * 酒店列表页：与首页查询条件联动（URL 参数 + 全局 Store）
 * 接口仅支持 city/keyword/page/pageSize，星级与价格在前端筛选、排序
 */
const { request } = require('../../utils/request');

const PRICE_RANGES = [
  { label: '¥50-200', min: 50, max: 200 },
  { label: '¥200-500', min: 200, max: 500 },
  { label: '¥500-800', min: 500, max: 800 },
  { label: '¥800-1000', min: 800, max: 1000 },
];
// ─── Helpers ────────────────────────────────────────────────────────────────
function toYmd(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toShort(ymd) {
  if (!ymd) return '';
  const [, m, d] = ymd.split('-');
  return `${Number(m)}月${Number(d)}日`;
}

function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut) - new Date(checkIn);
  return diff > 0 ? Math.ceil(diff / 86400000) : 1;
}

function scoreLabel(score) {
  if (score >= 4.8) return '口碑极佳';
  if (score >= 4.6) return '好评如潮';
  if (score >= 4.4) return '值得住';
  if (score >= 4.0) return '评价良好';
  return '总体不错';
}

function decodeOpt(options, key) {
  const v = options[key];
  return v ? decodeURIComponent(v) : '';
}

function priceRangeFromMinMax(priceMin, priceMax) {
  if (priceMin == null || priceMin === '' || priceMax == null || priceMax === '') return null;
  const min = Number(priceMin);
  const max = Number(priceMax);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return PRICE_RANGES.find((r) => r.min === min && r.max === max) || { label: `¥${min}-${max}`, min, max };
}

function enrichItem(h) {
  const starArr = Array.from({ length: h.star || 0 }, (_, i) => i);
  const topFacilities = Array.isArray(h.facilities) ? h.facilities.slice(0, 3) : [];
  const price = Number(h.minPrice ?? h.price ?? 0);
  const score = h.score != null ? Number(h.score) : null;
  return {
    ...h,
    starArr,
    topFacilities: topFacilities.length ? topFacilities : [],
    cardImage: (h.images && h.images[0]) || '',
    minPrice: price,
    score,
    scoreLabel: score != null ? scoreLabel(score) : '',
    reviewCount: Math.floor(100 + (h.id || 1) * 37) % 900 + 100,
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────
Page({
  data: {
    // Query params
    query: { city: '', keyword: '', checkIn: '', checkOut: '', checkInShort: '', checkOutShort: '' },
    nights: 1,
    total: 0,

    // Pagination
    page: 1,
    pageSize: 10,
    items: [],
    loading: false,
    hasMore: true,
    error: '',

    // UI
    activeFilter: '',
    showSearchInput: false,

    // Sort
    sortOptions: [
      { key: 'default', label: '智能推荐' },
      { key: 'score_desc', label: '评分最高' },
      { key: 'price_asc', label: '价格从低到高' },
      { key: 'price_desc', label: '价格从高到低' },
    ],
    currentSort: 'default',
    currentSortLabel: '智能推荐',

    // Filters（与首页查询条件一致，可从 URL 恢复）
    priceRanges: PRICE_RANGES,
    selectedPriceRange: null,
    selectedStars: [],        // 数字数组，用于实际筛选
    selectedStarValues: [],   // 字符串数组，用于 UI 高亮
    selectedStarsMap: {},     // { [star]: true }，用于 WXML 高亮判断

    facilities: ['免费WiFi', '含早餐', '停车场', '游泳池', '健身房', '水疗中心', '24小时前台', '接送机', '可退款'],
    selectedFacilities: [],
  },

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onLoad(options) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = decodeOpt(options, 'checkIn') || toYmd(today);
    const checkOut = decodeOpt(options, 'checkOut') || toYmd(tomorrow);
    const city = decodeOpt(options, 'city') || '北京';
    const keyword = decodeOpt(options, 'keyword') || '';

    const starsStr = decodeOpt(options, 'stars');
    const tagsStr = decodeOpt(options, 'tags');
    const stars = starsStr
      ? starsStr
          .split(',')
          .map((s) => parseInt(s, 10))
          .filter((n) => Number.isFinite(n))
      : [];
    const tags = tagsStr ? tagsStr.split(',') : [];
    const priceMin = options.priceMin !== undefined && options.priceMin !== '' ? Number(options.priceMin) : '';
    const priceMax = options.priceMax !== undefined && options.priceMax !== '' ? Number(options.priceMax) : '';

    const selectedStars = stars;
    const selectedStarValues = stars.map((n) => String(n));
    const selectedStarsMap = {};
    selectedStars.forEach((n) => {
      if (Number.isFinite(n)) selectedStarsMap[n] = true;
    });
    const selectedPriceRange = priceRangeFromMinMax(priceMin, priceMax);
    const facilitySet = this.data.facilities;
    const selectedFacilities = tags.filter((t) => facilitySet.indexOf(t) >= 0);

    const store = getApp().getStore();
    store.setQuery({
      city, keyword, checkIn, checkOut,
      stars, priceMin: priceMin === '' ? '' : priceMin, priceMax: priceMax === '' ? '' : priceMax, tags,
    });

    this.setData({
      query: {
        city, keyword,
        checkIn, checkOut,
        checkInShort: toShort(checkIn),
        checkOutShort: toShort(checkOut),
      },
      nights: calcNights(checkIn, checkOut),
      selectedStars,
      selectedStarValues,
      selectedStarsMap,
      selectedPriceRange,
      selectedFacilities,
    });

    // #region agent-log onLoad-star-init
    (function () {
      const payload = {
        sessionId: '741122',
        runId: 'initial',
        hypothesisId: 'H1',
        location: 'miniprogram/pages/list/index.js:onLoad',
        message: 'after onLoad init selectedStars/selectedStarValues',
        data: { selectedStars, selectedStarValues, selectedStarsMap },
        timestamp: Date.now(),
      };
      const url = 'http://127.0.0.1:7658/ingest/4becd920-19ad-436d-84eb-b1247b52220f';
      const headers = { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '741122' };
      if (typeof fetch === 'function') {
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }).catch(() => {});
      } else if (typeof wx !== 'undefined' && wx.request) {
        wx.request({
          url,
          method: 'POST',
          data: payload,
          header: headers,
          fail: () => {},
        });
      }
    })();
    // #endregion agent-log onLoad-star-init
    this.resetAndLoad();
  },

  onPullDownRefresh() {
    this.resetAndLoad().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMore();
  },

  // ── Load Data ─────────────────────────────────────────────────────────────
  async resetAndLoad() {
    this.setData({ page: 1, items: [], hasMore: true, error: '', total: 0 });
    await this.loadMore();
  },

  async loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true, error: '' });

    try {
      const { query, page, pageSize, currentSort, selectedPriceRange, selectedStars, selectedFacilities } = this.data;
      const params = { city: query.city, keyword: query.keyword, page, pageSize };

      const data = await request({ url: '/api/hotel/list', method: 'GET', data: params });
      const raw = data.items || [];

      let next = raw
        .filter((h) => {
          if (selectedStars && selectedStars.length) {
            const starNum = Number(h.star);
            if (!selectedStars.includes(starNum)) return false;
          }
          const p = Number(h.minPrice ?? h.price ?? 0);
          if (selectedPriceRange && (p < selectedPriceRange.min || p > selectedPriceRange.max)) return false;
          if (selectedFacilities && selectedFacilities.length) {
            const fs = Array.isArray(h.facilities) ? h.facilities : [];
            return selectedFacilities.every((f) => fs.indexOf(f) >= 0);
          }
          return true;
        })
        .map(enrichItem);

      if (currentSort === 'price_asc') next = next.sort((a, b) => a.minPrice - b.minPrice);
      else if (currentSort === 'price_desc') next = next.sort((a, b) => b.minPrice - a.minPrice);
      else if (currentSort === 'score_desc') next = next.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      this.setData({
        items: this.data.items.concat(next),
        total: (this.data.total || 0) + next.length,
        page: page + 1,
        hasMore: raw.length >= pageSize,
      });
    } catch (e) {
      console.error('[list] loadMore error:', e);
      this.setData({ error: e.message || '加载失败，请检查网络' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  onItemTap(e) {
    const id = e.currentTarget.dataset.id;
    const { checkIn, checkOut } = this.data.query;
    let url = `/pages/detail/index?id=${id}`;
    if (checkIn) url += `&checkIn=${encodeURIComponent(checkIn)}`;
    if (checkOut) url += `&checkOut=${encodeURIComponent(checkOut)}`;
    wx.navigateTo({ url });
  },

  // ── City / Date ───────────────────────────────────────────────────────────
  onCityChange(e) {
    const city = e.detail.city || '';
    this.setData({ 'query.city': city });
    getApp().getStore().setQuery({ city });
    this.resetAndLoad();
  },

  onCheckInChange(e) {
    const checkIn = e.detail.value;
    let { checkOut } = this.data.query;
    if (new Date(checkIn) >= new Date(checkOut)) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + 1);
      checkOut = toYmd(d);
    }
    this.setData({
      'query.checkIn': checkIn,
      'query.checkOut': checkOut,
      'query.checkInShort': toShort(checkIn),
      'query.checkOutShort': toShort(checkOut),
      nights: calcNights(checkIn, checkOut),
    });
    this.resetAndLoad();
  },

  onCheckOutChange(e) {
    const checkOut = e.detail.value;
    const { checkIn } = this.data.query;
    if (new Date(checkOut) <= new Date(checkIn)) {
      wx.showToast({ title: '离店不能早于入住', icon: 'none' });
      return;
    }
    this.setData({
      'query.checkOut': checkOut,
      'query.checkOutShort': toShort(checkOut),
      nights: calcNights(checkIn, checkOut),
    });
    this.resetAndLoad();
  },

  // ── Search ────────────────────────────────────────────────────────────────
  openSearch() {
    this.setData({ showSearchInput: true, activeFilter: '' });
  },
  closeSearch() {
    this.setData({ showSearchInput: false });
  },
  clearKeyword() {
    this.setData({ 'query.keyword': '' });
    this.resetAndLoad();
  },
  onSearchInput(e) {
    this.setData({ 'query.keyword': e.detail.value });
  },
  onSearchConfirm() {
    this.setData({ showSearchInput: false });
    this.resetAndLoad();
  },
  noop() { },

  // ── Filter Panels ─────────────────────────────────────────────────────────
  onFilterTap(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ activeFilter: this.data.activeFilter === type ? '' : type });
  },
  closeFilter() {
    this.setData({ activeFilter: '' });
  },

  // Sort
  onSortSelect(e) {
    const { sort, label } = e.currentTarget.dataset;
    this.setData({ currentSort: sort, currentSortLabel: label, activeFilter: '' });
    this.resetAndLoad();
  },

  // Price
  onPriceSelect(e) {
    const range = this.data.priceRanges[e.currentTarget.dataset.index];
    const same = this.data.selectedPriceRange && this.data.selectedPriceRange.label === range.label;
    this.setData({ selectedPriceRange: same ? null : range });
  },

  // 双滑块价格筛选
  onFilterPriceRangeChange(e) {
    const { low, high } = e.detail || {};
    const min = Number(low || 0);
    const max = Number(high || 0);
    this.setData({
      selectedPriceRange: { label: `¥${min}-${max}`, min, max },
    });
  },

  // Star
  onStarSelect(e) {
    const star = Number(e.currentTarget.dataset.star);
    if (!Number.isFinite(star)) return;

    const prevMap = this.data.selectedStarsMap || {};
    const beforeMap = Object.assign({}, prevMap);
    const map = Object.assign({}, prevMap);
    if (map[star]) {
      delete map[star];
    } else {
      map[star] = true;
    }
    const selectedStars = Object.keys(map)
      .map((k) => parseInt(k, 10))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const selectedStarValues = selectedStars.map((n) => String(n));

    // #region agent-log star-click-before
    (function (star, selectedStarValues, selectedStars, selectedStarsMap) {
      const payload = {
        sessionId: '741122',
        runId: 'initial',
        hypothesisId: 'H2',
        location: 'miniprogram/pages/list/index.js:onStarSelect',
        message: 'before toggle star',
        data: {
          star,
          selectedStarValues,
          selectedStars,
          selectedStarsMap,
        },
        timestamp: Date.now(),
      };
      const url = 'http://127.0.0.1:7658/ingest/4becd920-19ad-436d-84eb-b1247b52220f';
      const headers = { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '741122' };
      if (typeof fetch === 'function') {
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }).catch(() => {});
      } else if (typeof wx !== 'undefined' && wx.request) {
        wx.request({
          url,
          method: 'POST',
          data: payload,
          header: headers,
          fail: () => {},
        });
      }
    })(star, this.data.selectedStarValues, this.data.selectedStars, beforeMap);
    // #endregion agent-log star-click-before

    this.setData({ selectedStarsMap: map, selectedStars, selectedStarValues });

    // #region agent-log star-click-after
    (function (star, selectedStarValues, selectedStars, selectedStarsMap) {
      const payload = {
        sessionId: '741122',
        runId: 'initial',
        hypothesisId: 'H2',
        location: 'miniprogram/pages/list/index.js:onStarSelect',
        message: 'after toggle star',
        data: {
          star,
          selectedStarValues,
          selectedStars,
          selectedStarsMap,
        },
        timestamp: Date.now(),
      };
      const url = 'http://127.0.0.1:7658/ingest/4becd920-19ad-436d-84eb-b1247b52220f';
      const headers = { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '741122' };
      if (typeof fetch === 'function') {
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }).catch(() => {});
      } else if (typeof wx !== 'undefined' && wx.request) {
        wx.request({
          url,
          method: 'POST',
          data: payload,
          header: headers,
          fail: () => {},
        });
      }
    })(star, selectedStarValues, selectedStars, map);
    // #endregion agent-log star-click-after
  },

  resetPriceStar() {
    this.setData({ selectedPriceRange: null, selectedStars: [], selectedStarValues: [], selectedStarsMap: {} });
  },

  // Facilities
  toggleFacility(e) {
    const fac = this.data.facilities[e.currentTarget.dataset.index];
    const set = new Set(this.data.selectedFacilities);
    set.has(fac) ? set.delete(fac) : set.add(fac);
    this.setData({ selectedFacilities: Array.from(set) });
  },
  resetMore() {
    this.setData({ selectedFacilities: [] });
  },

  applyFilter() {
    this.setData({ activeFilter: '' });
    this.resetAndLoad();
  },
});

