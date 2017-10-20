elation.require(['engine.engine', 'engine.assets', 'engine.things.light_ambient', 'engine.things.light_directional', 'engine.things.light_point', 'janusweb.janusweb', 'janusweb.chat', 'janusweb.janusplayer', 'janusweb.ui', 'janusweb.configuration', 'janusweb.external.document-register-element'], function() {

  // If getCurrentScript returns non-null here, then it means we're in release mode
  var clientScript = elation.utils.getCurrentScript();

  elation.extend('janusweb.init', function(args) {
    if (!args) args = {};
    var proto = elation.utils.any(args.protocol, elation.config.get('dependencies.protocol'), document.location.protocol);
    var host = elation.utils.any(args.host, elation.config.get('dependencies.host'), document.location.host);
    var rootdir = elation.utils.any(args.rootdir, elation.config.get('dependencies.rootdir'), document.location.pathname);
    var path = elation.utils.any(args.path, elation.config.get('dependencies.path'), '/');
    var homepage = elation.utils.any(args.homepage, elation.config.get('janusweb.homepage'), document.location.href);
    var container = elation.utils.any(args.container, document.body);
    var fullsize = (container == document.body);

    if (elation.config.get('serviceworker.enabled') && 'serviceWorker' in navigator) {
      var workerscript = elation.config.get('serviceworker.script', 'serviceworker.js');
      navigator.serviceWorker.register(workerscript)
      .then(function(reg) {
        // registration worked
        console.log('ServiceWorker registration succeeded. Scope is ' + reg.scope);
      }).catch(function(error) {
        // registration failed
        console.log('ServiceWorker registration failed with ' + error);
      });
    }

    var fullpath = proto + '//' + host + rootdir;
    if (clientScript) { // && clientScript.src.match(/\/janusweb.js^/)) {
      var parts = clientScript.src.split('/');
      var fname = parts.pop();
      fullpath = parts.join('/') + '/';
      parts.shift();
      parts.shift();
      parts.shift();
      var rootdir = '/';
      if (parts.length > 0) { 
        rootdir += parts.join('/') + '/';
      }

      elation.config.set('dependencies.main', fname);
      elation.config.set('dependencies.rootdir', rootdir);
      elation.config.set('dependencies.host', document.location.host);
      elation.config.set('dependencies.protocol', document.location.protocol);
      elation.config.set('janusweb.datapath', fullpath + 'media/');
      elation.config.set('engine.assets.font.path', fullpath + 'media/fonts/');
    }
    elation.config.set('dependencies.path', fullpath);

    var usetracking = elation.utils.any(args.tracking, elation.config.get('janusweb.tracking.enabled'), false);
    if (usetracking) {
      var tracking = elation.janusweb.tracking({});
    }

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fullpath + 'janusweb.css';
    document.head.appendChild(link);
    elation.html.addclass(document.body, 'dark');
    elation.html.addclass(document.body, 'janusweb');
    var janusweb = elation.janusweb.client({
      append: container, 
      homepage: homepage, 
      shownavigation: args.shownavigation,
      showchat: elation.utils.any(args.showchat, true),
      usevoip: elation.utils.any(args.usevoip, false),
      resolution: args.resolution, 
      url: args.url,
      networking: args.networking,
      autoload: args.autoload,
      stats: args.stats,
      muted: args.muted,
      urltemplate: args.urltemplate,
      useWebVRPolyfill: args.useWebVRPolyfill,
      server: args.server,
    });
    return new Promise(function(resolve, reject) {
      elation.events.add(janusweb.engine, 'engine_start', function() { resolve(janusweb); });
    });
  });
  elation.component.add('janusweb.client', function() {
    this.initEngine = function() {
      this.initLoader();

      var hashargs = elation.url();
       
      this.enginecfg.stats = this.args.stats;

      this.enginecfg.systems = [];
      this.enginecfg.systems.push("controls");
      this.enginecfg.systems.push("physics");
      this.enginecfg.systems.push("ai");
      this.enginecfg.systems.push("world");
      //if (hashargs.admin == 1) {
        this.enginecfg.systems.push("admin");
      //}
      this.enginecfg.systems.push("render");
      this.enginecfg.systems.push("sound");
      this.enginecfg.crosshair = false;
      this.enginecfg.picking = true;
      this.enginecfg.useWebVRPolyfill = elation.utils.any(this.args.useWebVRPolyfill, true);

      this.buttons = elation.ui.buttonbar({append: this.container, classname: 'janusweb_ui_buttons'})
      setTimeout(elation.bind(this, function() {
        this.initButtons();
      }), 0);
    }
    this.initButtons = function() {
      this.sharebutton = elation.ui.button({classname: 'janusweb_sharing', label: 'Share'});
      this.sharedialog = elation.engine.sharing({append: document.body, client: this, anchor: this.sharebutton});
      elation.events.add(this.sharebutton, 'ui_button_click', elation.bind(this.sharedialog, this.sharedialog.showShareDialog));
      this.buttons.add('sharing', this.sharebutton);

      this.fullscreenbutton = elation.ui.button({ classname: 'janusweb_fullscreen', label: 'Expand' });
      elation.events.add(this.fullscreenbutton, 'ui_button_click', elation.bind(this, this.toggleFullscreen));
      elation.events.add(document, 'fullscreenchange,webkitfullscreenchange,mozfullscreenchange', elation.bind(this, function(ev) { this.toggleFullscreen({ value: this.view.isFullscreen() }, true); this.fullscreenbutton.container.blur(); this.view.rendersystem.renderer.domElement.focus(); }));
      this.buttons.add('fullscreen', this.fullscreenbutton);

      this.configbutton = elation.ui.button({classname: 'janusweb_config', label: 'Config', events: { click: elation.bind(this, this.configureOptions) } });
      this.buttons.add('config', this.configbutton);

      elation.events.add(document, 'pointerlockchange', elation.bind(this, function() { this.setUIActive(document.pointerLockElement === null); }));
    }
    this.initWorld = function() {
      var things = this.world.load({
        name: 'janusweb',
        type: 'janusweb',
        properties: {
          corsproxy: elation.config.get('engine.assets.corsproxy'),
          datapath: elation.config.get('janusweb.datapath'),
          homepage: this.args.homepage,
          url: this.args.url,
          showchat: this.args.showchat,
          networking: this.args.networking,
          autoload: this.args.autoload,
          urltemplate: this.args.urltemplate,
          server: this.args.server,
          muted: this.args.muted,
        }
      });
      this.janusweb = things.children.janusweb;
      this.player = this.janusweb.spawn('janusplayer', 'player', {
        janus: this.janusweb,
        position: [0,0,0],
        mass: 10,
        movespeed: 5000,
        collidable: true,
        usevoip: this.args.usevoip
      });

      this.shownavigation = elation.utils.any(this.args.shownavigation, true);
      if (this.shownavigation) {
        this.ui = elation.janusweb.ui({append: document.body, client: this});
      }
    }
    this.initLoader = function() {
      var loader = document.getElementsByClassName('engine_loading')[0];
      if (loader) {
        var logo = loader.getElementsByTagName('svg')[0];
        var label = loader.getElementsByClassName('janusweb_loading_status')[0];
        this.loadingscreen = {
          container: loader,
          logo: logo,
          label: label
        };
        elation.events.add(this, 'engine_error', elation.bind(this, this.handleEngineError));
        elation.events.add(this.engine, 'engine_start', elation.bind(this, this.handleEngineStart));
      }
    }
    this.handleEngineStart = function(ev) {
      if (this.loadingscreen) {
        this.loadingscreen.container.parentNode.removeChild(this.loadingscreen.container);
      }
    }
    this.handleEngineError = function(ev) {
      console.log('omg error!', ev);
      if (this.loadingscreen) {
        this.loadingscreen.label.innerHTML = 'Error!';
        elation.html.addclass(this.loadingscreen.container, 'state_error');
        var err = ev.data;
        var msg = err.message + '\n' + err.stack;

        var errordiv = elation.html.create({tag: 'pre', append: this.loadingscreen.container, content: msg, classname: 'janusweb_error'});
      }
    }
    this.showMenu = function() {
    }
    this.setUIActive = function(active) {
      if (active) {
        if (this.ui) this.ui.enable();
        if (this.buttons) this.buttons.enable();
      } else {
        if (this.ui) this.ui.disable();
        if (this.buttons) this.buttons.disable();
      }
    }
    this.showAbout = function() {
      var aboutwin = elation.ui.window({append: document.body, center: true, title: 'About JanusWeb'});
      var frame = elation.ui.iframe({src: 'http://github.com/jbaicoianu/janusweb/', classname: 'janusweb_about'});
      aboutwin.setcontent(frame);
    }
    this.toggleFullscreen = function(ev, updateOnly) {
      var view = this.view;
      if (!updateOnly && view && (ev.value == 1 || typeof ev.value == 'undefined')) {
        view.toggleFullscreen();
      }
      if (view.isFullscreen()) {
        this.fullscreenbutton.addclass('state_fullscreen');
        this.fullscreenbutton.setLabel('Shrink');
      } else {
        this.fullscreenbutton.removeclass('state_fullscreen');
        this.fullscreenbutton.setLabel('Expand');
      }
    }
    this.configureOptions = function() {
      if (!this.configmenu) {
        var configpanel = elation.janusweb.configuration({client: this});
        this.configmenu = elation.ui.window({
          append: document.body,
          classname: this.name + '_config',
          center: true,
          resizable: false,
          title: 'Configuration',
          controls: true,
          maximize: false,
          minimize: false,
          content: configpanel
        });
      }
      this.configmenu.show();
    }
    this.registerElement = function(tagname, classobj, extendclass) {
      this.janusweb.registerElement(tagname, classobj, extendclass);
    }
  }, elation.engine.client);

  if (typeof customElements != 'undefined') {
    elation.extend('janusweb.viewer.base', class extends HTMLElement {
      get fullscreen() {
        return this.getAttribute('fullscreen');
      }
      set autostart(fullscreen) {
        return this.setAttribute('fullscreen', fullscreen);
      }
      get autostart() {
        return this.getAttribute('autostart');
      }
      set autostart(autostart) {
        return this.setAttribute('autostart', autostart);
      }
      get src() {
        return this.getAttribute('src');
      }
      set src(src) {
        return this.setAttribute('src', src);
      }
      get width() {
        return this.getAttribute('width') || 640;
      }
      set width(width) {
        return this.setAttribute('width', width);
      }
      get height() {
        return this.getAttribute('height') || 480;
      }
      set height(height) {
        return this.setAttribute('height', width);
      }
      connectedCallback() {
        this.init();
      }
      init() {
        var iframe = document.createElement('iframe');
        var fullscreen = this.fullscreen;
        iframe.width = (this.fullscreen ? window.innerWidth : this.width);
        iframe.height = (this.fullscreen ? window.innerHeight : this.height);
        iframe.setAttribute('allowvr', 'yes');
        iframe.setAttribute('allowfullscreen', true);
        iframe.setAttribute('allow', 'vr');
        iframe.style = "border: 0px;";
        this.appendChild(iframe);
        var content = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
        content.document.open();
        content.document.write('<html><body style="overflow: hidden">');
        content.document.write('<script src="' + clientScript.src + '"></script>');
        content.document.write('<script>function startWidget() { elation.janusweb.init(' + JSON.stringify(this.getClientArgs()) + '); }</script>');
        if (this.autostart) {
          content.document.write('<script>startWidget()</script>');
        } else {
          content.document.write('<img id="play" src="https://janusvr.com/widget/JanusWidget/images/play.svg" style="top: calc(50% - 65px); cursor: pointer; ">');
          content.document.write('<script>document.getElementById("play").addEventListener("click", function() { startWidget(); console.log("dur", this); this.parentNode.removeChild(this); })</script>');
        }
        content.document.write('</body></html>');
        content.document.close();
      }
      getClientArgs() {
        var fullscreen = this.fullscreen,
            width = (this.fullscreen ? window.innerWidth : this.width),
            height = (this.fullscreen ? window.innerHeight : this.height);
        var args = {
          url: this.getRoomURL(),
          //resolution: width + 'x' + height,
          shownavigation: false,
        };
        return args;
      }
      getRoomURL() {
        return this.src || document.location.href;
      }
    });
    customElements.define('janus-viewer', elation.janusweb.viewer.base);

    elation.extend('janusweb.viewer.image360', class extends elation.janusweb.viewer.base {
      getRoomURL() {
        return 'data:text/html,' + encodeURIComponent('<fireboxroom><assets><assetimage id="image360" src="' + this.src + '"/></assets><room skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black"><object id="sphere" scale="-500 500 500" image_id="image360" lighting="false" /></room></fireboxroom>');
      }
    });
    customElements.define('janus-viewer-image360', elation.janusweb.viewer.image360);

    elation.extend('janusweb.viewer.video', class extends elation.janusweb.viewer.base {
      get loop() {
        return this.getAttribute('loop');
      }
      set loop(loop) {
        return this.setAttribute('loop', loop);
      }
      getRoomURL() {
        return 'data:text/html,' + encodeURIComponent('<fireboxroom><assets><assetvideo id="video" src="' + this.src + '" auto_play="true" loop="' + (this.loop ? 'true' : 'false') + '" /></assets><room use_local_asset="room1" skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black"><Video video_id="video" pos="0 2.5 -5" scale="4 2.5 .1" lighting="false" /></room></fireboxroom>');
      }
    });
    customElements.define('janus-viewer-video', elation.janusweb.viewer.video);

    elation.extend('janusweb.viewer.video360', class extends elation.janusweb.viewer.video {
      getRoomURL() {
        return 'data:text/html,' + encodeURIComponent('<fireboxroom><assets><assetvideo id="video360" src="' + this.src + '" auto_play="true" loop="' + (this.loop ? 'true' : 'false') + '" /></assets><room skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black"><object id="sphere" scale="-500 500 500" video_id="video360" lighting="false" /></room></fireboxroom>');
      }
    });
    customElements.define('janus-viewer-video360', elation.janusweb.viewer.video360);

    elation.extend('janusweb.viewer.model', class extends elation.janusweb.viewer.base {
      getRoomURL() {
        return 'data:text/html,' + encodeURIComponent('<fireboxroom><assets><assetobject id="model" src="' + this.src + '"/></assets><room skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black"><object id="model" lighting="true" pos="0 0 -5" rotate_deg_per_sec="10" /></room></fireboxroom>');
      }
    });
    customElements.define('janus-viewer-model', elation.janusweb.viewer.model);
  }
});
