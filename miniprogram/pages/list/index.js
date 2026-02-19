const { request } = require('../../utils/request');

Page({
  data: {
    query: {
      city: '',
      keyword: '',
      checkIn: '',
      checkOut: ''
    },
    nights: 0,
    page: 1,
    pageSize: 10,
    items: [],
    loading: false,
    hasMore: true,
    error: '',
    activeFilter: ''
  },

  onLoad(options) {
    const query = {
      city: options.city ? decodeURIComponent(options.city) : '',
      keyword: options.keyword ? decodeURIComponent(options.keyword) : '',
      checkIn: options.checkIn ? decodeURIComponent(options.checkIn) : '',
      checkOut: options.checkOut ? decodeURIComponent(options.checkOut) : ''
    };

    // Calculate nights
    let nights = 0;
    if (query.checkIn && query.checkOut) {
      const start = new Date(query.checkIn);
      const end = new Date(query.checkOut);
      const diff = end - start;
      if (diff > 0) {
        nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
    }

    this.setData({ query, nights });
    this.resetAndLoad();
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
      const { query, page, pageSize } = this.data;
      const data = await request({
        url: '/api/hotel/list',
        method: 'GET',
        data: {
          city: query.city,
          keyword: query.keyword,
          page,
          pageSize
        }
      });

      const next = (data.items || []);
      // If current page items < pageSize, no more data
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

  onFilterTap(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      activeFilter: this.data.activeFilter === type ? '' : type
    });
    // Here you would implement actual filtering logic or show a popup
    if (type === 'sort') {
      wx.showToast({ title: '按推荐排序', icon: 'none' });
    } else if (type === 'price') {
      wx.showToast({ title: '筛选价格', icon: 'none' });
    }
  },

  onSearchTap() {
    wx.navigateBack();
  }
});
