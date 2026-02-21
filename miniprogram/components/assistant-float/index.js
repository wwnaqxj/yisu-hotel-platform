const POS_KEY = 'assistant_float_pos_v1';
const { request } = require('../../utils/request');
const CHAT_STATE_KEY = 'assistant_chat_state_v1';

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeStr(v) {
  return v == null ? '' : String(v);
}

function getWechatSI() {
  try {
    // eslint-disable-next-line no-undef
    return requirePlugin('WechatSI');
  } catch (e) {
    return null;
  }
}

const DEFAULT_QUICK = ['上海有哪些酒店', '易宿有哪些酒店', '某酒店有哪些房型', '某酒店剩余房间多少'];

Component({
  properties: {
    iconSrc: {
      type: String,
      value: '',
    },
  },
  data: {
    x: 16,
    y: 400,

    open: false,
    input: '',
    sending: false,
    scrollTop: 0,
    quickQuestions: DEFAULT_QUICK,
    messages: [
      {
        id: 'hello',
        role: 'assistant',
        content: '你好，我是易宿数字助手。\n你可以问：上海有哪些酒店 / 某酒店有哪些房型 / 剩余房间多少。\n也可以按住说话。',
      },
    ],

    voiceReady: false,
    recording: false,

    captionText: '点击',

    context: {
      lastHotels: [],
      lastHotelId: '',
    },
  },

  lifetimes: {
    attached() {
      try {
        const saved = wx.getStorageSync(POS_KEY);
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
          this.setData({ x: saved.x, y: saved.y });
        }
      } catch (e) {}

      try {
        const info = wx.getSystemInfoSync();
        const y = Math.max(80, (info.windowHeight || 600) - 140);
        this.setData({ x: this.data.x ?? 16, y });
      } catch (e) {}

      const plugin = getWechatSI();
      if (plugin && typeof plugin.getRecordRecognitionManager === 'function') {
        this._rrm = plugin.getRecordRecognitionManager();
        this._rrm.onStart = () => {
          this.setData({ recording: true });
        };
        this._rrm.onStop = (res) => {
          const text = safeStr(res?.result).trim();
          this.setData({ recording: false });
          if (text) {
            this.setData({ input: text });
            this.onSend();
          }
        };
        this._rrm.onError = () => {
          this.setData({ recording: false });
        };
        this.setData({ voiceReady: true });
      }

      this._captionTimer = setInterval(() => {
        this.setData({
          captionText: this.data.captionText === '点击' ? '易宿小助手' : '点击',
        });
      }, 1000);
    },
    detached() {
      if (this._captionTimer) {
        clearInterval(this._captionTimer);
        this._captionTimer = null;
      }
    },
  },

  methods: {
    onChange(e) {
      if (e?.detail?.source === 'touch' && e?.detail?.x != null && e?.detail?.y != null) {
        this.setData({ x: e.detail.x, y: e.detail.y });
      }
      try {
        wx.setStorageSync(POS_KEY, { x: this.data.x, y: this.data.y });
      } catch (err) {}
    },

    onTap() {
      this.setData({ open: true });
      this._scrollToBottom();
    },

    onClose() {
      this.setData({ open: false });
    },

    onExpand() {
      try {
        wx.setStorageSync(CHAT_STATE_KEY, {
          messages: this.data.messages || [],
          context: this.data.context || { lastHotels: [], lastHotelId: '' },
        });
      } catch (e) {}

      this.setData({ open: false });
      wx.navigateTo({
        url: '/pages/assistant/index',
      });
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

        await this._speak(reply);
      } catch (e) {
        const errMsg = { id: uid(), role: 'assistant', content: `请求失败：${e?.message || '网络错误'}` };
        this.setData({ messages: this.data.messages.concat([errMsg]) });
        this._scrollToBottom();
      } finally {
        this.setData({ sending: false });
        try {
          wx.setStorageSync(CHAT_STATE_KEY, {
            messages: this.data.messages || [],
            context: this.data.context || { lastHotels: [], lastHotelId: '' },
          });
        } catch (e) {}
      }
    },

    onVoiceStart() {
      if (!this.data.voiceReady || !this._rrm || this.data.recording) return;
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          try {
            this._rrm.start({ duration: 30000, lang: 'zh_CN' });
          } catch (e) {}
        },
        fail: () => {
          wx.showToast({ title: '请授权录音权限', icon: 'none' });
        },
      });
    },

    onVoiceEnd() {
      if (!this._rrm || !this.data.recording) return;
      try {
        this._rrm.stop();
      } catch (e) {}
    },

    onVoiceCancel() {
      if (!this._rrm || !this.data.recording) return;
      try {
        this._rrm.stop();
      } catch (e) {}
    },

    _scrollToBottom() {
      this.setData({ scrollTop: this.data.scrollTop + 999999 });
    },

    async _speak(text) {
      const plugin = getWechatSI();
      if (!plugin || typeof plugin.textToSpeech !== 'function') return;
      const content = safeStr(text).trim();
      if (!content) return;

      const ttsText = content.length > 240 ? content.slice(0, 240) : content;

      return new Promise((resolve) => {
        plugin.textToSpeech({
          lang: 'zh_CN',
          tts: true,
          content: ttsText,
          success: (res) => {
            const file = res?.filename;
            if (!file) {
              resolve();
              return;
            }
            const ctx = wx.createInnerAudioContext();
            ctx.autoplay = true;
            ctx.src = file;
            ctx.onEnded(() => {
              try {
                ctx.destroy();
              } catch (e) {}
              resolve();
            });
            ctx.onError(() => {
              try {
                ctx.destroy();
              } catch (e) {}
              resolve();
            });
          },
          fail: () => resolve(),
        });
      });
    },
  },
});
