elation.elements.define('janus.ui.popular', class extends elation.elements.base {
  create() {
    this.innerHTML = elation.template.get('janus.ui.popular');

    this.grid = this.getElementsByTagName('ui-grid');
    elation.events.add(this.grid, 'select', (ev) => this.handleSelect(ev));
  }
  handleSelect(ev) {
    this.dispatchEvent({type: 'select', data: ev.data});
  }
});

