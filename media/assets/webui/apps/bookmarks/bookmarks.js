elation.elements.define('janus.ui.bookmarks', class extends elation.elements.base {
  create() {
    this.innerHTML = elation.template.get('janus.ui.bookmarks');
    this.grid = this.getElementsByTagName('ui-grid');
    elation.events.add(this.grid, 'select', (ev) => this.handleSelect(ev));
  }
  handleSelect(ev) {
    this.dispatchEvent({type: 'select', data: ev.data});
  }
});

