const { request } = require('../../utils/request');

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

// enrich raw hotel item from API
function enrichItem(h) {
  const starArr = Array.from({ length: h.star || 0 }, (_, i) => i);
  const topFacilities = Array.isArray(h.facilities) ? h.facilities.slice(0, 3) : [];
  return {
    ...h,
    starArr,
    topFacilities,
    scoreLabel: scoreLabel(h.score || 0),
    reviewCount: Math.floor(100 + (h.id || 1) * 37) % 900 + 100, // pseudo count
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

    // Filters
    cities: ['北京', '上海', '广州', '深圳', '成都', '杭州'],
    priceRanges: [
      { label: '¥200以下', min: 0, max: 200 },
      { label: '¥200-500', min: 200, max: 500 },
      { label: '¥500-1000', min: 500, max: 1000 },
      { label: '¥1000-2000', min: 1000, max: 2000 },
      { label: '¥2000以上', min: 2000, max: 99999 },
    ],
    selectedPriceRange: null,
    selectedStar: null,

    facilities: ['免费WiFi', '含早餐', '停车场', '游泳池', '健身房', '水疗中心', '24小时前台', '接送机', '可退款'],
    selectedFacilities: [],
  },

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onLoad(options) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = options.checkIn || toYmd(today);
    const checkOut = options.checkOut || toYmd(tomorrow);
    const city = options.city ? decodeURIComponent(options.city) : '北京';
    const keyword = options.keyword ? decodeURIComponent(options.keyword) : '';

    this.setData({
      query: {
        city, keyword,
        checkIn, checkOut,
        checkInShort: toShort(checkIn),
        checkOutShort: toShort(checkOut),
      },
      nights: calcNights(checkIn, checkOut),
    });
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
      const { query, page, pageSize, currentSort, selectedPriceRange, selectedStar, selectedFacilities } = this.data;

      const params = {
        city: query.city,
        keyword: query.keyword,
        page,
        pageSize,
        sort: currentSort,
      };
      if (selectedPriceRange) {
        params.minPrice = selectedPriceRange.min;
        params.maxPrice = selectedPriceRange.max;
      }
      if (selectedStar) params.star = selectedStar;
      if (selectedFacilities && selectedFacilities.length) {
        params.facilities = selectedFacilities.join(',');
      }

      const data = await request({ url: '/api/hotel/list', method: 'GET', data: params });

      const next = (data.items || []).map(enrichItem);
      const hasMore = next.length >= pageSize;

      this.setData({
        items: this.data.items.concat(next),
        total: data.total || 0,
        page: page + 1,
        hasMore,
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
    wx.navigateTo({ url: `/pages/detail/index?id=${e.currentTarget.dataset.id}` });
  },

  // ── City / Date ───────────────────────────────────────────────────────────
  onCityChange(e) {
    const city = this.data.cities[e.detail.value];
    this.setData({ 'query.city': city });
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

  // Star
  onStarSelect(e) {
    const star = e.currentTarget.dataset.star;
    this.setData({ selectedStar: this.data.selectedStar === star ? null : star });
  },

  resetPriceStar() {
    this.setData({ selectedPriceRange: null, selectedStar: null });
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
