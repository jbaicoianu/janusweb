elation.elements.define('janus.ui.splash', class extends elation.elements.base {
  create() {
    this.innerHTML = elation.template.get('janus.ui.splash');

    this.popular = this.getElementsByTagName('janus-ui-popular')[0];
    this.partymode = this.getElementsByTagName('janus-ui-partymode')[0];
    this.bookmarks = this.getElementsByTagName('janus-ui-bookmarks')[0];

    elation.events.add([this.popular, this.partymode, this.bookmarks], 'select', (ev) => this.handleSelect(ev));

    elation.events.add(document, 'keydown', (ev) => this.handleKeyDown(ev));
    elation.events.add(document, 'pointerlockchange', (ev) => this.handlePointerlockChange(ev));

    this.show();
  }
  handleSelect(ev) {
    this.hide();
  }
  show() {
    super.show();
    this.partymode.show();
  }
  hide() {
    super.hide();
    this.partymode.hide();
  }
  handleKeyDown(ev) {
    if (ev.key == 'Escape') {
      if (this.hidden) {
        this.show();
      } else {
        this.hide();
      }
    }
  }
  handlePointerlockChange(ev) {
    console.log('pointer lock', document.pointerLockElement, ev);
    if (document.pointerLockElement) {
      this.hide();
    } else {
      this.show();
    }
  }
});

