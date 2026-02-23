/**
 * 双滑块区间组件：一根轴上两个可拖动按钮确定区间
 */
Component({
  properties: {
    min: { type: Number, value: 50 },
    max: { type: Number, value: 1000 },
    step: { type: Number, value: 50 },
    low: { type: Number, value: 50 },
    high: { type: Number, value: 1000 },
  },

  data: {
    leftPercent: 0,
    rightPercent: 100,
    activeStyle: 'left: 0%; right: 100%;',
    leftThumbStyle: 'left: 0%;',
    rightThumbStyle: 'left: 100%;',
    trackWidth: 0,
    trackLeft: 0,
    dragging: '', // 'left' | 'right'
  },

  observers: {
    'low, high, min, max': function (low, high, min, max) {
      const range = (max || 1000) - (min || 50) || 1;
      const lowVal = Number(low);
      const highVal = Number(high);
      const left = Math.max(0, Math.min(100, ((lowVal - min) / range) * 100));
      const right = Math.max(0, Math.min(100, ((highVal - min) / range) * 100));
      const leftPercent = Math.min(left, right);
      const rightPercent = Math.max(left, right);
      const activeStyle = `left: ${leftPercent}%; right: ${100 - rightPercent}%;`;
      const leftThumbStyle = `left: ${leftPercent}%;`;
      const rightThumbStyle = `left: ${rightPercent}%;`;
      this.setData({ leftPercent, rightPercent, activeStyle, leftThumbStyle, rightThumbStyle });
    },
  },

  methods: {
    _valueFromX(x) {
      const { min, max, step } = this.properties;
      const { trackLeft, trackWidth } = this.data;
      if (!trackWidth) return min;
      const p = (x - trackLeft) / trackWidth;
      const v = min + p * (max - min);
      const stepped = Math.round(v / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },

    _queryTrack() {
      const that = this;
      this.createSelectorQuery()
        .in(this)
        .select('.range-track')
        .boundingClientRect((rect) => {
          if (rect) {
            that.setData({ trackWidth: rect.width, trackLeft: rect.left });
          }
        })
        .exec();
    },

    onLeftStart() {
      this.setData({ dragging: 'left' });
      this._queryTrack();
    },

    onRightStart() {
      this.setData({ dragging: 'right' });
      this._queryTrack();
    },

    onMove(e) {
      const { dragging } = this.data;
      if (!dragging || !e.touches || !e.touches.length) return;
      const x = e.touches[0].clientX;
      const val = this._valueFromX(x);
      const { low, high, min, max } = this.properties;
      if (dragging === 'left') {
        const newLow = Math.min(val, high);
        this.triggerEvent('change', { low: newLow, high });
      } else {
        const newHigh = Math.max(val, low);
        this.triggerEvent('change', { low, high: newHigh });
      }
    },

    onEnd() {
      this.setData({ dragging: '' });
    },
  },
});
