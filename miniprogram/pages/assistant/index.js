const { request } = require('../../utils/request');

const CHAT_STATE_KEY = 'assistant_chat_state_v1';
const DEFAULT_QUICK = ['上海有哪些酒店', '易宿有哪些酒店', '某酒店有哪些房型', '某酒店剩余房间多少'];

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeStr(v) {
  return v == null ? '' : String(v);
}

Page({
  data: {
    input: '',
    sending: false,
    scrollTop: 0,
    quickQuestions: DEFAULT_QUICK,
    messages: [
      {
        id: 'hello',
        role: 'assistant',
        content: '你好，我是易宿数字助手。你可以问：上海有哪些酒店 / 某酒店有哪些房型 / 剩余房间多少。',
      },
    ],

    context: {
      lastHotels: [],
      lastHotelId: '',
    },
  },

  onLoad() {
    try {
      const saved = wx.getStorageSync(CHAT_STATE_KEY);
      const msgs = saved?.messages;
      if (Array.isArray(msgs) && msgs.length > 0) {
        this.setData({ messages: msgs });
      }
      if (saved?.context) {
        this.setData({ context: saved.context });
      }
    } catch (e) {}

    this._scrollToBottom();
  },

  onUnload() {
    try {
      wx.setStorageSync(CHAT_STATE_KEY, { messages: this.data.messages || [], context: this.data.context || { lastHotels: [], lastHotelId: '' } });
    } catch (e) {}
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  onQuickTap(e) {
    const q = safeStr(e?.currentTarget?.dataset?.q).trim();
    if (!q) return;
    this.setData({ input: q });
    this.onSend();
  },

  async onSend() {
    const text = safeStr(this.data.input).trim();
    if (!text || this.data.sending) return;

    const userMsg = { id: uid(), role: 'user', content: text };
    this.setData({
      input: '',
      sending: true,
      messages: this.data.messages.concat([userMsg]),
    });
    this._scrollToBottom();

    try {
      const res = await request({
        url: '/api/assistant/chat',
        method: 'POST',
        data: { message: text, context: this.data.context || {} },
      });
      const reply = safeStr(res?.reply).trim() || '我暂时无法回答这个问题。';

      if (res?.context) {
        this.setData({ context: res.context });
      }
      const aiMsg = { id: uid(), role: 'assistant', content: reply };
      this.setData({ messages: this.data.messages.concat([aiMsg]) });
      this._scrollToBottom();
    } catch (e) {
      const errMsg = { id: uid(), role: 'assistant', content: `请求失败：${e?.message || '网络错误'}` };
      this.setData({ messages: this.data.messages.concat([errMsg]) });
      this._scrollToBottom();
    } finally {
      this.setData({ sending: false });
      try {
        wx.setStorageSync(CHAT_STATE_KEY, { messages: this.data.messages || [], context: this.data.context || { lastHotels: [], lastHotelId: '' } });
      } catch (e) {}
    }
  },

  _scrollToBottom() {
    this.setData({ scrollTop: this.data.scrollTop + 999999 });
  },
});
