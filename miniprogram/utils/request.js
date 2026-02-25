function request({ url, method = 'GET', data, header }) {
  const app = getApp();
  const baseURLRaw = app?.globalData?.baseURL || 'https://yisuhotel.qxj123.xyz';
  const baseURL = String(baseURLRaw).replace(/^http:\/\//, 'https://');

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
