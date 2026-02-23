let config;
try {
  config = require('./config.local');
} catch (e) {
  config = require('./config.example');
}

const { getStore } = require('./utils/store');

App({
  globalData: {
    baseURL: (config && config.baseURL) || 'http://localhost:3001'
  },

  getStore
});
