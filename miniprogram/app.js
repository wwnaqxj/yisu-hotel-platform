let config;
try {
  config = require('./config.local');
} catch (e) {
  config = require('./config.example');
}

const { getStore } = require('./utils/store');

App({
  globalData: {
    baseURL: (config && config.baseURL) || 'https://yisuhotel.qxj123.xyz'
  },

  getStore
});
