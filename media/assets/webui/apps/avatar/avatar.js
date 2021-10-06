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

elation.elements.define('janus-avatar-picker', class extends elation.elements.base {
  init() {
    this.defineAttribute('src', { type: 'string' });
    this.defineAttribute('previewpos', { type: 'vector3', default: V(-2, 0, -3) });
    this.defineAttribute('hidereset', { type: 'boolean', default: false });
    this.selected = false;
  }
  create() {
    let tpl = `
      <ui-tabs>
        <ui-tab label="Chibis">
          <collection-jsonapi id="avatarlist" endpoint="${this.src}"></collection-jsonapi>
          <ui-list name="avatar" selectable="1" collection="avatarlist" itemcomponent="janus-avatar-picker-item"></ui-list>
        </ui-tab>
        <ui-tab label="Ready Player Me">
          <iframe src="https://demo.readyplayer.me/avatar"></iframe>
        </ui-tab>
      </ui-tabs>
      <ui-button name="confirm" disabled="1">Confirm</ui-button>
    `;
    if (!this.hidereset) {
      tpl += '<ui-button name="reset">Reset</ui-button>';
    }
    this.elements = elation.elements.fromString(tpl, this);

    elation.events.add(this.elements['avatar'], 'select', (ev) => this.handleAvatarSelect(ev));
    elation.events.add(this.elements['confirm'], 'click', (ev) => this.handleAvatarConfirm(ev));
    if (this.elements['reset']) {
      elation.events.add(this.elements['reset'], 'click', (ev) => this.handleAvatarReset(ev));
    }

    // Observer watches for visibility events and hides the 3d avatar preview when the 2d ui disappears
    let threshold = [];
    for (let i = 0; i < 100; i++) threshold.push(i / 100);
    let observer = new IntersectionObserver(ev => this.handleIntersectionChange(ev), { root: document, rootMargin: '0px', threshold: threshold });
    observer.observe(this);
    document.addEventListener('scroll', ev => this.handleScroll(ev));
    window.addEventListener('message', ev => this.handleWindowMessage(ev));
  }
  selectAvatar(avatar) {
    let items = this.elements.avatarlist.items,
        list = this.elements.avatar;
    console.log('avatar?', items, list, avatar);
  }
  hidePreview(hidelight=false) {
    if (this.avatarpreview) {
      this.avatarpreview.die();
      this.avatarpreview = false;
    }
    if (this.avatarlight && hidelight) {
      this.avatarlight.die();
      this.avatarlight = false;
    }
  }
  showPreview(src) {
    if (!src) {
      src = 'data:text/plain,' + escape(player.getCurrentAvatarData());
    }
    this.hidePreview();
    this.avatarpreview = player.createObject('ghost', { avatar_src: src, pos: V(this.previewpos), rotate_deg_per_sec: 10, });
    if (!this.avatarlight) {
      this.avatarlight = player.createObject('light', {
        light_target: this.avatarpreview,
        light_cone_angle: .5,
        light_range: 4,
        light_decay: 1,
        col: 'white',
        pos: V(0, 3, 1)
      });
    }
    this.updatePreviewPosition();
  }
  updatePreviewPosition() {
    if (this.avatarpreview) {
      let rect = this.getBoundingClientRect();
      let middle = (rect.top + rect.bottom) / 2;
      let pos = middle / window.innerHeight;
      this.avatarpreview.pos.y = 0.5 - pos;
    }
  }
  handleAvatarSelect(ev) {
    console.log('selected an avatar', ev.data);
    this.selected = ev.data;
    this.showPreview(ev.data.url);
    this.elements.confirm.disabled = false;
  }
  handleAvatarConfirm(ev) {
    this.hidePreview(true);
    if (this.selected) {
      fetch(this.selected.url)
        .then(r => r.text())
        .then(t => {
          player.setAvatar(t);
          this.dispatchEvent(new CustomEvent('select', { detail: this.selected }));
        });
    }
  }
  handleAvatarReset(ev) {
    player.setAvatar(player.defaultAvatar);
  }
  handleIntersectionChange(intersections) {
    if (this.avatarpreview && !intersections[0].isIntersecting) {
      this.hidePreview(true);
    } else if (!this.avatarpreview && intersections[0].isIntersecting) {
      this.showPreview();
    }
  }
  handleScroll(ev) {
    this.updatePreviewPosition();
  }
  handleWindowMessage(ev) {
    if (ev.origin.match(/https:\/\/.*\.readyplayer\.me/)) {
      let avatarurl = ev.data;
      let avatarstr = `
<FireBoxRoom>
  <assets>
    <assetobject id="body" src="${avatarurl}" />
    <assetobject id="avatar_animations" src="https://assets.metacade.com/james/readyplayerme/animations.glb" />
  </assets>
  <room>
    <ghost body_id="body" />
  </room>
</FireBoxRoom>
`;
console.log(avatarstr);
      player.setAvatar(avatarstr);
      this.handleAvatarSelect({data: { url: 'data:text/plain,' + avatarstr } });
    }
  }
});
elation.elements.define('janus-avatar-picker-item', class extends elation.elements.ui.item {
  create() {
    elation.events.add(this, 'click', (ev) => { console.log('duh', this); this.click(ev) });
    let item = this.value;
    let defaulticon = janus.ui.apps.default.apps.avatar.resolveFullURL('./images/default-avatar.jpg');
    this.elements = elation.elements.fromString(`
      <img src="${item.thumb || defaulticon}" alt="${item.name || 'Untitled Avatar'}">
    `, this);
  }
});
