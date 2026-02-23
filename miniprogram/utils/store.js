/**
 * 简单全局状态管理：查询条件在首页、列表页、详情页间复用
 * 用法：getApp().getStore() 取 store 实例，setQuery / getQuery / subscribe
 */
const DEFAULT_QUERY = {
  city: '',
  keyword: '',
  checkIn: '',
  checkOut: '',
  stars: [],      // 如 [3, 4, 5]
  priceMin: '',
  priceMax: '',
  tags: []        // 如 ['亲子酒店', '免费停车']
};

function createStore() {
  let query = { ...DEFAULT_QUERY };
  const listeners = new Set();

  return {
    getQuery() {
      return { ...query };
    },

    setQuery(next) {
      if (typeof next === 'function') next = next(query);
      query = { ...query, ...next };
      listeners.forEach((fn) => fn(query));
      return query;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}

let storeInstance = null;

function getStore() {
  if (!storeInstance) storeInstance = createStore();
  return storeInstance;
}

module.exports = {
  getStore,
  DEFAULT_QUERY
};
