elation.elements.define('janus.ui.inventory', class extends elation.elements.base {
  create() {
    //this.innerHTML = elation.template.get('janus.ui.inventory');
    let elements = elation.elements.fromTemplate('janus.ui.inventory', this);

    console.log('INVENTORY ELEMENTS', elements);
    if (elements.primitives) {
      elation.events.add(elements.primitives, 'select', (ev) => this.handlePrimitiveSelect(ev));
      elation.events.add(elements.polyobjects, 'select', (ev) => this.handleAssetSelect(ev));
    }
  }
  addSource(name, collection) {
  }
  handlePrimitiveSelect(ev) {
    let item = ev.data;
    elation.events.fire({type: 'assetselect', data: item.url, element: this});
    ev.preventDefault();
    ev.stopPropagation();
  }
  handleAssetSelect(ev) {
    let item = ev.data;
    elation.events.fire({type: 'assetselect', data: item.url, element: this});
    ev.preventDefault();
    ev.stopPropagation();
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
    elation.events.add(this, 'click', (ev) => this.click(ev));
  }
});
