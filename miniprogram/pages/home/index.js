Page({
  data: {
    city: '',
    keyword: '',
    checkIn: '',
    checkOut: ''
  },

  onCityInput(e) {
    this.setData({ city: e.detail.value });
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onCheckInChange(e) {
    this.setData({ checkIn: e.detail.value });
  },

  onCheckOutChange(e) {
    this.setData({ checkOut: e.detail.value });
  },

  onSearch() {
    const { city, keyword, checkIn, checkOut } = this.data;
    wx.navigateTo({
      url: `/pages/list/index?city=${encodeURIComponent(city)}&keyword=${encodeURIComponent(keyword)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
    });
  },

  onBannerTap() {
    wx.navigateTo({ url: '/pages/detail/index?id=demo' });
  }
});
