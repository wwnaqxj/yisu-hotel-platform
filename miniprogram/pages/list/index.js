const { request } = require('../../utils/request');

Page({
  data: {
    query: {
      city: '',
      keyword: '',
      checkIn: '',
      checkOut: ''
    },
    page: 1,
    pageSize: 10,
    items: [],
    loading: false,
    hasMore: true,
    error: ''
  },

  onLoad(options) {
    const query = {
      city: options.city ? decodeURIComponent(options.city) : '',
      keyword: options.keyword ? decodeURIComponent(options.keyword) : '',
      checkIn: options.checkIn ? decodeURIComponent(options.checkIn) : '',
      checkOut: options.checkOut ? decodeURIComponent(options.checkOut) : ''
    };
    this.setData({ query });
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
      this.setData({
        items: this.data.items.concat(next),
        page: page + 1,
        hasMore: next.length > 0
      });
    } catch (e) {
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
  }
});
