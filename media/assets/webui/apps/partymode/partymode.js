elation.elements.define('janus.ui.partymode', class extends elation.elements.base {
  create() {
    this.innerHTML = elation.template.get('janus.ui.partymode');

    this.collection = this.getElementsByTagName('collection-jsonapi')[0];

    this.list = this.getElementsByTagName('ui-list');
    elation.events.add(this.list, 'select', (ev) => this.handleSelect(ev));
  }
  handleSelect(ev) {
    this.dispatchEvent({type: 'select', data: ev.data});
  }
  updateData() {
    // If offsetParent is null, it means one of our parents is set to display: none, and we should do nothing
    if (this.offsetParent) {
      this.collection.load();
    }
  }
  show() {
    super.show();
    if (this.updatetimer) clearInterval(this.updatetimer);
    this.updatetimer = setInterval(() => this.updateData(), 10000);
  }
  hide() {
    super.hide();
    if (this.updatetimer) {
      clearInterval(this.updatetimer);
      this.updatetimer = false;
    }
  }
});

