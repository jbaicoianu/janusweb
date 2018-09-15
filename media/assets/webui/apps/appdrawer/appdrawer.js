elation.elements.define('janus.ui.appdrawer', class extends elation.elements.ui.panel {
  create() {
    this.buttons = elation.elements.create('ui-buttonbar', {
      append: this
    });
    var inventorybutton = elation.elements.create('ui-button', {
      append: this.buttons,
      label: 'Inventory',
    });
  }
});
