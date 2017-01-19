elation.require(['janusweb.config', 'engine.things.generic','janusweb.remoteplayer', 'janusweb.room', 'janusweb.tracking', 'janusweb.external.JanusClientConnection', 'janusweb.external.JanusFireboxParser', 'utils.proxy'], function() {
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
        urltemplate:    { type: 'string', default: false },
      });
      elation.events.add(window, 'popstate', elation.bind(this, this.handlePopstate));

      this.bookmarks = elation.collection.localindexed({index: 'url', storagekey: 'janusweb.bookmarks'});

      if (this.corsproxy != '') {
        elation.engine.assets.setCORSProxy(this.corsproxy);
      }
      elation.engine.assets.loadAssetPack(this.properties.datapath + 'assets.json', this.properties.datapath);
      this.parser = new JanusFireboxParser();
      this.scriptingInitialized = false;

      this.engine.systems.controls.addContext('janus', {
        'load_url': [ 'keyboard_tab', elation.bind(this, this.showLoadURL) ],
        'room_debug': [ 'keyboard_f6', elation.bind(this, this.showRoomDebug) ],
        'chat': [ 'keyboard_t', elation.bind(this, this.showChat) ],
        'bookmark': [ 'keyboard_ctrl_b', elation.bind(this, this.addBookmark) ],
        'mute': [ 'keyboard_ctrl_m', elation.bind(this, this.mute) ]
      });
      this.engine.systems.controls.activateContext('janus');
      this.remotePlayers = {};
      this.remotePlayerCount = 0;
      this.playerCount = this.remotePlayerCount + 1;
      this.lastUpdate = Date.now();
      this.tmpMat = new THREE.Matrix4();
      this.tmpVecX = new THREE.Vector3();
      this.tmpVecY = new THREE.Vector3();
      this.tmpVecZ = new THREE.Vector3();
      this.sentUpdates = 0;
      this.updateRate = 15;

      elation.events.add(this.engine.systems.render.views.main, 'render_view_prerender', elation.bind(this, this.updatePortals));
      if (this.urltemplate) {
        elation.template.add('janusweb.url', this.urltemplate);
      }
    }
    this.initScripting = function() {
      if (this.scriptingInitialized) return;
      window.delta_time = 1000/60;
      window.janus = new elation.proxy(this, {
        version:           ['property', 'version',       { readonly: true}],
        versiononline:     ['property', 'versiononline', {readonly: true}],
        currentkey:        ['property', 'currentkey',    {readonly: true}],
        chat:              ['property', 'chat.messagelist.items', {readonly: true}],
        networkstatus:     ['property', 'network.status', {readonly: true}],
        networkerror:      ['property', 'network.error', {readonly: true}],
        roomserver:        ['property', 'network.server'],
        playercount:       ['property', 'playerCount'],
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
        hasFocus:          ['function', 'hasFocus']
      });

      var player = this.engine.client.player;
      player.properties.player_id = this.userId; // FIXME - player spawns without an id, so we fix it up here
      window.player = player.getProxyObject();

      //THREE.Vector3.prototype.toString = function() { return this.toArray().map(function(d) { return d.toFixed(4); }).join(' '); } 
      window.Vector = function(x, y, z) {
        if (y === undefined) y = x;
        if (z === undefined) z = y;
        var vec = new THREE.Vector3(x, y, z);
        return vec;
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
      window.print = function() {
        console.log.apply(console, arguments);
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
      //setTimeout(elation.bind(this, this.load, starturl, true), 5000);
      this.initScripting();
      if (this.autoload) {
        this.load(starturl, true);
      }
      if (this.networking) {
        // connect to presence server
        //this.userId = Date.now().toString();
        this.userId = this.getUsername();
        var host = elation.utils.any(hashargs['janus.server'], elation.config.get('janusweb.network.host')),
            port = elation.utils.any(hashargs['janus.port'], elation.config.get('janusweb.network.port'), 5567);
        var janusOptions = {
          host: host,
          port: port,
          userId: this.userId,
          version: this.version,
          roomUrl: starturl
        }
        this.network = new JanusClientConnection(janusOptions);
        this.network.addEventListener('message', function(msg) {
          this.onJanusMessage(msg);
        }.bind(this));
        this.network.addEventListener('connect', function() {
          this.sendPlayerUpdate({first: true});
          //elation.events.add(this.engine.client.player, 'thing_change', elation.bind(this, this.sendPlayerUpdate));
          setInterval(function() {
            this.sendPlayerUpdate({first: false});
          }.bind(this), 100);
          elation.events.fire({element: this, type: 'janusweb_client_connected', data: this.userId});
          if (this.chat) {
            this.chat.addmessage({userId: ' ! ', message: 'Connected as ' + this.userId });
          }
        }.bind(this));
        this.network.addEventListener('disconnect', function() {
          if (this.chat) {
            this.chat.addmessage({userId: ' ! ', message: 'Disconnected'});
          }
        }.bind(this));
        //elation.events.add(this, 'room_change', elation.bind(this, function(ev) { console.log('DUR', ev); this.enter_room(ev.data); }));
        elation.events.add(this, 'room_disable', elation.bind(this, function(ev) { this.unsubscribe(ev.data.url); }));
      }
      if (this.showchat) {
        this.chat = elation.janusweb.chat({append: document.body, client: this.network, player: this.engine.client.player});
      }
    }
    this.clear = function() {
      if (this.currentroom) {
        this.remove(this.currentroom);
        //this.currentroom.die();
        //setTimeout(elation.bind(this.currentroom, this.currentroom.die), 1000);
        //this.currentroom.die();
        this.currentroom.disable();
        this.leave_room(this.currentroom.url);
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

      var roomid = md5(url);
      this.rooms[roomid] = room;
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
        var roomid = md5(url);
        if (this.rooms[roomid]) {
          room = this.rooms[roomid];
        }
      } else if (url.type == 'janusroom') {
        room = url;
        url = room.url;
      }

      if (room) {
        var changed = this.properties.url != url;
        if (!url) {
          url = this.properties.homepage || this.properties.url;
        } else {
          this.properties.url = url;
        }
        if (this.currentroom !== room) {
          this.currentroom = room;

          this.scriptframeargs = [
            1000/60
          ];

          window.room = new elation.proxy(this.currentroom, {
            url:           ['property', 'url', { readonly: true}],
            objects:       ['property', 'jsobjects'],
            cookies:       ['property', 'cookies'],
            walk_speed:    ['property', 'walk_speed'],
            run_speed:     ['property', 'run_speed'],
            jump_velocity: ['property', 'jump_velocity'],
            gravity:       ['property', 'gravity'],
            fog:           ['property', 'fog'],
            fog_mode:      ['property', 'fog_mode'], 
            fog_density:   ['property', 'fog_density'],
            fog_start:     ['property', 'fog_start'],
            fog_end:       ['property', 'fog_end'],
            fog_col:       ['property', 'fog_col'],
            bloom:         ['property', 'bloom'],
            col:           ['property', 'col'],
    
            createObject:  ['function', 'createObject'],
            removeObject:  ['function', 'removeObject'],
            addCookie:     ['function', 'addCookie'],
            playSound:     ['function', 'playSound'],
            stopSound:     ['function', 'stopSound'],
            seekSound:     ['function', 'seekSound'],
            getObjectById: ['function', 'getObjectById'],
            openLink:      ['function', 'openLink'],

            onLoad:          ['callback', 'janus_room_scriptload'],
            update:          ['callback', 'janusweb_script_frame', null, this.scriptframeargs],
            onCollision:     ['callback', 'physics_collide', 'objects.dynamics'],
            onColliderEnter: ['callback', 'janus_room_collider_enter'],
            onColliderExit:  ['callback', 'janus_room_collider_exit'],
            onClick:         ['callback', 'click', 'engine.client.container'],
            onMouseDown:     ['callback', 'janus_room_mousedown'],
            onMouseUp:       ['callback', 'janus_room_mouseup'],
            onKeyDown:       ['callback', 'janus_room_keydown'],
            onKeyUp:         ['callback', 'janus_room_keyup']
          });

          this.add(this.currentroom);
          this.currentroom.setActive();
          this.properties.url = url;
          this.loading = false;
          elation.events.fire({element: this, type: 'room_change', data: url});
        }
        if (!pos) pos = this.currentroom.playerstartposition;
        if (pos) {
          this.engine.client.player.properties.position.fromArray(pos);
          this.engine.client.player.properties.orientation.copy(this.currentroom.playerstartorientation);
        }
        if (changed && !skipURLUpdate) {
          this.updateClientURL();
        }

        if (!this.currentroom.loaded) {
          elation.events.add(this.currentroom, 'janus_room_load', elation.bind(this, function() {
            this.currentroom.enable();
          }));
        } else {
          this.currentroom.enable();
        }
        this.enter_room(url);
      } else {
        this.load(url, true);
      }
    }
    this.updateClientURL = function() {
      if (this.urltemplate) {
        var re = new RegExp(elation.template.get('janusweb.url', {url: '(.*)'}).replace('/', '\\/'));
        var m = document.location.pathname.match(re);
        if (m && m[1] !== this.currentroom.url) {
          var url = elation.template.get('janusweb.url', {url: this.currentroom.url});
          //history.pushState({}, '', '/sites/' + this.currentroom.url);
          history.pushState({}, '', url);
        } else {
          var url = elation.template.get('janusweb.url', {url: this.currentroom.url});
          history.pushState({}, '', url);
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
        if (m && m[1] != this.currentroom.url) {
          this.setActiveRoom(m[1], null, true);
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
      if (ev.value == 1) {
        this.engine.systems.sound.toggleMute();
      }
    }
    this.subscribe = function(url) {
      this.network.subscribe(url);
    }
    this.unsubscribe = function(url) {
      this.network.unsubscribe(url);
    }
    this.enter_room = function(url) {
      if (this.network) {
        this.network.subscribe(url);
        this.network.enter_room(url);
      }
    }
    this.leave_room = function(url) {
      if (this.network) {
        this.network.leave_room(url);
      }
    }
    this.onJanusMessage = function(msg) {
      var method = msg.data.method
      if (method == 'user_moved') {
        var userId = msg.data.data.position._userId;
        if (!this.remotePlayers.hasOwnProperty(userId)) {
          var remoteplayer = this.spawnRemotePlayer(msg.data.data);
          elation.events.fire({element: this, type: 'janusweb_user_joined', data: remoteplayer});
          if (this.chat) {
            this.chat.addmessage({userId: ' ! ', message: userId + ' entered room' });
          }
        }
        else {
          this.moveRemotePlayer(msg.data.data);
        }
      }
      else if (method == 'user_disconnected' || method == 'user_leave') {
        var remoteplayer = this.remotePlayers[msg.data.data.userId];
        if (remoteplayer) {
          elation.events.fire({element: this, type: 'janusweb_user_left', data: remoteplayer});
          if (this.chat) {
            this.chat.addmessage({userId: ' ! ', message: msg.data.data.userId + ' left room' });
          }
          if (remoteplayer && remoteplayer.parent) {
            remoteplayer.die();
          }
          delete this.remotePlayers[msg.data.data.userId];
          this.remotePlayerCount = Object.keys(this.remotePlayers).length;
          this.playerCount = this.remotePlayerCount + 1;
        }
      } else if (method == 'user_portal') {
        var data = msg.data.data;
        var portalname = 'portal_' + data.userId + '_' + md5(data.url);
        var node = this.parser.parseNode(data);
        var room = this.rooms[data.roomId];
        if (room) {
          room.spawn('janusportal', portalname, {
            url: data.url,
            janus: this,
            room: room,
            title: data.url,
            position: node.pos,
            orientation: node.orientation,
          });
        }
      } else if (method == 'user_chat') {
        if (this.chat) {
          this.chat.addmessage(msg.data.data);
        }
      }
    }
    this.getJanusOrientation = function(player, head) {
      // takes a quaternion, returns an object OTF {dir: "0 0 0", up_dir: "0 0 0", view_dir: "0 0 0"}
      this.tmpMat.makeRotationFromQuaternion(player.properties.orientation);
      this.tmpMat.extractBasis(this.tmpVecX, this.tmpVecY, this.tmpVecZ);
      var ret = {
        dir: this.tmpVecZ.clone().negate().toArray().join(' '),
        //up_dir: this.tmpVecY.toArray().join(' '),
        up_dir: '0 1 0',
        //view_dir: this.tmpVecZ.toArray().join(' ')
      }
      if (head) {
        //this.tmpMat.makeRotationFromQuaternion(head.properties.orientation);
        this.tmpMat.copy(head.objects['3d'].matrixWorld);
        this.tmpMat.extractBasis(this.tmpVecX, this.tmpVecY, this.tmpVecZ);
        ret.view_dir = this.tmpVecZ.clone().negate().toArray().join(' ');
        ret.up_dir = this.tmpVecY.toArray().join(' ');
        var headpos = head.properties.position.clone();//.sub(new THREE.Vector3(0,1.3,0));
        headpos.x *= -1;
        headpos.z *= -1;
        ret.head_pos = headpos.toArray().join(' '); //this.tmpMat.getPosition().toArray().join(' ');
      } else {
        ret.view_dir = '0 0 1';
        ret.head_pos = '0 0 0';
      }
      return ret;
    }
    this.spawnRemotePlayer = function(data) {
      var userId = data.position._userId;
      var roomId = data.roomId;

      var room = this.rooms[roomId] || this.currentroom;

      var spawnpos = (data.position.pos ? data.position.pos.split(" ").map(parseFloat) : [0,0,0]);
      this.remotePlayers[userId] = room.spawn('remoteplayer', userId, { position: spawnpos, player_id: userId, player_name: userId, pickable: false, collidable: false, janus: this});
      var remote = this.remotePlayers[userId];

      this.remotePlayerCount = Object.keys(this.remotePlayers).length;
      this.playerCount = this.remotePlayerCount + 1;
      return remote;
    }
    this.moveRemotePlayer = function(data) {
      var remote = this.remotePlayers[data.position._userId];
      var room = this.rooms[data.roomId] || this.currentroom;
      var movedata = data.position;

      if (remote.room !== room) {
        remote.setRoom(room);
      }

      remote.updateData(movedata);

      this.refresh();
    }
    this.sendPlayerUpdate = function(opts) {
      if (!this.currentroom) return;
      // opts.first is a bool, if true then we are sending our avatar along with the move update
      // else, we send the avatar on every 15th update
      if (Date.now() - this.lastUpdate < 20) return;
      var player = this.engine.client.player;
      var dirs = this.getJanusOrientation(player, player.head)
      var moveData = {
        "pos": this.engine.client.player.properties.position.toArray().join(" "),
        "dir": dirs.dir,
        "up_dir": dirs.up_dir,
        "view_dir": dirs.view_dir,
        "head_pos": dirs.head_pos,
        "anim_id": "idle"
      }

      //console.log('movedata update', moveData);
      if (opts.first || this.sentUpdates == this.updateRate) {
        moveData["avatar"] = "<FireBoxRoom><Assets><AssetObject id=^screen^ src=^http://bai.dev.supcrit.com/media/janusweb/assets/hoverscreen.obj^ mtl=^http://bai.dev.supcrit.com/media/janusweb/assets/hoverscreen.mtl^ atex0=^https://identicons.github.com/^ /></Assets><Room><Ghost id=^"  + this.userId + "^ js_id=^105^ locked=^false^ onclick=^^ oncollision=^^ interp_time=^0.1^ pos=^0.632876 -1.204882 32.774837^ vel=^0 0 0^ accel=^0 0 0^ xdir=^1 0 0^ ydir=^0 1 0^ zdir=^0 0 1^ scale=^1 1 1^ col=^#ffffff^ lighting=^true^ visible=^true^ shader_id=^^ head_id=^screen^ head_pos=^0 1.4 0^ body_id=^^ anim_id=^^ anim_speed=^1^ eye_pos=^0 1.6 0^ eye_ipd=^0^ userid_pos=^0 0.5 0^ loop=^false^ gain=^1^ pitch=^1^ auto_play=^false^ cull_face=^back^ play_once=^false^ /></Room></FireBoxRoom>";
        this.sentUpdates = 0;
      }

      if (player.voipqueue && player.voipqueue.length > 0) {
        var binary = '';
        while (player.voipqueue.length > 0) {
          var buf = player.voipqueue.shift();
          var bytes = new Uint8Array(buf.buffer);
          for (var i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
        }
        moveData.speaking = true;
        moveData.audio = window.btoa(binary);
        moveData.anim_id = "speak";
      }
      var changeids = Object.keys(this.currentroom.changes);
      var changestr = '';
      if (changeids.length > 0) {
        var xmldoc = document.implementation.createDocument(null, 'edit', null);
        var editroot = xmldoc.documentElement;

        var typemap = {
          janustext: 'Text',
          janusobject: 'Object',
        };

        changeids.forEach(elation.bind(this, function(id) {
          //changestr += this.currentroom.changes[id];
          var change = this.currentroom.changes[id];
          var real = this.currentroom.getObjectFromProxy(change);
          if (real) {
            var xmltype = typemap[real.type] || 'Object';
            xmlnode = xmldoc.createElement(xmltype); // FIXME - determine object's type
            
            var attrs = Object.keys(change);
            for (var i = 0; i < attrs.length; i++) {
              var k = attrs[i];
              var val = change[k];
              if (val instanceof THREE.Vector2 ||
                  val instanceof THREE.Vector3) {
                val = val.toArray().join(',');
              } else if (val instanceof THREE.Color) {
                val = val.toArray().join(',');
              }
              if (val !== null && val !== undefined && typeof val != 'function') {
                xmlnode.setAttribute(k, val);
              }
            }
            editroot.appendChild(xmlnode);
          }
          delete this.currentroom.changes[id];
        }));
        this.currentroom.appliedchanges = {};
        var serializer = new XMLSerializer();
        changestr = serializer.serializeToString(xmldoc);
        changestr = changestr.replace(/"/g, '^');
        changestr = changestr.replace(/^<edit\/?>/, '');
        changestr = changestr.replace(/<\/edit>\s*$/, '');
      }
      if (changestr != '') {
        //console.log('SEND', changestr);
        moveData.room_edit = changestr;
      }
      if (document.activeElement && this.chat && document.activeElement === this.chat.input.inputelement) {
        moveData.anim_id = 'type';
      }
      if (player.controlstate.run) {
        moveData.anim_id = 'run';
      } else if (player.controlstate.move_forward) {
        moveData.anim_id = 'walk';
      } else if (player.controlstate.move_left) {
        moveData.anim_id = 'walk_left';
      } else if (player.controlstate.move_right) {
        moveData.anim_id = 'walk_right';
      } else if (player.controlstate.move_backward) {
        moveData.anim_id = 'walk_back';
      }

      var hands = player.tracker.getHands();
      if (hands) {
        if (hands.left && hands.left.active) {
          moveData.hand0 = {
            state: hands.left.getState(player.shoulders)
          };
        }
        if (hands.right && hands.right.active) {
          moveData.hand1 = {
            state: hands.right.getState(player.shoulders)
          };
        }
      } 


      this.network.send({'method': 'move', 'data': moveData});
      this.lastUpdate = Date.now();
      this.sentUpdates++;
    }
    this.getUsername = function() {
      var adjectives = [
				"Adorable", "Beautiful", "Clean", "Drab", "Elegant", "Fancy", "Glamorous", "Handsome", "Long", "Magnificent",
				"Plain", "Quaint", "Sparkling", "Ugliest", "Unsightly", "Agreeable", "Brave", "Calm", "Delightful", "Eager",
				"Faithful", "Gentle", "Happy", "Jolly", "Kind", "Lively", "Nice", "Obedient", "Proud", "Relieved", "Silly",
				"Thankful", "Victorious", "Witty", "Zealous", "Angry", "Bewildered", "Clumsy", "Defeated", "Embarrassed",
				"Fierce", "Grumpy", "Helpless", "Itchy", "Jealous", "Lazy", "Mysterious", "Nervous", "Obnoxious", "Panicky",
				"Repulsive", "Scary", "Thoughtless", "Uptight", "Worried"
      ];
      var nouns = [
				"Alligator", "Ant", "Bear", "Bee", "Bird", "Camel", "Cat", "Cheetah", "Chicken", "Chimpanzee", "Cow",
				"Crocodile", "Deer", "Dog", "Dolphin", "Duck", "Eagle", "Elephant", "Fish", "Fly", "Fox", "Frog", "Giraffe",
				"Goat", "Goldfish", "Hamster", "Hippopotamus", "Horse", "Kangaroo", "Kitten", "Lion", "Lobster", "Monkey",
				"Octopus", "Owl", "Panda", "Pig", "Puppy", "Rabbit", "Rat", "Scorpion", "Seal", "Shark", "Sheep", "Snail",
				"Snake", "Spider", "Squirrel", "Tiger", "Turtle", "Wolf", "Zebra"
      ];

      var adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      var noun = nouns[Math.floor(Math.random() * nouns.length)];
      var num = Math.floor(Math.random() * 1000);

      return adj + noun + num
    }
    this.setUsername = function(name) {
      this.network.setUserId(name);
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
      this.network.send({'method': 'chat', data: text});
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
/*
      this.engine.systems.world.scene['world-3d'].updateMatrixWorld(true);
      this.scriptframeargs[0] = ev.data.delta * 1000;
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
  }, elation.engine.things.generic);
});
