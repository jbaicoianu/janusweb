elation.require([
  'janusweb.config', 'engine.things.generic','janusweb.remoteplayer', 'janusweb.room', 'janusweb.tracking', 'janusweb.multiplayermanager', 'janusweb.external.JanusFireboxParser', 'utils.proxy',
  'janusweb.elements.raycaster', 'janusweb.elements.teleporter'], function() {

  elation.requireCSS('janusweb.janusweb');
  elation.component.add('engine.things.janusweb', function() {
    this.rooms = {};
    this.version = 'janusweb-1.0rc3';
    this.settings = {
      multiplayer: true,
      sessiontracking: true,
      jsdebugger: false,
      selfavatar: false,
      maxmemory: 2048,
      comfortmode: false,
      downloadcache: true,
      antialiasing: true,
      assetshaders: true,
      assetimages: true,
      sounds: true,
      leapmotionhmd: true,
      editmode: false,
      crosshair: false,
      gamepad: true,
      portalhotkeys: false,
      decouplehead: false,
      mousepitch: true,
      invertpitch: false,
      avatarlighting: true,
      uivoice: true,
      launchurl: 'http://www.janusvr.com/index.html',
      server: 'presence.janusvr.com',
      port: 5566,
      rate: 200,
      fov: 70.0,
      rotationspeed: 50.0,
      hidemenu: false
    };
    this.scriptframeargs = [
      1000/60
    ];
    this.typemap = {
      'object': 'janusobject',
      'link': 'janusportal',
      'text': 'janustext',
      'paragraph': 'janusparagraph',
      'image': 'janusimage',
      'image3d': 'janusimage',
      'video': 'janusvideo',
      'sound': 'janussound',
      'light': 'januslight',
      'particle': 'janusparticle',
      'ghost': 'janusghost',
    };
    this.classmap = {};
    this.customElements = {};


    this.postinit = function() {
      this.defineProperties({
        url:            { type: 'string', default: false },
        homepage:       { type: 'string', default: "" },
        corsproxy:      { type: 'string', default: '' },
        shownavigation: { type: 'boolean', default: true },
        showchat:       { type: 'boolean', default: true },
        datapath:       { type: 'string', default: '/media/janusweb' },
        autoload:       { type: 'boolean', default: true },
        networking:     { type: 'boolean', default: true },
        server:         { type: 'string', default: null },
        port:           { type: 'integer', default: null },
        urltemplate:    { type: 'string', default: false },
        muted:          { type: 'boolean', default: false },
      });
      elation.events.add(window, 'popstate', elation.bind(this, this.handlePopstate));

      this.bookmarks = elation.collection.localindexed({index: 'url', storagekey: 'janusweb.bookmarks'});

      if (this.corsproxy != '') {
        elation.engine.assets.setCORSProxy(this.corsproxy);
      }
      this.assetpack = elation.engine.assets.loadAssetPack(this.properties.datapath + 'assets.json', this.properties.datapath);
      this.parser = new JanusFireboxParser();
      this.scriptingInitialized = false;

      this.engine.systems.controls.addContext('janus', {
        //'load_url': [ 'keyboard_tab', elation.bind(this, this.showLoadURL) ],
        'room_debug': [ 'keyboard_f6', elation.bind(this, this.showRoomDebug) ],
        'chat': [ 'keyboard_t', elation.bind(this, this.showChat) ],
        'bookmark': [ 'keyboard_ctrl_b', elation.bind(this, this.addBookmark) ],
        'mute': [ 'keyboard_ctrl_m', elation.bind(this, this.mute) ]
      });
      this.engine.systems.controls.activateContext('janus');

      if (this.muted) {
        this.mute();
      }

      this.network = elation.janusweb.multiplayermanager({
        janusweb: this,
        server: this.server,
        player: this.engine.client.player
      });

      elation.events.add(this.engine.systems.render.views.main, 'render_view_prerender', elation.bind(this, this.updatePortals));
      if (this.urltemplate) {
        dust.filters.stripunsafe = function(s) {
          return s.replace(/:\//g, '');
        }
        elation.template.add('janusweb.url', this.urltemplate);
      }
      this.initScripting();
      // TODO - this should be config-driven
      this.registerAdditionalElements(['raycaster', 'teleporter']);
    }
    this.initScripting = function() {
      if (this.scriptingInitialized) return;

      this.registerBuiltinElements({
        'object': 'janusobject',
        'link': 'janusportal',
        'text': 'janustext',
        'paragraph': 'janusparagraph',
        'image': 'janusimage',
        'image3d': 'janusimage',
        'video': 'janusvideo',
        'sound': 'janussound',
        'light': 'januslight',
        'particle': 'janusparticle',
        'ghost': 'janusghost',
      });

      window.delta_time = 1000/60;
      window.janus = new elation.proxy(this, {
        version:           ['property', 'version',       { readonly: true}],
        versiononline:     ['property', 'versiononline', {readonly: true}],
        currentkey:        ['property', 'currentkey',    {readonly: true}],
        chat:              ['property', 'chat.messagelist.items', {readonly: true}],
        networkstatus:     ['property', 'network.status', {readonly: true}],
        networkerror:      ['property', 'network.error', {readonly: true}],
        roomserver:        ['property', 'network.server'],
        playercount:       ['property', 'network.playerCount'],
        bookmarkurl:       ['property', 'bookmarks.items'],
        bookmarkthumb:     ['property', 'bookmarks.items'], // FIXME - need to filter?
        playerlist:        ['property', ''],
        settings:          ['property', 'settings'],
        userid:            ['property', 'userId'],
        avatarlighting:    ['property', 'settings.avatarlighting'],

        currenturl:        ['function', 'getCurrentURL'],
        tricount:          ['function', 'getTriangleCount'],
        locked:            ['function', 'isLocked'],
        getsetting:        ['function', 'getSetting'],
        setsetting:        ['function', 'setSetting'],
        roomprogress:      ['function', 'currentroom.getProgress'],
        launchurl:         ['function', 'load'],
        navback:           ['function', 'navigateBack'],
        navforward:        ['function', 'navigateForward'],
        load:              ['function', 'navigateTo'],
        navhome:           ['function', 'navigateHome'],
        chatsend:          ['function', 'sendChatMessage'],
        sync:              ['function', 'currentroom.sync'],
        reset:             ['function', 'reset'],
        quit:              ['function', 'quit'],
        focus:             ['function', 'focus'],
        unfocus:           ['function', 'blur'],
        saveroom:          ['function', 'saveRoom'],
        roomcode:          ['function', 'getRoomCode'],
        setroomcode:       ['function', 'setRoomCode'],
        setuserid:         ['function', 'setUsername'],
        getuserid:         ['function', 'getUsername'],
        setavatarlighting: ['function', 'setAvatarLighting'],
        getavatarlighting: ['function', 'getAvatarLighting'],
        resetavatar:       ['function', 'resetAvatar'],
        hasFocus:          ['function', 'hasFocus'],
        registerElement:   ['function', 'registerElement'],
        extendElement:     ['function', 'extendElement'],
      });

      //THREE.Vector3.prototype.toString = function() { return this.toArray().map(function(d) { return d.toFixed(4); }).join(' '); } 
      window.Vector = function(x, y, z, w) {
        if (x) {
          if (x._target && x._target instanceof THREE.Vector3) return x._target.clone();
          if (x instanceof THREE.Vector3) return x.clone();
        }
        if (y === undefined) y = x;
        if (z === undefined) z = y;

        return (w === undefined ? new THREE.Vector3(x, y, z) : new THREE.Vector4(x, y, z, w));
      }
      window.V = window.Vector;
      window.translate = function(v1, v2) {
        return new THREE.Vector3().addVectors(v1, v2);
      }
      window.distance = function(v1, v2) {
        return v1.distanceTo(v2);
      }
      window.scalarMultiply = function(v, s) {
        var ret = new THREE.Vector3().copy(v);
        if (s instanceof THREE.Vector3) {
          ret.x *= s.x;
          ret.y *= s.y;
          ret.z *= s.z;
        } else {
          ret.multiplyScalar(s);
        }
        return ret;
      }
      window.cross = function(v1, v2) {
        return new THREE.Vector3().crossVectors(v1, v2);
      }
      window.normalized = function(v) {
        return new THREE.Vector3().copy(v).normalize();
      }
      window.equals = function(v1, v2) {
        return v1.equals(v2);
      }
      window.copy = function(v1, x, y, z) {
        if (x instanceof THREE.Vector3) {
          v1.copy(x);
        } else if (elation.utils.isnumeric(x)) {
          if (typeof y != 'undefined' && typeof z != 'undefined') {
            v1.set(x, y, z);
          } else {
            v1.set(x, x, x);
          }
        }
        return v1;
      }
      window.add = function(v1, v2) {
        return v1.add(v2);
      }
      window.scale = function(v1, s) {
        return v1.multiplyScalar(s);
      }
      window.print = function() {
        console.log.apply(console, arguments);
        janus._target.chat.addmessage({userId: 'room', message: arguments[0]});
      }
      window.debug = function() {
        console.log.apply(console, arguments);
      }
      window.removeKey = function(dict, key) {
        delete dict[key];
      }
      var uniqueId = 1;
      window.uniqueId = function() {
        return uniqueId++;
      }
      this.scriptingInitialized = true;
    }

    this.createChildren = function() {
      var hashargs = elation.url();
      var starturl = hashargs['janus.url'] || this.properties.url || this.properties.homepage;
      var player = this.engine.client.player;
      //setTimeout(elation.bind(this, this.load, starturl, true), 5000);
      //this.initScripting();
      this.userId = player.getUsername();
      player.player_id = this.userId; // FIXME - player spawns without an id, so we fix it up here
      window.player = player.getProxyObject();
      if (this.networking) {
        this.network.enable(player);
      }

      if (this.autoload) {
        this.load(starturl, true);
      }

      if (this.showchat) {
        this.chat = elation.janusweb.chat({append: document.body, client: this.engine.client, network: this.network});
      }
    }
    this.clear = function() {
      if (this.currentroom) {
        this.remove(this.currentroom);
        //this.currentroom.die();
        //setTimeout(elation.bind(this.currentroom, this.currentroom.die), 1000);
        //this.currentroom.die();
        this.currentroom.disable();
        //this.leave_room(this.currentroom.url);
        this.currentroom = false;
      }
      this.refresh();
    }
    this.load = function(url, makeactive, baseurl) {
      var roomname = url;

      var room = this.spawn('janusroom', roomname, {
        url: url,
        janus: this,
        baseurl: baseurl,
        corsproxy: this.corsproxy
      });
      // FIXME - should be able to spawn without adding to the heirarchy yet
      this.remove(room);

      this.network.registerRoom(room, true);

      this.rooms[room.roomid] = room;
      //console.log('made new room', url, room);
      this.loading = false;
      if (room && makeactive) {
        this.setActiveRoom(url);
      }
      this.initScripting();
      return room;
    }
    this.loadFromSource = function(source, makeactive, baseurl) {
      var dataurl = 'data:text/html,' + encodeURIComponent(source);
      return this.load(dataurl, makeactive, baseurl)
    }
    this.setActiveRoom = function(url, pos, skipURLUpdate) {
      this.clear();

      var room = false;
      this.loading = true;

      if (elation.utils.isString(url)) {
        var roomid = this.roomid = md5(url);
        if (this.rooms[roomid]) {
          room = this.rooms[roomid];
        }
      } else if (url.type == 'janusroom') {
        room = url;
        url = room.url;
      }
      var player = this.engine.client.player;

      if (room) {
        var changed = this.properties.url != url;
        if (!url) {
          url = this.properties.homepage || this.properties.url;
        } else {
          this.properties.url = url;
        }
        if (this.currentroom !== room) {
          this.currentroom = room;

          window.room = this.currentroom.getProxyObject();

          player.setRoom(room);
          this.add(this.currentroom);
          this.currentroom.setActive();
          this.properties.url = url;
          this.loading = false;
          elation.events.fire({element: this, type: 'room_change', data: url});
        }
        if (!pos) pos = this.currentroom.playerstartposition;
        if (pos) {
          player.properties.position.fromArray(pos);
          player.properties.orientation.copy(this.currentroom.playerstartorientation);
        }
        if (changed && !skipURLUpdate) {
          this.updateClientURL(url);
        }

        if (!this.currentroom.loaded) {
          elation.events.add(this.currentroom, 'janus_room_load', elation.bind(this, function() {
            this.currentroom.enable();
          }));
        } else {
          this.currentroom.enable();
        }
        //this.enter_room(url);
      } else {
        this.load(url, true);
      }
    }
    this.getFixedURL = function(url) {
      // Our 'clean' client URLs don't contain a : because many services have problems parsing them
      var m = url.match(/^(https?)\/\/?(.*)$/i);
      if (m) {
        url = m[1] + '://' + m[2];
      }
      return url;
    }
    this.updateClientURL = function(url) {
      if (this.urltemplate) {
        var re = new RegExp(elation.template.get('janusweb.url', {url: '(.*)'}).replace('/', '\\/'));
        var m = document.location.pathname.match(re);
        if (m) {
          var oldurl = this.getFixedURL(m[1]);
          if (oldurl !== this.currentroom.url) {
            var fullurl = elation.template.get('janusweb.url', {url: this.currentroom.url});
            history.pushState({}, '', fullurl);
          }
        } else {
          var fullurl = elation.template.get('janusweb.url', {url: this.currentroom.url});
          history.pushState({}, '', fullurl);
        }
      } else {
        var hashargs = elation.url();
        if (url == this.properties.homepage) {
          delete hashargs['janus.url'];
        } else {
          hashargs['janus.url'] = url;
        }
        var newhash = '#' + elation.utils.encodeURLParams(hashargs);
        if (document.location.hash != newhash) {
          document.location.hash = (newhash == '#' ? '' : newhash);
        }
      }
    }
    this.handlePopstate = function(ev) {
      if (this.urltemplate) {
        var re = new RegExp(elation.template.get('janusweb.url', {url: '(.*)'}).replace('/', '\\/'));
        var m = document.location.pathname.match(re);
        if (m) {
          var url = this.getFixedURL(m[1]);
          if (url != this.currentroom.url) {
            this.setActiveRoom(url, null, true);
          }
        }
      } else {
        var hashargs = elation.url();
        var hashurl = hashargs['janus.url'];
        if (hashurl && hashurl != this.properties.url && !this.loading) {
          this.setActiveRoom(hashurl, null, true);
        } else if (!hashurl && this.properties.url != this.homepage) {
          this.setActiveRoom(this.homepage);
        }
      }
    }

    this.showLoadURL = function(ev) {
      if (ev.value == 1) {
        this.engine.client.ui.urlbar.selectall();
        this.engine.client.ui.urlbar.focus();
      }
    }
    this.showRoomDebug = function(ev) {
      if (ev.value == 1) {
        this.currentroom.showDebug();
      }
    }
    this.showChat = function(ev) {
      if (ev.value == 1 && this.chat && document.activeElement != this.engine.client.ui.urlbar.inputelement) {
        this.chat.focus();
      }
    }
    this.addBookmark = function(ev) {
      if (ev.value == 1) {
        var room = {
          url: this.currentroom.properties.url, 
          title: this.currentroom.title,
          time: (new Date().getTime() / 1000)
        };
        this.bookmarks.add(room);
        elation.events.fire({type: 'janusweb_bookmark_add', element: this, data: room});
      }
    }
    this.mute = function(ev) {
      if (!ev || ev.value == 1) {
        this.engine.systems.sound.toggleMute();
      }
    }

    this.setUsername = function(name) {
      var player = this.engine.client.player;
      player.setUsername(name);
    }
    this.getUsername = function() {
      var player = this.engine.client.player;
      return player.getUsername();
    }
    this.handleRoomEditOther = function(data) {
      var roomId = data.roomId,
          movedata = data.position;
          edit = movedata.room_edit,
          del = movedata.room_delete;

      var room = this.rooms[roomId];
      if (room) {
        if (edit) {
          var editxml = edit.replace(/\^/g, '"');
//console.log('RECV', editxml);
          room.applyEditXML(editxml);
        }
        if (del) {
          var deletexml = del.replace(/\^/g, '"');
          room.applyDeleteXML(deletexml);
        }
      } 
    }
    this.getCurrentURL = function() {
      return this.properties.url;
    }
    this.navigateHome = function() {
      return this.setActiveRoom(this.properties.homepage);
    }
    this.navigateBack = function() {
      history.back();
    }
    this.navigateTo = function(url) {
      return this.setActiveRoom(url);
    }
    this.navigateForward = function() {
      history.forward();
    }
    this.getTriangleCount = function() {
      return this.engine.systems.render.views.main.renderinfo.render.faces;
    }
    this.isLocked = function() {
      return this.currentroom.properties.locked;
    }
    this.sendChatMessage = function(text) {
      var network = this.currentroom.getServer();
      network.send({'method': 'chat', data: text});
    }
    this.getSetting = function(name) {
      return elation.utils.arrayget(this.settings, name);
    }
    this.setSetting = function(name, value) {
      return elation.utils.arrayset(this.settings, name, value);
    }
    this.reset = function() {
    }
    this.quit = function() {
    }
    this.focus = function() {
    }
    this.blur = function() {
    }
    this.saveRoom = function() {
    }
    this.getRoomCode = function() {
    }
    this.setRoomCode = function(code) {
    }
    this.setAvatarLighting = function(lighting) {
    }
    this.getAvatarLighting = function() {
    }
    this.resetAvatar = function() {
    }
    this.hasFocus = function() {
      return true;
    }
    this.sendScriptFrame = function(ev) {
      this.scriptframeargs[0] = Math.round(ev.data.delta * 1000);
/*
      this.engine.systems.world.scene['world-3d'].updateMatrixWorld(true);
      //elation.events.fire({element: this.currentroom, type: 'janusweb_script_frame'});
      if (this.currentroom.update) {
        this.currentroom.update(1000/60);
      }
*/
    }
    this.updatePortals = function() {
      var portalpass = this.engine.systems.render.views.main.portalpass;
      if (portalpass && this.currentroom) {
        portalpass.portals = this.currentroom.getVisiblePortals();
      }
    }
    this.registerElement = function(tagname, classobj, extendclass) {
      if (!extendclass || !elation.engine.things[extendclass]) extendclass = 'janusbase';
      tagname = tagname.toLowerCase();
console.log('Register new SYSTEM tag type:', tagname, classobj, extendclass);
      elation.component.add('engine.things.' + tagname, classobj, elation.engine.things[extendclass]);
/*
      this.typemap[tagname] = tagname;
      this.classmap[tagname] = {
        class: classobj,
        extendclass: extendclass
      };
*/
      this.customElements[tagname] = {
        tagname: tagname,
        classname: tagname,
        class: classobj,
        extendclass: extendclass
      };
    }
    this.extendElement = function(extendclass, tagname, classobj) {
      this.registerElement(tagname, classobj, extendclass);
    }
    this.registerBuiltinElements = function(elements) {
      for (var k in elements) {
        var tagname = k.toLowerCase(),
            classname = elements[k];
        this.customElements[tagname] = {
          tagname: tagname,
          classname: classname,
          class: elation.engine.things[classname]
        };
      }
    }
    this.registerAdditionalElements = function(elements) {
      for (var k in elation.janusweb.elements) {
        this.registerElement(k, elation.janusweb.elements[k].classdef);
      }
    }
    this.getAsset = function(type, name, assetargs) {
      var asset;
      if (this.assetpack) {
        asset = this.assetpack.get(type, name, assetargs);
      }
      return asset;
    }
  }, elation.engine.things.generic);
});
