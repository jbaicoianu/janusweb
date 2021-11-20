elation.elements.define('janus.ui.inventory', class extends elation.elements.base {
  create() {
    //this.innerHTML = elation.template.get('janus.ui.inventory');
    let elements = elation.elements.fromTemplate('janus.ui.inventory', this);

    console.log('INVENTORY ELEMENTS', elements);
    if (elements.primitives) {
      elation.events.add(elements.primitives, 'select', (ev) => this.handlePrimitiveSelect(ev));
      //elation.events.add(elements.polyobjects, 'select', (ev) => this.handleAssetSelect(ev));
    }
  }
  addSource(name, collection) {
  }
  handlePrimitiveSelect(ev) {
    let item = ev.target;
    elation.events.fire({type: 'assetselect', data: item.value.href, element: this});
    ev.preventDefault();
    ev.stopPropagation();
  }
  handleAssetSelect(ev) {
    let item = ev.target;
    elation.events.fire({type: 'assetselect', data: item.model.root.url, element: this});
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
elation.elements.define('janus.ui.inventory.roomassets', class extends elation.elements.base {
  create() {
    this.elements = elation.elements.fromTemplate('janus.ui.inventory.roomassets', this);
  }
});
elation.elements.define('janus.ui.inventory.roomassets.list', class extends elation.elements.base {
  constructor() {
    super();
    this.defineAttribute('assettype', { type: 'string' });
  }
  create() {
    this.list = elation.elements.create('ui-grid', {
      append: this,
      class: 'models',
      selectable: 1,
      draggable: 1,
      itemcomponent: 'janus.ui.inventory.item.roomasset',
    });
    this.updateList();
    elation.events.add(janus._target, 'room_change', (ev) => this.updateList());
  }
  updateList() {
    this.list.clear();
    this.list.innerHTML = '';
    this.list.setItems(this.getAssetList());
  }
  getAssetList() {
    if (room.assetpack.assetmap[this.assettype]) {
      return room.assetpack.assetmap[this.assettype];
    }
    return {};
  }
});
elation.elements.define('janus.ui.inventory.item.roomasset', class extends elation.elements.ui.item {
  create() {
    let elements = elation.elements.fromTemplate('janus.ui.inventory.item.roomasset', this);
    elation.events.add(this, 'click', (ev) => this.click(ev));
  }
});
