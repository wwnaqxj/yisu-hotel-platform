/**
 * 静态数据：Banner 列表、按城市的热门标签（创新点：智能推荐标签）
 * 搜索联想可基于 list 接口或此文件扩展
 */
const BANNER_LIST = [
  { id: 'demo', title: '易宿精选', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80' },
  { id: 'demo', title: '品质出行', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80' },
  { id: 'demo', title: '舒适入住', image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80' }

];

const TAGS_BY_CITY = {
  北京: ['故宫周边', '商务出差', '亲子酒店', '免费停车', '近地铁', '豪华'],
  上海: ['外滩景观', '迪士尼周边', '商务出差', '免费停车', '亲子酒店', '近地铁'],
  广州: ['长隆周边', '商务出差', '免费停车', '早茶推荐', '近地铁'],
  深圳: ['商务出差', '海边度假', '免费停车', '近地铁', '豪华'],
  默认: ['亲子酒店', '豪华', '免费停车', '近地铁', '商务出差']
};

function getBannerList() {
  return BANNER_LIST;
}

function getTagsByCity(city) {
  const c = (city || '').trim() || '默认';
  return TAGS_BY_CITY[c] || TAGS_BY_CITY['默认'];
}

module.exports = {
  getBannerList,
  getTagsByCity,
  BANNER_LIST,
  TAGS_BY_CITY
};
