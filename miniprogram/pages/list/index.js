const { request } = require('../../utils/request');

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

Page({
  data: {
    query: {
      city: '',
      keyword: '',
      checkIn: '',
      checkOut: '',
      checkInShort: '',
      checkOutShort: ''
    },
    nights: 1,
    page: 1,
    pageSize: 15,
    items: [],
    loading: false,
    hasMore: true,
    error: '',

    // Filter UI State
    activeFilter: '', // 'sort', 'priceStar', 'more'
    currentSort: 'default',
    currentSortLabel: '推荐排序',

    // Price & Star State
    priceRanges: [
      { label: '¥150以下', min: 0, max: 150 },
      { label: '¥150-300', min: 150, max: 300 },
      { label: '¥301-450', min: 301, max: 450 },
      { label: '¥451-600', min: 451, max: 600 },
      { label: '¥600-1000', min: 600, max: 1000 },
      { label: '¥1000以上', min: 1000, max: 99999 }
    ],
    selectedPriceRange: null,
    selectedStar: null, // 3, 4, 5
    // City / Search / Date pickers
    cities: ['北京', '上海', '广州', '深圳', '杭州'],
    showSearchInput: false,
    facilities: ['免费WiFi', '含早餐', '停车场', '游泳池', '健身房', '可退款'],
    selectedFacilities: [],
  },

  onLoad(options) {
    // Initialize dates (Default: Today -> Tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = options.checkIn || today.toISOString().split('T')[0];
    const checkOut = options.checkOut || tomorrow.toISOString().split('T')[0];

    const query = {
      city: options.city ? decodeURIComponent(options.city) : '北京', // Default city for demo
      keyword: options.keyword ? decodeURIComponent(options.keyword) : '',
      checkIn,
      checkOut,
      checkInShort: formatDateShort(checkIn),
      checkOutShort: formatDateShort(checkOut)
    };

    // Calculate nights
    let nights = 1;
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diff = end - start;
      if (diff > 0) {
        nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
    }

    this.setData({ query, nights });
    this.resetAndLoad();

    // If opened with ?debug=1, automatically fetch and print full API result for debugging
    if (options && (options.debug === '1' || options._debug === '1')) {
      this.debugFetchList();
    }
  },

  async debugFetchList() {
    try {
      const { query, pageSize } = this.data;
      const params = {
        city: query.city,
        keyword: query.keyword,
        page: 1,
        pageSize: pageSize || 15,
        sort: this.data.currentSort || 'default'
      };
      if (this.data.selectedPriceRange) {
        params.minPrice = this.data.selectedPriceRange.min;
        params.maxPrice = this.data.selectedPriceRange.max;
      }
      if (this.data.selectedStar) params.star = this.data.selectedStar;
      if (this.data.selectedFacilities && this.data.selectedFacilities.length) params.facilities = this.data.selectedFacilities.join(',');

      console.log('[debugFetchList] 请求参数：', params);
      const res = await request({ url: '/api/hotel/list', method: 'GET', data: params });
      console.log('[debugFetchList] 返回结果：', res);
      // expose result in data for quick UI inspection if desired
      this.setData({ debugResult: JSON.stringify(res, null, 2) });
      wx.showToast({ title: '已打印接口结果到控制台', icon: 'none', duration: 2000 });
    } catch (err) {
      console.error('[debugFetchList] 错误：', err);
      wx.showToast({ title: '调试请求出错，查看控制台', icon: 'none' });
    }
  },

  onCityChange(e) {
    const idx = e.detail.value;
    const city = this.data.cities[idx] || this.data.query.city;
    const query = Object.assign({}, this.data.query, { city });
    this.setData({ query });
    this.resetAndLoad();
  },

  onCheckInChange(e) {
    const checkIn = e.detail.value;
    const checkInShort = formatDateShort(checkIn);
    const query = Object.assign({}, this.data.query, { checkIn, checkInShort });
    // recalc nights
    let nights = this.data.nights || 1;
    if (query.checkIn && query.checkOut) {
      const s = new Date(query.checkIn);
      const t = new Date(query.checkOut);
      const diff = t - s;
      if (diff > 0) nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    this.setData({ query, nights });
    this.resetAndLoad();
  },

  onCheckOutChange(e) {
    const checkOut = e.detail.value;
    const checkOutShort = formatDateShort(checkOut);
    const query = Object.assign({}, this.data.query, { checkOut, checkOutShort });
    // recalc nights
    let nights = this.data.nights || 1;
    if (query.checkIn && query.checkOut) {
      const s = new Date(query.checkIn);
      const t = new Date(query.checkOut);
      const diff = t - s;
      if (diff > 0) nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    this.setData({ query, nights });
    this.resetAndLoad();
  },

  openSearch() {
    this.setData({ showSearchInput: true });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ 'query.keyword': keyword });
  },

  onSearchConfirm() {
    this.setData({ showSearchInput: false });
    this.resetAndLoad();
  },

  toggleFacility(e) {
    const idx = e.currentTarget.dataset.index;
    const fac = this.data.facilities[idx];
    const list = new Set(this.data.selectedFacilities || []);
    if (list.has(fac)) list.delete(fac); else list.add(fac);
    this.setData({ selectedFacilities: Array.from(list) });
  },

  async resetAndLoad() {
    this.setData({ page: 1, items: [], hasMore: true, error: '' });
    await this.loadMore();
  },

  async loadMore() {
    if (this.data.loading) return;
    if (!this.data.hasMore) return;

    this.setData({ loading: true, error: '' });
    try {
      const { query, page, pageSize, currentSort, selectedPriceRange, selectedStar } = this.data;

      const params = {
        city: query.city,
        keyword: query.keyword,
        page,
        pageSize,
        sort: currentSort
      };

      if (selectedPriceRange) {
        params.minPrice = selectedPriceRange.min;
        params.maxPrice = selectedPriceRange.max;
      }
      if (this.data.selectedFacilities && this.data.selectedFacilities.length) {
        params.facilities = this.data.selectedFacilities.join(',');
      }
      if (selectedStar) {
        params.star = selectedStar; // 3, 4, 5. Backend handles 'in' logic if comma separated, or single value.
        // If we want "3 star and above" logic, we might need to send 3,4,5.
        // For now, let's assume exact match or the backend logic I wrote supports "comma".
        // If UI implies "X star", usually it's strict. If "X and above", we logic it here.
        // Let's implement "X and above" simply by sending the value, if backend filters exact.
        // Wait, my backend implementation uses `in`. So if I select 3, it shows only 3.
        // I will change UI to multiselect or just single select for simplicity.
        // User request: "Custom definition".
        // I'll stick to single select for UI simplicity: "Select 5 star" -> shows 5 star.
      }

      const data = await request({
        url: '/api/hotel/list',
        method: 'GET',
        data: params
      });

      const next = (data.items || []);
      const hasMore = next.length >= pageSize && page < (data.totalPages || 9999);

      this.setData({
        items: this.data.items.concat(next),
        page: page + 1,
        hasMore
      });
    } catch (e) {
      console.error(e);
      this.setData({ error: e.message || '加载失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onReachBottom() {
    this.loadMore();
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/index?id=${id}` });
  },

  // --- Filter Logic ---

  onFilterTap(e) {
    const type = e.currentTarget.dataset.type;
    if (this.data.activeFilter === type) {
      this.setData({ activeFilter: '' }); // Toggle off
    } else {
      this.setData({ activeFilter: type });
    }
  },

  closeFilter() {
    this.setData({ activeFilter: '' });
  },

  onSortSelect(e) {
    const sort = e.currentTarget.dataset.sort;
    let label = '推荐排序';
    if (sort === 'price_asc') label = '价格低到高';
    if (sort === 'price_desc') label = '价格高到低';
    if (sort === 'score_desc') label = '评分高到低';

    this.setData({
      currentSort: sort,
      currentSortLabel: label,
      activeFilter: ''
    });
    this.resetAndLoad();
  },

  onPriceRangeSelect(e) {
    const index = e.currentTarget.dataset.index;
    const range = this.data.priceRanges[index];
    // Toggle
    if (this.data.selectedPriceRange && this.data.selectedPriceRange.label === range.label) {
      this.setData({ selectedPriceRange: null });
    } else {
      this.setData({ selectedPriceRange: range });
    }
  },

  onStarSelect(e) {
    const star = e.currentTarget.dataset.star;
    // Toggle
    if (this.data.selectedStar === star) {
      this.setData({ selectedStar: null });
    } else {
      this.setData({ selectedStar: star });
    }
  },

  resetFilter() {
    this.setData({
      selectedPriceRange: null,
      selectedStar: null,
      selectedFacilities: []
    });
  },

  applyFilter() {
    this.setData({ activeFilter: '' });
    this.resetAndLoad();
  },

  onCityTap() {
    // For demo, maybe just show a toast or navigate to city list
    wx.showToast({ title: '切换城市功能待实现', icon: 'none' });
  },

  onDateTap() {
    // For demo
    wx.showToast({ title: '修改日期功能待实现', icon: 'none' });
  },

  onSearchTap() {
    wx.showToast({ title: '搜索已点击', icon: 'none' });
  },

  onPullDownRefresh() {
    this.resetAndLoad()
      .then(() => {
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        wx.stopPullDownRefresh();
      });
  }
});
