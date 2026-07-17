elation.elements.define('janus.ui.settings', class extends elation.elements.base {
  create() {
    this.reload();
  }
  reload() {
    this.innerHTML = elation.template.get('janus.ui.settings');
    this.persistSettings()
  }
  persistSettings() {
    // source webui configs from localStorage if any ('webui.settings.vr.gaze_control' e.g.)
    if( window.localStorage ){
      for( let i = 0; i < localStorage.length; i++ ){
        const k = localStorage.key(i)
        if( k.match(/^webui\./) ) elation.config.set( k, localStorage.getItem(k) )
      }
    }

    this.store = {
      // here you can define config-paths which should be reflected in elation.config/localStorage
      // example value: "webui.settings.vr.gaze_control": {localStorage:true}
      // this will look for  <ui-toggle label="foo" config="webui.settings.vr.gaze_control"/> 
      // in settings.html and automatically store/initialize its value e.g.
      "webui.settings.mouse.click_left": {localStorage:true},
      "webui.settings.mouse.click_middle": {localStorage:true},
      "webui.settings.mouse.click_right": {localStorage:true},
      "webui.settings.mouse.move_up": {localStorage:true},
      "webui.settings.mouse.move_down": {localStorage:true},
      "webui.settings.mouse.scroll_up": {localStorage:true},
      "webui.settings.mouse.scroll_down": {localStorage:true},
      "webui.settings.keyboard.space": {localStorage:true},
      "webui.settings.keyboard.escape": {localStorage:true},
    }
    elation.events.fire({type: 'webui_settings_store_init', element: this});
    const updateConfig = (e) => {
      let src = e.originalTarget || {}
      let cfgpath = src.getAttribute("config") || src.parentElement.getAttribute("config")
      if( cfgpath ){
        debugger
        elation.config.set( cfgpath, src.value, {localStorage: true} )
      }else{ debugger }
    }
    // *TODO* why does ui-toggle not emit 'toggle' or 'change'?
    this.addEventListener('change', updateConfig ) 

    // initialize webui form values from elation/localstorage config
    for( let k in this.store ){
      this.querySelector(`[config='${k}']`).value = elation.config.get(k)
    }
  }
});
elation.elements.define('janus.ui.settings.button', class extends elation.elements.ui.button {
  create() {
    this.label = 'Settings';
    super.create();
    this.onclick = () => {
      if (!this.window) {
        this.window = janus.ui.openWindow('janus-ui-settings', {
          center: 1,
          title: 'Settings',
          class: 'janus-settings'
        });
        this.window.scrollable = true;
      } else {
        this.window.show();
      }
    };
  }
});
elation.elements.define('janus.ui.settings.ui', class extends elation.elements.base {
  create() {
    janus.ui.addEventListener('appload', (ev) => { this.reload() });
    this.reload();
  }
  reload() {
    var tplvars = {
      apps: []
    };
    var apps = janus.ui.apps;
    for (var k in apps)  {
      tplvars.apps.push({
        name: k,
        app: apps[k]
      });
    };
    this.innerHTML = elation.template.get('janus.ui.settings.ui', tplvars);
  }
});
elation.elements.define('janus.ui.settings.ui.app', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttributes({
      name: { type: 'string' },
      app: { type: 'string' }
    });
  }
  create() {
    var app = this.app;
    if (typeof app == 'string') {
      app = document.querySelector(app);
      if (app) {
        this.app = app;
      }
    }
    if (app instanceof elation.elements.janus.ui.app) {
    }
    this.reload();
  }
  reload() {
console.log('render app', this.name, this);
    this.innerHTML = elation.template.get('janus.ui.settings.ui.app', this);
  }
});
elation.elements.define('janus.ui.settings.ui.component', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttributes({
      name: { type: 'string' },
      component: { type: 'string' }
    });
  }
  create() {
    this.innerHTML = elation.template.get('janus.ui.settings.ui.component', this);
    this.addEventListener('dragstart', (ev) => this.handleDragStart(ev));
    this.addEventListener('dragend', (ev) => this.handleDragEnd(ev));
  }
  handleDragStart(ev) {
    janus.ui.editing = true;
    ev.dataTransfer.setData('text/html', '<' + this.component + '></' + this.component + '>');
    ev.dataTransfer.setData('x-janus/x-component', this.component);
  }
  handleDragEnd(ev) {
    janus.ui.editing = false;
  }
});
elation.elements.define('janus.ui.settings.panels', class extends elation.elements.base {
  create() {
    this.panels = {};
    this.layouts = {
      'default': {
        'topleft': ['janus-ui-navigation'],
        'topright': [],
        'right': [],
        'left': [],
        'bottomright': ['janus-ui-buttons'],
        'bottomleft': ['janus-comms-panel'],
        'top': ['janus-voip-client'],
      }
    };
    let customlayouts = player.getSetting('ui.layouts');
    if (customlayouts) {
      for (var k in customlayouts) {
        this.layouts[k] = customlayouts[k];
      }
    }

    let layoutname = player.getSetting('ui.activelayout', 'default');
    this.layout = layoutname;
    let layout = this.layouts[layoutname] || this.layouts['default'];

    let elements = elation.elements.fromTemplate('janus.ui.settings.panels', this);

    ['topleft', 'top', 'topright', 'left', 'right', 'bottomleft', 'bottom', 'bottomright'].forEach(k => {
      let panel = this.panels[k] = elements[k];
      panel.editable = true;
      let children = layout[k];
      if (children && children.length > 0) {
        let content = elation.elements.create('div');
        for (let i = 0; i < children.length; i++) {
          elation.elements.create(children[i], {
            append: content
          });
        }
        panel.setcontent(content);
      }
    });
  }
});
elation.elements.define('janus.username.picker', class extends elation.elements.base {
  init() {
    this.defineAttributes({
      label: { type: 'string', default: 'Username' },
      buttonlabel: { type: 'string', default: 'Change' },
      confirm: { type: 'boolean', default: false },
      confirmlabel: { type: 'string', default: 'Confirm' },
      onchange: { type: 'callback' },
      onconfirm: { type: 'callback' },
    });
  }
  create() {
    this.elements = elation.elements.fromString(`
      <form name="usernameform">
        <ui-input type="text" label="${this.label}" name="clientid"></ui-input>
        <input type="submit" name="submit" value="${this.confirm ? this.confirmlabel : this.buttonlabel}">
      </form>
    `, this);
    this.elements.usernameform.addEventListener('submit', ev => this.handleFormSubmit(ev));
    this.elements.clientid.addEventListener('input', ev => this.handleInput(ev));
    this.elements.clientid.addEventListener('change', ev => this.handleInputChange(ev));
    //this.elements.clientid.addEventListener('accept', ev => this.handleFormSubmit(ev));
    elation.events.add(this.elements.clientid, 'accept', ev => this.handleFormSubmit(ev));
    this.elements.clientid.value = player.userid;
    if (!this.confirm) {
      this.elements.submit.disabled = true;
    }
  }
  handleFormSubmit(ev) {
    ev.preventDefault();
    let newname = this.elements.clientid.value;
    console.log('Username picker handleFormSubmit', ev.type, newname, player.userid, ev);
    this.elements.submit.disabled = !this.confirm;
    this.setUsername(newname, true);
  }
  handleInput(ev) {
    let changed = (this.elements.clientid.value != player.userid);
    if (this.confirm) {
      this.elements.submit.value = (changed ? this.buttonlabel : this.confirmlabel);
      this.elements.submit.disabled = false;
    } else {
      this.elements.submit.value = this.buttonlabel;
      this.elements.submit.disabled = !changed;
    }
  }
  handleInputChange(ev) {
    ev.stopPropagation();
  }
  setUsername(username, updateplayer) {
    this.elements.clientid.value = username;
    if (updateplayer) {
      if (username != player.userid) {
        player.setUsername(username);
        if (this.confirm) {
          this.elements.submit.value = this.confirmlabel;
          this.elements.submit.disabled = false;
        } else {
          this.elements.submit.disabled = true;
        }
        this.dispatchEvent(new CustomEvent('change', { detail: username }));
      } else if (this.confirm) {
        this.dispatchEvent(new CustomEvent('confirm', { detail: username }));
      }
    }
  }
  handleFormReset() {
  }
});
