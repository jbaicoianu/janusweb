elation.elements.define('janus.ui.transporter', class extends elation.elements.base {
  create() {
    this.elements = elation.elements.fromTemplate('janus.ui.transporter', this);
  }
});
janus.registerElement('transporter', {
  create() {
    this.model = this.createObject('Object', {
      id: 'https://poly.googleapis.com/downloads/eMZR7X-ZjoH/37kyGBjzyky/model.obj',
      pos: V(0,1.75,0),
      collision_id: 'https://poly.googleapis.com/downloads/eMZR7X-ZjoH/37kyGBjzyky/model.obj',
    });

    this.model.addEventListener('click', (ev) => this.handleClick(ev));
    this.model.addEventListener('touchend', (ev) => this.handleTouchEnd(ev));
  },
  openWindow() {
    if (!this.window) {
      this.window = elation.elements.create('ui.window', {
        center: true,
        title: 'Metaverse Transporter',
        append: document.body,
        width: '50em'
      });
      console.log(this.window);
      this.window.setcontent('<janus-ui-transporter></janus-ui-transporter>');
    }
    this.window.show();
    player.disable();
  },
  handleClick(ev) {
console.log('I did a click');
console.log(ev.button);
    if (ev.button == 0) {
      this.openWindow();
    }
  },
  handleTouchEnd(ev) {
    if (ev.touches.length == 0) {
      this.openWindow();
    }
  }
});
