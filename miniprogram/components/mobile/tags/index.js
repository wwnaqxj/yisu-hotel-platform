Component({
  properties: {
    items: {
      type: Array,
      value: []
    },
    selected: {
      type: Array,
      value: []
    }
  },

  methods: {
    onTagTap(e) {
      const tag = e.currentTarget.dataset.tag;
      let selected = [...(this.properties.selected || [])];
      const idx = selected.indexOf(tag);
      if (idx >= 0) selected.splice(idx, 1);
      else selected.push(tag);
      this.triggerEvent('change', { value: selected });
    }
  }
});
