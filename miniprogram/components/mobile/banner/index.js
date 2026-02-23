Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },

  methods: {
    onItemTap(e) {
      const item = e.currentTarget.dataset.item;
      const id = item && (item.id != null) ? item.id : 'demo';
      wx.navigateTo({ url: `/pages/detail/index?id=${id}` });
    }
  }
});
