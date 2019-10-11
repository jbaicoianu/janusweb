elation.elements.define('janus.ui.buttons', class extends elation.elements.base {
  create() {
    this.innerHTML = elation.template.get('janus.ui.buttons');
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
    this.activelabel = 'WebVR';
    this.inactivelabel = 'WebVR';

    this.label = this.activelabel;
    super.create();
    this.view = janus.engine.client.view;

    if ('xr' in navigator) {
      this.activelabel = 'WebXR';
      this.inactivelabel = 'WebXR';
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
    this.label = this.activelabel;
    if (this.xr) {
      this.view.startXR();
    } else {
      this.view.toggleVR(true);
    }
  }
  ondeactivate(ev) {
    this.label = this.inactivelabel;
    if (this.xr) {
      this.view.stopXR();
    } else {
      this.view.toggleVR(false);
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
