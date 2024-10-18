elation.require(['elements.elements', 'elements', 'engine.engine', 'engine.assets', 'engine.things.light_ambient', 'engine.things.light_directional', 'engine.things.light_point', 'janusweb.janusweb', 'janusweb.janusplayer', 'janusweb.janusxrplayer', 'janusweb.ui.main'], function() {
  // If getCurrentScript returns non-null here, then it means we're in release mode
  var clientScript = elation.utils.getCurrentScript();

  elation.extend('janusweb.init', function(args) {
    if (!args) args = {};
    var proto = elation.utils.any(args.protocol, elation.config.get('dependencies.protocol'), document.location.protocol);
    var host = elation.utils.any(args.host, elation.config.get('dependencies.host'), document.location.host);
    var rootdir = elation.utils.any(args.rootdir, elation.config.get('dependencies.rootdir'), document.location.pathname);
    var path = elation.utils.any(args.path, elation.config.get('dependencies.path'), '/');
    var homepage = elation.utils.any(args.homepage, elation.config.get('janusweb.homepage'), document.location.href);
    var corsproxy = elation.utils.any(args.corsproxy && args.corsproxy != 'false', elation.config.get('engine.assets.corsproxy'), document.location.href);
    var container = elation.utils.any(args.container, document.body);
    var fullsize = elation.utils.any(args.fullsize && args.fullsize != 'false', container == document.body);
    var thirdperson = elation.utils.any(args.thirdperson && args.thirdperson != 'false', false);

    if (elation.config.get('serviceworker.enabled') && 'serviceWorker' in navigator) {
      var workerscript = elation.config.get('serviceworker.script', 'service-worker.js');
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

    var usetracking = elation.utils.any(args.tracking, elation.config.get('janusweb.tracking.enabled'), false),
        trackingid = elation.utils.any(args.trackingid, elation.config.get('janusweb.tracking.clientid'), '');
    if (usetracking && usetracking != 'false') {
      elation.config.set('janusweb.tracking.enabled', true);
      elation.config.set('janusweb.tracking.clientid', trackingid);

      var tracking = elation.janusweb.tracking({});
    }
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fullpath + 'janusweb.css';
    document.head.appendChild(link);
    elation.html.addclass(document.body, 'dark');
    elation.html.addclass(document.body, 'janusweb');
    var janusweb = elation.elements.create('janusweb.client', {
      append: container, 
      homepage: homepage, 
      corsproxy: corsproxy, 
      showui: elation.utils.any(args.showui && args.showui != "false", true),
      shownavigation: elation.utils.any(args.shownavigation && args.shownavigation != "false", true),
      uiconfig: args.uiconfig,
      showchat: elation.utils.any(args.showchat && args.showchat != 'false', true),
      usevoip: elation.utils.any(args.usevoip && args.usevoip != 'false', false),
      resolution: args.resolution, 
      fullsize: fullsize,
      url: args.url,
      networking: args.networking,
      autoload: args.autoload,
      stats: args.stats,
      muted: args.muted,
      urltemplate: args.urltemplate,
      useWebVRPolyfill: args.useWebVRPolyfill,
      server: args.server,
      tracking: usetracking,
      trackingid: trackingid,
      avatarsrc: args.avatarsrc,
      thirdperson: thirdperson,
    });
    return new Promise(function(resolve, reject) {
      elation.events.add(janusweb.engine, 'engine_start', function() { resolve(janusweb); });
    });
  });
  elation.elements.define('janusweb.client', class extends elation.elements.engine.client {
    init() {
      super.init();
      this.defineAttributes({
        corsproxy: { type: 'string' },
        homepage: { type: 'string' },
        url: { type: 'string' },
        uiconfig: { type: 'string' },
        showui: { type: 'boolean' },
        shownavigation: { type: 'boolean', default: true },
        showchat: { type: 'boolean', default: true },
        networking: { type: 'boolean', default: true },
        usevoip: { type: 'boolean', default: false },
        autoload: { type: 'boolean', default: true },
        urltemplate: { type: 'string' },
        server: { type: 'string' },
        avatarsrc: { type: 'string' },
        muted: { type: 'boolean', default: false },
        thirdperson: { type: 'boolean', default: false },
      });
    }
    initEngine() {
      this.initLoader();

      var hashargs = elation.url();
       
      //this.enginecfg.stats = this.args.stats;

      this.enginecfg.systems = [];
      this.enginecfg.systems.push("controls");
      this.enginecfg.systems.push("physics");
      this.enginecfg.systems.push("ai");
      this.enginecfg.systems.push("world");
      //if (hashargs.admin == 1) {
        //this.enginecfg.systems.push("admin");
      //}
      this.enginecfg.systems.push("render");
      this.enginecfg.systems.push("sound");
      this.enginecfg.crosshair = false;
      this.enginecfg.picking = true;
      this.enginecfg.fullsize = this.fullsize && this.fullsize != 'false'; // FIXME - type coersion should be doing this
      //this.enginecfg.useWebVRPolyfill = elation.utils.any(this.args.useWebVRPolyfill, true);

      if ('xr' in navigator) {
        navigator.xr.addEventListener('sessiongranted', (ev) => {
          this.startXR();
        });
      }
      window.addEventListener('load', ev => {
        window.scrollTo(0, 1);
      });
      window.addEventListener('touchend', ev => {
        if (ev.target == this.engine.systems.render.renderer.domElement) {
          // FIXME - useragent hack isn't the best way of handling this, but it beats getting stuck in non-immersive fullscreen mode while in a VR headset
          if (navigator.userAgent.indexOf('OculusBrowser') != -1) {
            this.startXR();
          } else if (!this.view.isFullscreen()) {
            this.toggleFullscreen({value: 1});
          }
        }
      });
    }
    initButtons() {
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
    initWorld() {
      var things = this.world.load({
        name: 'janusweb',
        type: 'janusweb',
        properties: {
          corsproxy: elation.utils.any(this.corsproxy, elation.config.get('engine.assets.corsproxy')),
          datapath: elation.config.get('janusweb.datapath'),
          homepage: this.homepage,
          url: this.url,
          showchat: this.showchat,
          networking: this.networking,
          autoload: this.autoload,
          //urltemplate: this.urltemplate,
          server: this.server,
          muted: this.muted,
        }
      });
      this.janusweb = things.children.janusweb;
      this.player = this.janusweb.spawn('janusplayer', 'player', {
        janus: this.janusweb,
        position: [0,0,0],
        mass: 10,
        height: 1.8,
        movespeed: 5000,
        collidable: true,
        usevoip: this.usevoip,
        avatarsrc: this.avatarsrc,
        staticfriction: 2,
        dynamicfriction: 1.9,
        cameraview: (this.thirdperson ? 'thirdperson' : 'firstperson'),
      });
      elation.events.add(this.engine.systems.render, 'render_view_add', (ev) => this.handleRenderViewAdd(ev));

      var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
      this.uiconfig = elation.utils.any(this.player.getSetting('uiconfig'), this.uiconfig, datapath + (datapath[datapath.length-1] != '/' ? '/' : '') + 'assets/webui/default.json');
      if (this.showui && this.shownavigation) {
        this.createUI();
      }
      this.view.pickingactive = true;

      let overlay = this.parentNode.querySelector('janus-overlay');
      if (overlay) {
        this.overlay = overlay;
      }

      elation.engine.assets.initTextureLoaders(this.engine.systems.render, elation.config.get('janusweb.datapath') + 'lib/basis/');
      elation.engine.assets.setDracoPath(elation.config.get('janusweb.datapath') + 'lib/draco/');
      elation.engine.assets.icosapath = elation.config.get('janusweb.datapath') + 'lib/three-icosa/brushes/';
    }
    createUI() {
      if (!this.ui) {
        this.ui = elation.elements.create('janus.ui.main', {
          append: this,
          client: this,
          config: this.uiconfig
        });
      }
    }
    initLoader() {
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
    handleEngineStart(ev) {
      if (this.loadingscreen) {
        this.loadingscreen.container.parentNode.removeChild(this.loadingscreen.container);
      }
    }
    handleEngineError(ev) {
      console.log('omg error!', ev);
      if (this.loadingscreen) {
        this.loadingscreen.label.innerHTML = 'Error!';
        elation.html.addclass(this.loadingscreen.container, 'state_error');
        var err = ev.data;
        var msg = err.message + '\n' + err.stack;

        var errordiv = elation.html.create({tag: 'pre', append: this.loadingscreen.container, content: msg, classname: 'janusweb_error'});
      }
    }
    showMenu() {
    }
    setUIActive(active) {
      if (active) {
        if (this.ui) this.ui.enable();
        if (this.buttons) this.buttons.enable();
      } else {
        if (this.ui) this.ui.disable();
        if (this.buttons) this.buttons.disable();
      }
    }
    showAbout() {
      var aboutwin = elation.ui.window({append: document.body, center: true, title: 'About JanusWeb'});
      var frame = elation.ui.iframe({src: 'http://github.com/jbaicoianu/janusweb/', classname: 'janusweb_about'});
      aboutwin.setcontent(frame);
    }
    isFullscreen() {
      return document.fullscreenElement === this;
    }
    toggleFullscreen(ev, updateOnly) {
      let isfullscreen = this.isFullscreen();
      if (!updateOnly && (typeof ev == 'undefined' || ev.value == 1 || typeof ev.value == 'undefined')) {
        if (!isfullscreen) {
          this.parentNode.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
      if (this.fullscreenbutton) {
        if (isfullscreen) {
          this.fullscreenbutton.addclass('state_fullscreen');
          this.fullscreenbutton.setLabel('Shrink');
        } else {
          this.fullscreenbutton.removeclass('state_fullscreen');
          this.fullscreenbutton.setLabel('Expand');
        }
      }
    }
    configureOptions() {
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
    registerElement(tagname, classobj, extendclass) {
      this.janusweb.registerElement(tagname, classobj, extendclass);
    }
    handleRenderViewAdd(ev) {
      let view = ev.data;
      if (view.xrsession && !this.xrplayer) {
        this.xrplayer = this.player.createObject('xrplayer', {
          session: view.xrsession,
          xrview: view
        });
      }
    }
  });

  if (typeof customElements != 'undefined') {
    elation.elements.define('janus.viewer', class extends elation.elements.base {
      init() {
        super.init();
        this.defineAttributes({
          fullsize: { type: 'boolean', default: true },
          autostart: { type: 'boolean', default: true },
          src: { type: 'string' },
          corsproxy: { type: 'string' },
          homepage: { type: 'string' },
          width: { type: 'integer', default: 640 },
          height: { type: 'integer', default: 480 },
          tracking: { type: 'boolean', default: false },
          trackingid: { type: 'string'  },
          networking: { type: 'boolean', default: true },
          avatarsrc: { type: 'string', default: false },
          uiconfig: { type: 'string', default: false },
          showui: { type: 'boolean', default: true },
          shownavigation: { type: 'boolean', default: true },
          thirdperson: { type: 'boolean', default: false },
        });
      }
      create() {
        if (this.autostart && this.autostart != 'false') {
          elation.janusweb.init(this.getClientArgs());
        } else {
          // FIXME add play button
          let start = () => {
            elation.janusweb.init(this.getClientArgs());
            document.body.removeEventListener('click', start);
          }
          document.body.addEventListener('click', start);
        }
        this.style.overflow = 'hidden';
      }
      getClientArgs() {
        var fullsize = this.fullsize,
            width = (this.fullsize ? window.innerWidth : this.width),
            height = (this.fullsize ? window.innerHeight : this.height);
        var args = {
          url: this.getRoomURL(),
          homepage: this.homepage || this.src,
          tracking: this.tracking,
          trackingid: this.trackingid,
          networking: this.networking,
          corsproxy: this.corsproxy,
          //resolution: width + 'x' + height,
          showui: this.showui && this.showui != 'false',
          shownavigation: this.shownavigation,
          avatarsrc: this.avatarsrc,
          uiconfig: this.uiconfig,
          container: this,
          fullsize: this.fullsize,
          thirdperson: this.thirdperson && this.thirdperson != 'false',
        };
        return args;
      }
      getRoomURL() {
        return this.src || document.location.href;
      }
    });


    elation.elements.define('janus.viewer.frame', class extends elation.elements.janus.viewer {
      init() {
        super.init();
        console.log('init frame', this);
      }
      create() {
        if (this.iframe) return;
        var iframe = document.createElement('iframe');
        var fullsize = this.fullsize;
        iframe.width = (this.fullsize ? window.innerWidth : this.width);
        iframe.height = (this.fullsize ? window.innerHeight : this.height);
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
        if (this.autostart && this.autostart != 'false') {
          content.document.write('<script>startWidget()</script>');
        } else {
          content.document.write('<img id="play" src="https://janusvr.com/widget/JanusWidget/images/play.svg" style="top: calc(50% - 65px); cursor: pointer; ">');
          content.document.write('<script>document.getElementById("play").addEventListener("click", function() { startWidget(); console.log("dur", this); this.parentNode.removeChild(this); })</script>');
        }
        content.document.write('</body></html>');
        content.document.close();

        this.iframe = iframe;
      }
    });
    //document.registerElement('janus-viewer-frame', elation.janusweb.viewer.frame);
    elation.elements.define('janus.viewer.generatedframe', class extends elation.elements.janus.viewer.frame {
      getRoomURL() {
        return 'data:text/html,' + encodeURIComponent(this.getRoomSource());
      }
      getTemplate() {
        return '';
      }
      getRoomSource() {
        if (!this.tplname) {
          this.tplname = this.type + '.src';
          elation.template.add(this.tplname, this.getTemplate());
        }
        return elation.template.get(this.tplname, this);
      }
    });

    elation.elements.define('janus.viewer.image360', class extends elation.elements.janus.viewer.generatedframe {
      getTemplate() {
        return '<title>360° Image | {src}</title><fireboxroom><assets><assetimage id="image360" src="{src}"/></assets><room skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black"><object id="sphere" scale="-500 500 500" image_id="image360" lighting="false" /></room></fireboxroom>';
      }
    });

    elation.elements.define('janus.viewer.video', class extends elation.elements.janus.viewer.generatedframe {
      init() {
        super.init();
        this.defineAttributes({
          loop: { type: 'boolean', default: false },
          vidtitle: { type: 'string' }
        });
      }
      getTemplate() {
        return '<title>Video | {?vidtitle}{vidtitle} | {/vidtitle} {src}</title><fireboxroom><assets><assetvideo id="video" src="{src}" auto_play="true" loop="{?loop}true{else}false{/loop}" /></assets><room use_local_asset="room1" skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black" zdir="0 0 -1" ><Video video_id="video" pos="0 2.5 -5" scale="4 2.5 .1" lighting="false" /></room></fireboxroom>';
      }
    });

    elation.elements.define('janus.viewer.video360', class extends elation.elements.janus.viewer.video {
      getTemplate() {
        return '<title>360° Video | {?vidtitle}{vidtitle} | {/vidtitle} {src}</title><fireboxroom><assets><assetvideo id="video360" src="{src}" auto_play="true" loop="{?loop}true{else}false{/loop}" /></assets><room skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black" zdir="0 0 -1"><object id="sphere" scale="-500 500 500" video_id="video360" lighting="false" rotation="0 90 0" /></room></fireboxroom>';
      }
    });

    elation.elements.define('janus.viewer.model', class extends elation.elements.janus.viewer.generatedframe {
      init() {
        super.init();
        this.defineAttributes({
          modelname: { type: 'string' }
        });
      }
      getTemplate() {
        return '<title>Model | {?modelname}{modelname} | {/modelname} {src}</title><fireboxroom><assets><assetobject id="model" src="{src}"/></assets><room skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black" zdir="0 0 -1"><object id="model" lighting="true" pos="0 0 -5" rotate_deg_per_sec="10" /></room></fireboxroom>';
      }
    });

    elation.elements.define('janus.viewer.avatar', class extends elation.elements.janus.viewer.frame {
      init() {
        super.init();
        this.defineAttributes({
          userid: { type: 'string' }
        });
      }
      getTemplate() {
        return '<fireboxroom><assets></assets><room skybox_left_id="black" skybox_right_id="black" skybox_up_id="black" skybox_down_id="black" skybox_front_id="black" skybox_back_id="black" use_local_asset="room_plane zdir="0 0 -1""><ghost id="{userid}" avatar_src="{src}" lighting="true" pos="0 0 1" rotate_deg_per_sec="20" /></room></fireboxroom>';
      }
    });
    elation.elements.define('janus.overlay', class extends elation.elements.base {
      init() {
        super.init();
        this.defineAttributes({
          autotoggle: { type: 'bool', default: false }
        });
        if (this.autotoggle) {
          elation.events.add(this.player, 'player_enable', ev => { this.hide(); });
          elation.events.add(this.player, 'player_disable', ev => { this.show(); });
        }
      }
      show() {
        super.show();
        if (this.oldparent && !this.parentNode) {
          this.oldparent.appendChild(this);
        }
        elation.events.fire({type: 'overlay_show', element: this});
      }
      hide() {
        super.hide();
        elation.events.fire({type: 'overlay_hide', element: this});
        setTimeout(() => {
          if (this.parentNode) {
            this.oldparent = this.parentNode;
            this.parentNode.removeChild(this);
          }
        }, 1000);
      }
    });
  }
});
