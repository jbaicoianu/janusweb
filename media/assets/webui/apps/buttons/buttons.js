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
      showaudio: { type: 'boolean', default: true },
      showvoip: { type: 'boolean', default: true },
      showdebug: { type: 'boolean', default: true },
    });
  }
  create() {
    if (this.showedit == 'false') this.showedit = false;
    if (this.showshare == 'false') this.showshare = false;
    if (this.showfullscreen == 'false') this.showfullscreen = false;
    if (this.showvr == 'false') this.showvr = false;
    if (this.showar == 'false') this.showar = false;
    if (this.showsettings == 'false') this.showsettings = false;
    if (this.showaudio == 'false') this.showaudio = false;
    if (this.showvoip == 'false') this.showvoip = false;
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

    this.label = this.inactivelabel;
    super.create();
    this.view = janus.engine.client.view;

    elation.events.add(janus.engine.client, 'xrsessionstart', ev => this.handleXRSessionStart(ev));
    elation.events.add(janus.engine.client, 'xrsessionend', ev => this.handleXRSessionEnd(ev));

    this.disabled = true;
    if ('xr' in navigator) {
      this.label = this.inactivelabel;
      this.xr = true;
      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (supported) {
          this.disabled = false;
        } else {
          this.title = 'WebXR supported, but no VR devices found';
        }
      });
    } else {
      this.title = 'WebXR is not supported in this browser';
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

    this.disabled = true;
    if ('xr' in navigator) {
      this.label = this.inactivelabel;
      this.xr = true;
      navigator.xr.isSessionSupported('immersive-ar').then(supported => {
        this.enabled = supported;
        if (supported) {
          this.disabled = false;
        } else {
          this.title = 'WebXR supported, but no AR devices found';
        }
      });
    } else {
      this.title = 'WebXR is not supported in this browser';
    }
  }
  onactivate(ev) {
    this.label = this.activelabel;
    if (this.xr) {
      janus.engine.client.startXR('immersive-ar', { requiredFeatures: [], optionalFeatures: ['local-floor', 'plane-detection'] });
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
elation.elements.define('janus-button-audio', class extends elation.elements.ui.popupbutton {
  init() {
    super.init();
    this.defineAttribute('muted', { type: 'boolean' });
  }
  create() {
    this.popupcontent = `
      <ui-slider name="volume_env" label="Environment" min="0" max="1.2" value="1"></ui-slider>
      <ui-slider name="volume_voip" label="Voice Chat" min="0" max="1.2" value="1"></ui-slider>
    `;
    super.create();
    this.createPopup();
    this.hidePopup();
    elation.events.add(this.popup.content.elements['volume_env'], 'change', (ev) => this.adjustEnvironmentVolume(ev.data));
    //this.addEventListener('click', (ev) => this.handleClick(ev));

    let soundsystem = janus.engine.systems.sound;
    elation.events.add(soundsystem, 'mute', ev => this.muted = true);
    elation.events.add(soundsystem, 'unmute', ev => this.muted = false);
/*
    if (!soundsystem.canPlaySound) {
      this.muted = true;
    }
*/
    this.updateMuteState();
    elation.events.add(soundsystem, 'sound_enabled', (ev) => this.updateMuteState());
  }
  adjustEnvironmentVolume(volume) {
    if (room.audionodes) {
      room.audionodes.gain.gain.value = volume;
      this.updateMuteState();
    }
  }
  adjustVOIPVolume(volume) {
    // TODO
  }
  updateMuteState() {
    let soundsystem = janus.engine.systems.sound;
    let muted = !(soundsystem.canPlaySound && soundsystem.enabled);
    if (room.audionodes) {
      muted = muted || room.audionodes.gain.gain.value == 0;
    }
    this.muted = muted;
  }
});
elation.elements.define('janus-button-voip', class extends elation.elements.ui.popupbutton {
  init() {
    super.init();
    this.defineAttribute('active', { type: 'boolean' });
    this.defineAttribute('muted', { type: 'boolean' });
  }
  create() {
    this.popupcontent = `<janus-voip-picker name="voipsettings"></janus-voip-picker>`;
    super.create();
    this.createPopup();
    this.hidePopup();
    elation.events.add(this.popup.content.elements['picker'], 'voip-picker-select', (ev) => this.hidePopup());
    this.updateMuteState();
//setInterval(() => this.updateMuteState(), 1000);
  }
  updateMuteState() {
    //let muted = !(soundsystem.canPlaySound && soundsystem.enabled);
    let voipclient = this.voipclient;
    if (!this.voipclient) {
      voipclient = document.querySelector('janus-voip-client');
      this.voipclient = voipclient;
      if (this.voipclient) {
        elation.events.add(this.voipclient, 'init', ev => this.updateMuteState());
      }
    }
    let muted = true;
    if (voipclient) {
      if (voipclient.localuser && !this.registeredEvents) {
        elation.events.add(voipclient.localuser, 'mute', () => this.updateMuteState());
        elation.events.add(voipclient.localuser, 'unmute', () => this.updateMuteState());
        elation.events.add(voipclient.localuser, 'update', ev => this.updateMuteState());
        this.registeredEvents = true;
      }
      if (voipclient.localuser && voipclient.localuser.stream && !voipclient.localuser.muted) {
        muted = false;
      }
    }
    if (this.muted != muted) this.muted = muted;
  }
});
elation.elements.define('janus-button-share', class extends elation.elements.ui.button {
  init() {
    super.init();
  }
/*
  create() {
    this.popupcontent = `<janus-voip-picker name="voipsettings"></janus-voip-picker>`;
    super.create();
    this.createPopup();
    this.hidePopup();
    elation.events.add(this.popup.content.elements['picker'], 'voip-picker-select', (ev) => this.hidePopup());
    this.updateMuteState();
//setInterval(() => this.updateMuteState(), 1000);
  }
*/
  handleClick(ev) {
    if (navigator.share) {
      player.disable();
      janus.engine.client.screenshot()
        .then(image => fetch(image))
        .then(res => res.blob())
        .then(blob => {
          var file = new File([blob], "fivars-screenshot.jpg", {type: 'image/jpeg'});
console.log('share the file', file);

          navigator.share({
            title: 'FIVARS Festival',
            text: 'Come join me',
            url: document.location.href,
          }).then(() => console.log('shared!'))
            .catch(error => console.log('sharing error', error));
        });
    }
  }
});
elation.elements.define('janus-button-debug', class extends elation.elements.ui.popupbutton {
  init() {
    super.init();
  }
  create() {
    this.popupcontent = ``;
    super.create();
    this.createPopup();
    this.hidePopup();
  }
  showPopup() {
    super.showPopup();
    let stats = room.getDebugStats();
    let showTextures = function(resolutions) {
      let str = '';
      for (let res in resolutions) {
        str += `<li>${res} `;
        resolutions[res].forEach(img => {
          str += `<img src="${img.src}" style="max-width: 32px; max-height: 32px; display: inline-block; ">`;
        });
        str += `</li>`;
      }
      return str;
    }
    this.popup.content.fromString(`
<section>
  <h2>Objects</h2>
  <ul>
    <li>
      Mesh: ${stats.objects.mesh}
      <ul>
        <li>Vertices: ${stats.geometry.verts}</li>
        <li>Faces: ${stats.geometry.faces}</li>
        <li>Materials: ${stats.materials.count}</li>
      </ul> 
    </li>
    <li>Empty: ${stats.objects.empty}</li>
    <li>
      Lights: ${stats.objects.light}
      <ul>
        <li>Spot: ${stats.lights.spot} (${stats.lights.spot_shadow} with shadows)</li>
        <li>Point: ${stats.lights.point} (${stats.lights.point_shadow} with shadows)</li>
        <li>Directional: ${stats.lights.directional} (${stats.lights.directional_shadow} with shadows)</li>
      </ul>
    </li>
    <li>
      Textures: ${stats.textures.count}
      <ul>
        ${showTextures(stats.textures.resolutions)}
      </ul>
    </li>
  </ul>
    `);
  }
});
