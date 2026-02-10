function request({ url, method = 'GET', data, header }) {
  const app = getApp();
  const baseURL = app?.globalData?.baseURL || 'http://localhost:3001';

  return new Promise((resolve, reject) => {
    wx.request({
      url: baseURL + url,
      method,
      data,
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res?.data?.message || 'Request error'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  request
};
