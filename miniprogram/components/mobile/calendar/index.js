/**
 * 日历组件：入住/离店区间选择，禁用过去日期，区间高亮
 * 创新点：快捷日期选项（今天入住、明天入住、本周周末）
 */
const WEEKS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function getMonthDays(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const firstWeekday = first.getDay();
  const total = last.getDate();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTotal = new Date(prevYear, prevMonth, 0).getDate();
  const list = [];
  for (let i = 0; i < firstWeekday; i++) {
    list.push({ day: prevTotal - firstWeekday + i + 1, current: false, date: null });
  }
  for (let i = 1; i <= total; i++) {
    list.push({ day: i, current: true, date: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
  }
  const rest = 42 - list.length;
  for (let i = 1; i <= rest; i++) {
    list.push({ day: i, current: false, date: null });
  }
  return list;
}

Component({
  properties: {
    checkIn: { type: String, value: '' },
    checkOut: { type: String, value: '' }
  },

  data: {
    weeks: WEEKS,
    year: 0,
    month: 0,
    days: [],
    today: '',
    minDate: ''
  },

  observers: {
    'checkIn, checkOut': function (checkIn, checkOut) {
      this.buildCalendar();
    }
  },

  lifetimes: {
    attached() {
      const today = formatDate(new Date());
      this.setData({ today, minDate: today });
      this.buildCalendar();
    }
  },

  methods: {
    buildCalendar() {
      const today = this.data.today || formatDate(new Date());
      const checkIn = this.properties.checkIn;
      const checkOut = this.properties.checkOut;
      let year = this.data.year;
      let month = this.data.month;
      if (!year || !month) {
        const d = checkIn ? new Date(checkIn + 'T12:00:00') : new Date();
        year = d.getFullYear();
        month = d.getMonth() + 1;
      }
      const days = getMonthDays(year, month).map((cell) => {
        let status = '';
        if (!cell.current || !cell.date) status = 'other';
        else if (cell.date < today) status = 'disabled';
        else if (checkIn && checkOut) {
          if (cell.date === checkIn) status = 'start';
          else if (cell.date === checkOut) status = 'end';
          else if (cell.date > checkIn && cell.date < checkOut) status = 'range';
          else status = 'normal';
        } else if (cell.date === checkIn) status = 'start';
        else if (cell.date === checkOut) status = 'end';
        else status = 'normal';
        return { ...cell, status };
      });
      this.setData({ year, month, days });
    },

    prevMonth() {
      let { year, month } = this.data;
      if (month === 1) { year--; month = 12; } else month--;
      this.setData({ year, month }, () => this.buildCalendar());
    },

    nextMonth() {
      let { year, month } = this.data;
      if (month === 12) { year++; month = 1; } else month++;
      this.setData({ year, month }, () => this.buildCalendar());
    },

    onDayTap(e) {
      const { date, status } = e.currentTarget.dataset;
      if (!date || status === 'disabled' || status === 'other') return;
      const { checkIn, checkOut } = this.properties;
      let nextIn = checkIn;
      let nextOut = checkOut;
      if (!checkIn || (checkIn && checkOut)) {
        nextIn = date;
        nextOut = '';
      } else {
        if (date <= checkIn) {
          nextIn = date;
          nextOut = '';
        } else {
          nextOut = date;
        }
      }
      this.triggerEvent('change', { checkIn: nextIn, checkOut: nextOut });
    },

    /** 创新点：快捷日期 - 今天入住 */
    quickToday() {
      const today = formatDate(new Date());
      const tomorrow = addDays(today, 1);
      this.triggerEvent('change', { checkIn: today, checkOut: tomorrow });
    },

    /** 创新点：快捷日期 - 明天入住 */
    quickTomorrow() {
      const tomorrow = formatDate(new Date(Date.now() + 86400000));
      const dayAfter = addDays(tomorrow, 1);
      this.triggerEvent('change', { checkIn: tomorrow, checkOut: dayAfter });
    },

    /** 创新点：快捷日期 - 本周周末（最近周五/六入住，周日离店） */
    quickWeekend() {
      const d = new Date();
      let friday = new Date(d);
      const day = d.getDay();
      if (day < 5) friday.setDate(d.getDate() + (5 - day));
      else if (day > 5) friday.setDate(d.getDate() + (5 - day + 7));
      const saturday = new Date(friday);
      saturday.setDate(saturday.getDate() + 1);
      const sunday = new Date(friday);
      sunday.setDate(sunday.getDate() + 2);
      const checkIn = formatDate(friday);
      const checkOut = formatDate(sunday);
      if (checkIn <= this.data.today) {
        const nextFri = new Date(friday);
        nextFri.setDate(nextFri.getDate() + 7);
        const nextSun = new Date(nextFri);
        nextSun.setDate(nextSun.getDate() + 2);
        this.triggerEvent('change', { checkIn: formatDate(nextFri), checkOut: formatDate(nextSun) });
      } else {
        this.triggerEvent('change', { checkIn, checkOut });
      }
    }
  }
});
