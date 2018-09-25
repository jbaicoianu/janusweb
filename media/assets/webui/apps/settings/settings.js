elation.elements.define('janus.ui.settings', class extends elation.elements.base {
  create() {
    this.reload();
  }
  reload() {
    this.innerHTML = elation.template.get('janus.ui.settings');
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
        'right': ['janus-ui-inventory'],
        'left': ['janus-comms-panel'],
        'bottomright': ['janus-ui-buttons'],
        'bottomleft': ['janus-controls-gamepad'],
      }
    };
    let customlayouts = player.getSetting('ui.layouts');
    if (customlayouts) {
console.log('custom layouts!', customlayouts);
      for (var k in customlayouts) {
        this.layouts[k] = customlayouts[k];
      }
    }

    let layoutname = player.getSetting('ui.activelayout', 'default');
    this.layout = layoutname;
    let layout = this.layouts[layoutname] || this.layouts['default'];
console.log('layoutname:', layoutname, layout);

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
