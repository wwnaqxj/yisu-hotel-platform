const PROVINCE_CITY_DATA = [
  {
    name: '北京市',
    short: '北京',
    cities: ['北京']
  },
  {
    name: '上海市',
    short: '上海',
    cities: ['上海']
  },
  {
    name: '广东省',
    short: '广东',
    cities: ['广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州']
  },
  {
    name: '浙江省',
    short: '浙江',
    cities: ['杭州', '宁波', '温州', '嘉兴', '绍兴', '金华']
  },
  {
    name: '江苏省',
    short: '江苏',
    cities: ['南京', '苏州', '无锡', '常州', '扬州']
  },
  {
    name: '四川省',
    short: '四川',
    cities: ['成都', '绵阳', '德阳', '乐山']
  },
  {
    name: '重庆市',
    short: '重庆',
    cities: ['重庆']
  }
  // TODO: 可按需补充全国所有省市
];

function buildRange() {
  const provinces = PROVINCE_CITY_DATA.map((p) => p.name);
  const firstCities = PROVINCE_CITY_DATA[0] ? PROVINCE_CITY_DATA[0].cities : [];
  return [provinces, firstCities];
}

Component({
  properties: {
    value: {
      // 当前选中的城市名，如“北京”
      type: String,
      value: ''
    },
    placeholder: {
      type: String,
      value: '请选择城市'
    }
  },

  data: {
    range: buildRange(),
    pickerValue: [0, 0],
    displayText: '',
    hasValue: false
  },

  lifetimes: {
    attached() {
      this.syncFromValue(this.properties.value);
    }
  },

  observers: {
    value(v) {
      this.syncFromValue(v);
    }
  },

  methods: {
    syncFromValue(city) {
      let provinceIndex = 0;
      let cityIndex = 0;
      if (city) {
        PROVINCE_CITY_DATA.forEach((p, pi) => {
          const idx = p.cities.indexOf(city);
          if (idx >= 0) {
            provinceIndex = pi;
            cityIndex = idx;
          }
        });
      }
      const range = [
        PROVINCE_CITY_DATA.map((p) => p.name),
        PROVINCE_CITY_DATA[provinceIndex] ? PROVINCE_CITY_DATA[provinceIndex].cities : []
      ];
      this.setData({
        range,
        pickerValue: [provinceIndex, cityIndex],
        displayText: city || this.properties.placeholder,
        hasValue: !!city
      });
    },

    onColumnChange(e) {
      const { column, value } = e.detail;
      const pickerValue = this.data.pickerValue.slice();
      pickerValue[column] = value;

      if (column === 0) {
        const provinceIndex = value;
        const cities = PROVINCE_CITY_DATA[provinceIndex]
          ? PROVINCE_CITY_DATA[provinceIndex].cities
          : [];
        this.setData({
          range: [
            PROVINCE_CITY_DATA.map((p) => p.name),
            cities
          ],
          pickerValue: [provinceIndex, 0]
        });
      } else {
        this.setData({ pickerValue });
      }
    },

    onChange(e) {
      const [provinceIndex, cityIndex] = e.detail.value || this.data.pickerValue;
      const province = PROVINCE_CITY_DATA[provinceIndex];
      const city =
        province && province.cities[cityIndex]
          ? province.cities[cityIndex]
          : '';
      const displayText = city || this.properties.placeholder;
      this.setData({ displayText, hasValue: !!city });
      this.triggerEvent('change', {
        province: province ? province.name : '',
        provinceShort: province ? province.short : '',
        city
      });
    }
  }
});

