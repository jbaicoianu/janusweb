janus.registerElement('avatar_simple', {
  headsrc: 'media/assets/hoverscreen.obj',
  bodysrc: '',
  handsrc: '',
  create() {
    if (this.headsrc) {
      this.head = this.createObject('object', {id: this.headsrc});
    }
    if (this.bodysrc) {
      this.body = this.createObject('object', {id: this.bodysrc});
    }
    if (this.handsrc) {
      this.hands = this.createObject('object', {id: this.handsrc});
    }
    //this.attachToPlayer();
  },
  attachToPlayer(player) {
    // THIS IS WHERE I STOPPED
    // I need to attach this avatar object to the player so it can do whatever it needs to position its sub-objects
    // In this case this is the simple head-and-hands avatar style, but it should be done in a way that can work
    // with more advanced types, like rigged models with IK
    player.addEventListener('xrframe', (ev) => this.handleXRFrame(ev));
  },
  //update(dt) {
  //},
  handleXRFrame(ev) {
    console.log('update it', ev.target, ev.data);
  }
});
janus.registerElement('avatar_rigged', {
  create() {
  },
  update(dt) {
  },
  updateXR(pose, referenceSpace) {
  }
});
