elation.elements.define('janus.ui.inventory', class extends elation.elements.base {
  create() {
    this.innerHTML = elation.template.get('janus.ui.inventory');
  }
  addSource(name, collection) {
  }
});
elation.elements.define('janus.ui.inventory.item.poly', class extends elation.elements.ui.item {
  create() {
    let item = this.value;

    for (let i = 0; i < item.formats.length; i++) {
      if (item.formats[i].formatType == 'GLTF2') {
        this.model = item.formats[i];
      }
    }
    if (!this.model) {
      this.model = item.formats[0];
    }

    let elements = elation.elements.fromTemplate('janus.ui.inventory.item.poly', this);
  }
});
