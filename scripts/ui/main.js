elation.require(['utils.template', 'elements.elements', 'elements.ui.all', 'elements.collection.all'], function() {
  elation.elements.define('janus.ui.app', class extends elation.elements.base {
    init() {
      super.init();
      this.apps = {};
      this.applist = [];
      this.components = [];
      this.defineAttributes({
        name: { type: 'string' },
        src: { type: 'string' },
        toplevel: { type: 'boolean', default: false },
        removable: { type: 'boolean', default: false }
      });
    }
    create() {
    }
    loadConfig(url) {
      if (!url) url = this.src;
      return new Promise((resolve, reject) => {
        console.log('Loading UI config:', url);
        fetch(url)
          .then((r) => r.json())
          .catch((e) => {
            console.error('Failed to load UI config:', this, e);
            reject();
          })
          .then((json) => this.processJSON(url, json))
          .then(() => { this.dispatchEvent({type: 'appload'}); })
          .then(resolve, reject)
      });
    }
    processJSON(url, json) {
      var baseurl = this.getBaseURL(url);
      return new Promise((resolve, reject) => {
        //console.log('process the json', json);
        this.components = json.components;

        this.loadIncludes(json.includes, baseurl)
          .then(() => this.loadApps(json.apps, baseurl))
          .then(() => this.loadTemplates(json.templates, baseurl))
          .then(() => this.loadScriptsAndCSS(json.scripts, json.css, baseurl))
          .then(() => resolve(json));
      });
    }
    loadIncludes(includes, baseurl) {
      var promises = [];
      if (includes) {
        for (var i = 0; i < includes.length; i++) {
          //console.log(' - load include', includes[i], baseurl);
          promises.push(this.loadConfig(this.resolveFullURL(includes[i], baseurl)));
        }
        return Promise.all(promises);
      } else {
        return new Promise((resolve, reject) => resolve());
      }
    }
    loadApp(name, url, toplevel, removable) {
      let appargs = {
        name: name,
        src: url
      };
      if (toplevel) {
        appargs.toplevel = 1;
      }
      if (removable === undefined) removable = true;
      appargs.removable = (removable ? 1 : false);

      let app = elation.elements.create('janus-ui-app', appargs);
      this.apps[name] = app;
      this.applist.push(app);
          //console.log(' - load app', k, apps[k], baseurl);
      app.addEventListener('appload', (ev) => { this.dispatchEvent({type: 'appload'}); });

      this.appendChild(app);
      return app.loadConfig();
    }
    loadApps(apps, baseurl) {
      var promises = [];
      if (!baseurl) baseurl = '';
      if (apps) {
        for (var k in apps) {
          let promise = this.loadApp(k, baseurl + '/' + apps[k]);
          promises.push(promise);
        }
        return Promise.all(promises);
      } else {
        return new Promise((resolve, reject) => resolve());
      }
    }
    loadScriptsAndCSS(scripts, css, baseurl) {
      //console.log('get all these scripts and css', scripts, css);
      var promises = [];
      if (scripts) {
        for (var i = 0; i < scripts.length; i++) {
          promises.push(new Promise((resolve, reject) => {
            var scripturl = this.resolveFullURL(scripts[i], baseurl);
            
            elation.file.get('javascript', scripturl, () => resolve());
          }));
        }
      }
      if (css) {
        for (var i = 0; i < css.length; i++) {
          var cssurl = this.resolveFullURL(css[i], baseurl);
          
          elation.file.get('css', cssurl);
        }
      }
      return Promise.all(promises);
    }
    loadTemplates(templates, baseurl) {
      //console.log('get all these templates', templates, baseurl);
      var promises = [];
      if (templates) {
        for (var k in templates) {
          var templateurl = this.resolveFullURL(templates[k], baseurl);
          promises.push(this.loadTemplate(k, templateurl));
        }
      }
      return Promise.all(promises);
    }
    loadTemplate(name, url) {
      //console.log('load template:', name, url);
      return new Promise((resolve, reject) => {
        fetch(url).then((r) => r.text().then((t) => { 
          elation.template.add(name, t);
          resolve(); 
        }));
      });
    }
    resolveFullURL(url, baseurl) {
      if (!baseurl) {
        baseurl = this.getBaseURL(this.src);
      }
      var baseparts = baseurl.split('/');
      var urlparts = url.split('/');
      if (urlparts[0][0] == '.') {
        if (urlparts[0] == '.') {
          urlparts.shift();
        }
        while (urlparts[0] == '..') {
          urlparts.shift();
          baseparts.pop();
        }
        return baseparts.join('/') + '/' + urlparts.join('/');
      }
      return url;
    }
    getBaseURL(url) {
      var urlparts = url.split('/');
      urlparts.pop();
      return urlparts.join('/');
    }
  });
  elation.elements.define('janus.ui.main', class extends elation.elements.janus.ui.app {
    init() {
      super.init();
      this.defineAttributes({
        config: { type: 'string' },
        client: { type: 'object' },
        editing: { type: 'boolean', set: this.updateEditMode }
      });

      this.handleDragOver = this.handleDragOver.bind(this);
      this.handleDrop = this.handleDrop.bind(this);
    }
    create() {
      var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
      var configurl = this.config || datapath + (datapath[datapath.length - 1] != '/' ? '/' : '') + 'assets/webui/default.json';
      try {
        this.installedapps = elation.elements.create('collection.localindexed', {index: 'name', storagekey: 'janusweb.ui.installedapps'});
        this.installedapps.load();
      } catch (e) {
        this.installedapps = elation.elements.create('collection.indexed', {index: 'name', storagekey: 'janusweb.ui.installedapps'});
      }
      this.container = elation.elements.create('div', {
        append: this,
        class: 'janus-ui-container'
      });
      var promises = [];
      promises.push(this.loadApp('default', configurl, true, false));
      var installed = this.installedapps.items;
      for (var i = 0; i < installed.length; i++) {
        promises.push(this.loadApp(installed[i].name, installed[i].url, true).catch(error => { return error }));
      }

      Promise.all(promises).then((uicfg) => {
        console.log('UI config', uicfg);
        this.container.innerHTML = elation.template.get('janusweb.ui');
      });
    }
    updateEditMode(editmode) {
      if (editmode) {
        if (!this.applayout) {
          this.applayout = elation.elements.create('janus-ui-applayout', { append: this });
        }
        this.addEventListener('dragover', this.handleDragOver);
        this.addEventListener('drop', this.handleDrop);
        this.applayout.show();
      } else {
        this.removeEventListener('dragover', this.handleDragOver);
        this.removeEventListener('drop', this.handleDrop);
        this.applayout.hide();
      }
    }
    openWindow(component, args) {
      if (!args) args = {};
      if (!args.append) args.append = this;
      var win = elation.elements.create('ui-window', args);
      win.setcontent('<' + component + '></' + component + '>');
      return win;
    }
    installApp(name, url) {
      this.installedapps.add({name: name, url: url});
      return this.loadApp(name, url);
    }
    uninstallApp(name) {
      var app = this.installedapps.remove({name: name});

      return;
    }

    handleDragOver(ev) {
      if (this.applayout) {
        this.applayout.setTarget(ev.target);
      }
      ev.preventDefault();
    }
    handleDrop(ev) {
      var component = ev.dataTransfer.getData('x-janus/x-component');
      if (component) {
        //this.applayout.target.innerHTML += '<' + component + '></' + component + '>';
        var el = elation.elements.create(component, {
          preview: 1,
          append: this.applayout.target
        });
      }
    }
  });
  elation.elements.define('janus.ui.applayout', class extends elation.elements.base {
    init() {
    }
    create() {
      this.taglabel = elation.elements.create('ui-label', {
        append: this
      });
      var region_top = elation.elements.create('div', {
        append: this
      });
    }
    getParentComponent(el, attr) {
      var p = el;
      while (p && !(p instanceof elation.elements.base && (attr !== undefined && p[attr]))) {
        p = p.parentNode;
      }
      return p;
    }
    setTarget(target) {
      var component = this.getParentComponent(target, 'editable');
      if (this.target !== component) {
        if (component) {
          //console.log('set target!', component);
          this.taglabel.setLabel(component.nodeName.toLowerCase());
          var dim = component.getBoundingClientRect();

          this.style.left = dim.x + 'px';
          this.style.top = dim.y + 'px';
          this.style.width = dim.width + 'px';
          this.style.height = dim.height + 'px';
          this.show();
        } else {
          this.hide();
        }
        this.target = component;
      }
    }
  });
});
