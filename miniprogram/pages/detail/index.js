const { request } = require('../../utils/request');

Page({
  data: {
    id: '',
    hotel: {},
    rooms: [],
    error: ''
  },

  onLoad(options) {
    const id = options.id || 'demo';
    this.setData({ id });
    this.fetchDetail();
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
          star: 5
        },
        rooms: [{ id: 'r1', name: '标准间', price: 299 }]
      });
      return;
    }

    try {
      const data = await request({ url: `/api/hotel/detail/${id}` });
      const rooms = (data.rooms || []).slice().sort((a, b) => Number(a.price) - Number(b.price));
      this.setData({ hotel: data.hotel || {}, rooms });
    } catch (e) {
      this.setData({ error: e.message || '加载失败' });
    }
  }
});
