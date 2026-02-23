/**
 * 定位逻辑封装（创新点：定位失败兜底）
 * 成功 → 更新城市为定位结果；失败或用户拒绝 → 使用兜底城市并可在页面上提示
 */
const FALLBACK_CITY = '北京';

function getFallbackCity() {
  return FALLBACK_CITY;
}

/**
 * 获取当前城市：先尝试定位，失败则返回兜底城市
 * @returns {Promise<{ city: string, status: 'loading'|'success'|'fail', error?: string }>}
 */
function getCurrentCity() {
  return new Promise((resolve) => {
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        const { latitude, longitude } = res;
        // 小程序端无逆地理 API 时，用经纬度简单映射或兜底
        // 这里简化：根据大致经纬度返回城市（可后续接腾讯/高德逆地理）
        const city = resolveCityByCoord(latitude, longitude);
        resolve({ city, status: 'success' });
      },
      fail(err) {
        const message = err.errMsg || '';
        const isDenied = /deny|auth deny|authorize/.test(message);
        resolve({
          city: FALLBACK_CITY,
          status: 'fail',
          error: isDenied ? '用户拒绝定位' : '定位失败，已默认选择' + FALLBACK_CITY
        });
      }
    });
  });
}

/** 根据经纬度简单映射到城市（仅示例，实际可接逆地理 API） */
function resolveCityByCoord(lat, lng) {
  // 上海约 31.23, 121.47；北京约 39.9, 116.4
  if (lat >= 30 && lat <= 33 && lng >= 120 && lng <= 122) return '上海';
  if (lat >= 38 && lat <= 41 && lng >= 115 && lng <= 118) return '北京';
  if (lat >= 22 && lat <= 24 && lng >= 113 && lng <= 115) return '广州';
  if (lat >= 22 && lat <= 23 && lng >= 113 && lng <= 115) return '深圳';
  return FALLBACK_CITY;
}

module.exports = {
  getCurrentCity,
  getFallbackCity,
  FALLBACK_CITY
};
