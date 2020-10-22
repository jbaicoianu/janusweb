elation.elements.define('janus.ui.buttons', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttributes({
      showedit: { type: 'boolean', default: true },
      showshare: { type: 'boolean', default: true },
      showfullscreen: { type: 'boolean', default: true },
      showvr: { type: 'boolean', default: true },
      showar: { type: 'boolean', default: true },
      showsettings: { type: 'boolean', default: true },
    });
  }
  create() {
console.log('show me?', this.showedit, this.showshare, this.showfullscreen, this.showvr, this.showar, this.showsettings);
    if (this.showedit == 'false') this.showedit = false;
    if (this.showshare == 'false') this.showshare = false;
    if (this.showfullscreen == 'false') this.showfullscreen = false;
    if (this.showvr == 'false') this.showvr = false;
    if (this.showar == 'false') this.showar = false;
    if (this.showsettings == 'false') this.showsettings = false;
    this.innerHTML = elation.template.get('janus.ui.buttons', this);
  }
});
elation.elements.define('janus-buttons-display', class extends elation.elements.ui.dropdownbutton {
  init() {
    super.init();

    var detect = {
      fullscreen: () => this.supportsFullscreen(),
      webvr: () => this.supportsWebVR(),
      chromecast: () => this.supportsChromecast(),
      equirectangular: () => this.supportsEquirectangular(),
      sbs3d: () => this.supportsSBS3D(),
      ou3d: () => this.supportsOU3D(),
      peppersghost: () => this.supportsPeppersGhost(),
    };

  }
  supportsFullscreen() {
  }
  supportsWebVR() {
  }
  supportsChromecast() {
  }
  supportsEquirectangular() {
  }
  supportsSBS3D() {
  }
  supportsOU3D() {
  }
  supportsPeppersGhost() {
  }
});

elation.elements.define('janus-button-fullscreen', class extends elation.elements.ui.togglebutton {
  create() {
    super.create();
    elation.events.add(document, 'fullscreenchange', (ev) => {
      if (document.fullscreen) {
        this.active = true;
      } else {
        this.active = false;
      }
    });
  }
  onactivate(ev) {
    this.client.fullscreen(true);
  }
  ondeactivate(ev) {
    this.client.fullscreen(false);
  }
});
elation.elements.define('janus-button-webvr', class extends elation.elements.ui.togglebutton {
  create() {
    this.xr = false;
    this.defineAttributes({
      activelabel: { type: 'string', default: 'Exit VR' },
      inactivelabel: { type: 'string', default: 'VR' },
    });

    this.label = this.activelabel;
    super.create();
    this.view = janus.engine.client.view;

    elation.events.add(janus.engine.client, 'xrsessionstart', ev => this.handleXRSessionStart(ev));
    elation.events.add(janus.engine.client, 'xrsessionend', ev => this.handleXRSessionEnd(ev));

    if ('xr' in navigator) {
      this.label = this.inactivelabel;
      this.xr = true;
    } else if ('getVRDevices' in navigator) {
      window.addEventListener( 'vrdisplayconnect', (ev) => {
        this.show();
      }, false );

      window.addEventListener( 'vrdisplaydisconnect', (ev) => {
        this.hide();
      }, false );

      window.addEventListener( 'vrdisplaypresentchange', (ev) => {
        if (this.view.vrdisplay.isPresenting) {
        } else {
        }
      }, false );
    }
  }
  onactivate(ev) {
    if (this.disabled) return;
    if (this.xr) {
      let client = janus.engine.client;
      if (client.xrsession) {
        client.stopXR();
        this.label = this.inactivelabel;
      } else {
        this.disabled = true;
        this.label = 'Initializing...'
        client.startXR();
      }
    } else {
      this.view.toggleVR(true);
    }
  }
  ondeactivate(ev) {
    // FIXME - the button detects its state when it's clicked, we should really just use a <ui-button> here
    this.onactivate(ev);
  }
  handleXRSessionStart(ev) {
    this.label = this.activelabel;
    this.disabled = false;
  }
  handleXRSessionEnd(ev) {
    this.label = this.inactivelabel;
  }
});
elation.elements.define('janus-button-webar', class extends elation.elements.ui.togglebutton {
  create() {
    this.xr = false;
    this.activelabel = 'Exit AR';
    this.inactivelabel = 'AR';
    this.enabled = false;

    this.label = this.activelabel;
    super.create();
    this.view = janus.engine.client.view;

    if ('xr' in navigator) {
      this.label = this.inactivelabel;
      this.xr = true;
      navigator.xr.isSessionSupported('immersive-ar').then(supported => {
        this.enabled = supported;
      });
    }
  }
  onactivate(ev) {
    this.label = this.activelabel;
    if (this.xr) {
      janus.engine.client.startXR('immersive-ar');
    }
  }
  ondeactivate(ev) {
    this.label = this.inactivelabel;
    if (this.xr) {
      this.view.stopXR();
    }
  }
});
elation.elements.define('janus-buttons-chromecast', class extends elation.elements.ui.togglebutton {
});
elation.elements.define('janus-buttons-equirectangular', class extends elation.elements.ui.togglebutton {
});
elation.elements.define('janus-buttons-sbs3d', class extends elation.elements.ui.togglebutton {
});
elation.elements.define('janus-buttons-ou3d', class extends elation.elements.ui.togglebutton {
});
elation.elements.define('janus-buttons-peppersghost', class extends elation.elements.ui.togglebutton {
});
elation.elements.define('janus-button-start', class extends elation.elements.ui.button {
  create() {
    super.create();
    this.addEventListener('click', (ev) => this.onclick(ev));
  }
  onclick(ev) {
    janus.engine.systems.sound.enableSound();
    janus.engine.systems.controls.requestPointerLock();
    if (room.objects.scroller) {
      room.objects.scroller.disable();
    }
    //player.flying = false;
    player.enable();
    //janus.ui.show();
  }
});
