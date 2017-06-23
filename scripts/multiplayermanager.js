elation.require(['janusweb.external.JanusClientConnection', 'janusweb.external.JanusFireboxParser'], function() {
  /**
   * multiplayermanager keeps track of all known rooms, and maintains a list of servers mapped to those rooms
   * When new rooms are created, we register them with the multiplayermanager which adds some event listeners
   * to the room.  Each room fires events when the player joins or parts it, and the networkmanager uses these
   * to manage subscriptions on each server.  Networkmanager will forward all incoming packets to their 
   * respective rooms, and at the same time will regularly send updates about the player's state in the current 
   * active room to the appropriate server.
   *
   * Client should be good about unsubscribing from rooms as you traverse portals, the networkmanager will remain
   * connected and subscribed to a room indefinitely unless told to leave
   */

  elation.component.add('janusweb.multiplayermanager', function() {
    this.init = function() {
      this.janusweb = this.args.janusweb;
      this.servers = {};
      this.rooms = {};
      this.roomservers = {};
      this.remoteplayers = {};
      this.enabled = false;
      this.player = this.args.player;
      this.parser = new JanusFireboxParser();

      this.avatarNeedsUpdate = true;
      this.avatarUpdateRate = 5000;

      var hashargs = elation.url(),
          server = elation.utils.any(this.args.server, hashargs['janus.server'], elation.config.get('janusweb.network.server')),
          host = elation.utils.any(this.args.host, hashargs['janus.host'], elation.config.get('janusweb.network.host')),
          //port = elation.utils.any(this.args.port, hashargs['janus.port'], elation.config.get('janusweb.network.port', 5567));
          port = 5567;

      if (server) {
        this.defaultserver = server;
      } else if (host.match(/^wss?:/)) {
        // should be of the format ws://host:port or wss://host:port
        this.defaultserver = host;
      } else if (host && port) {
        this.defaultserver = this.getServerURL(host, port);
      } 
      this.defaultport = port;

      elation.events.add(this.player, 'username_change', elation.bind(this, this.handleUsernameChange));
      setInterval(elation.bind(this, this.updateAvatar), this.avatarUpdateRate);
    }
    this.enable = function(player) {
      this.enabled = true;
      this.player = player;

      this.resetUpdateInterval();

      elation.events.fire({type: 'enabled', element: this});
    }
    this.disable = function() {
      this.enabled = false;
      elation.events.fire({type: 'disabled', element: this});
    }
    this.getUpdateRate = function(room) {
      var roomrate;
      if (!room) room = this.activeroom;

      if (room) {
        roomrate = room.rate;
      }

      var rate = elation.utils.any(roomrate, this.args.rate, elation.config.get('janusweb.network.rate'), 100);
      return rate;
    }
    this.resetUpdateInterval = function() {
      if (this.updateinterval) {
        this.stopUpdateInterval();
      }
      var rate = this.getUpdateRate();
      this.updateinterval = setInterval(elation.bind(this, this.sendUpdate), rate);
    }
    this.stopUpdateInterval = function() {
      if (this.updateinterval) {
        clearTimeout(this.updateinterval);
      }
    }
    this.getServerURL = function(host, port, secure) {
      if (!port) port = this.defaultport;
      port = 5567; // FIXME
      if (typeof secure == 'undefined') secure = (port != 5566);
    
      var protocol = (secure ? 'wss' : 'ws');

      return protocol + '://' + host + ':' + port;
    }
    this.getServerURLForRoom = function(room, force) {
      if (force || !this.roomservers[room.roomid]) {
        var roomserver = this.defaultserver;
        if (room.server) {
          roomserver = this.getServerURL(room.server, room.port);
        } 
        this.roomservers[room.roomid] = roomserver;
      }
      return this.roomservers[room.roomid];
    }
    this.getServerForRoom = function(room) {
      var serverurl = this.getServerURLForRoom(room, true);
      if (!this.servers[serverurl]) {
        var server = new JanusClientConnection({
          host: serverurl,
          userId: this.janusweb.userId,
          version: this.janusweb.version,
          roomUrl: room.url
        });
        server.addEventListener('connect', elation.bind(this, this.handleServerConnect));
        server.addEventListener('disconnect', elation.bind(this, this.handleServerDisconnect));
        server.addEventListener('message', elation.bind(this, this.handleServerMessage));
        server.addEventListener('login', elation.bind(this, this.updateAvatar));
        //elation.events.add(this, 'room_change', elation.bind(this, function(ev) { console.log('DUR', ev); this.enter_room(ev.data); }));
        //elation.events.add(this, 'room_disable', elation.bind(this, function(ev) { this.unsubscribe(ev.data.url); }));

        this.servers[serverurl] = server;
      }
      // TODO - subscribe if not subscribed
      return this.servers[serverurl];
    }
    this.registerRoom = function(room, subscribe) {
      if (!this.rooms[room.roomid]) {
        this.rooms[room.roomid] = room;
        elation.events.add(room, 'join', elation.bind(this, this.handleRoomJoin));
        elation.events.add(room, 'part', elation.bind(this, this.handleRoomPart));
      }

      if (!room.loaded) {
console.log('[MultiplayerManager] registered room, but not loaded yet:', room.url, room);
        elation.events.add(room, 'room_load_processed', elation.bind(this, this.registerRoom, room, subscribe));
        return;        
      }

console.log('[MultiplayerManager] registered room:', room.roomid, room.url, room);

      if (subscribe) {
        this.subscribe(room);
      }
      if (room == this.activeroom) {
        this.resetUpdateInterval();
        this.updateAvatar();
      }
    }
    this.setActiveRoom = function(room) {
console.log('[MultiplayerManager] set active room:', room, this.activeroom);
      // If we're already in a room, let's leave that one first
      if (this.activeroom) {
        var oldserver = this.getServerForRoom(this.activeroom);
        oldserver.leave_room(room.url);
      }

      // Tell the server we're now in the new room
      this.activeroom = room;
      var server = this.getServerForRoom(room);
      server.enter_room(room.url);
    }
    this.getJanusOrientation = (function() { 
      var tmpMat = new THREE.Matrix4(),
          tmpVecX = new THREE.Vector3(),
          tmpVecY = new THREE.Vector3(),
          tmpVecZ = new THREE.Vector3();
      return function(player, head) {
        // takes a quaternion, returns an object OTF {dir: "0 0 0", up_dir: "0 0 0", view_dir: "0 0 0"}
        tmpMat.makeRotationFromQuaternion(player.properties.orientation);
        tmpMat.extractBasis(tmpVecX, tmpVecY, tmpVecZ);
        var ret = {
          dir: tmpVecZ.clone().negate().toArray().join(' '),
          //up_dir: this.tmpVecY.toArray().join(' '),
          up_dir: '0 1 0',
          //view_dir: this.tmpVecZ.toArray().join(' ')
        }
        if (head) {
          //this.tmpMat.makeRotationFromQuaternion(head.properties.orientation);
          tmpMat.copy(head.objects['3d'].matrixWorld);
          tmpMat.extractBasis(tmpVecX, tmpVecY, tmpVecZ);
          ret.view_dir = tmpVecZ.clone().negate().toArray().join(' ');
          ret.up_dir = tmpVecY.toArray().join(' ');
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
    })();
    this.sendUpdate = function(opts) {
      if (!opts) opts = {};
      if (!this.activeroom) return;

      // opts.first is a bool, if true then we are sending our avatar along with the move update
      // else, we send the avatar on every 15th update
      var player = this.player,
          room = this.activeroom,
          server = this.getServerForRoom(room);

      if (!server.loggedin) return;

      var dirs = this.getJanusOrientation(player, player.head)
      var moveData = {
        "pos": player.properties.position.toArray().map(function(n) { return parseFloat(n.toFixed(4)); }).join(" "),
        "vel": player.properties.velocity.toArray().map(function(n) { return parseFloat(n.toFixed(4)); }).join(" "),
        "rotvel": player.properties.angular.toArray().map(function(n) { return parseFloat(n.toFixed(4)); }).join(" "),
        "dir": dirs.dir,
        "up_dir": dirs.up_dir,
        "view_dir": dirs.view_dir,
        "head_pos": dirs.head_pos,
        "anim_id": player.getAnimationID()
      }

      //console.log('[MultiplayerManager] player update', moveData);
      if (this.avatarNeedsUpdate) {
        moveData["avatar"] = player.getAvatarData().replace(/"/g, "^");
        this.avatarNeedsUpdate = false
      }

      if (player.hasVoipData()) {
        var voipdata = player.getVoipData();
        moveData.speaking = true;
        moveData.audio = window.btoa(voipdata);
      }

      if (room.hasChanges()) {
        moveData.room_edit = room.getChanges().replace(/"/g, "^");
      }

      if (player.hasHands()) {
        var hands = player.tracker.getHandData();

        if (hands.left && hands.left.active) {
          moveData.hand0 = {
            state: hands.left.state
          };
        }
        if (hands.right && hands.right.active) {
          moveData.hand1 = {
            state: hands.right.state
          };
        }
      } 

//console.log(moveData, server, room);
      server.send({'method': 'move', 'data': moveData});
    }
    this.subscribe = function(room) {
      var server = this.getServerForRoom(room);
console.log('[MultiplayerManager] subscribe', room.url);
      server.subscribe(room.url);
    }
    this.unsubscribe = function(room) {
console.log('[MultiplayerManager] unsubscribe', room.url);
      var server = this.getServerForRoom(room);
      server.unsubscribe(room.url);
    }
    this.join = function(room) {
console.log('[MultiplayerManager] join', room.url);
      var server = this.getServerForRoom(room);
      server.enter_room(room.url);
    }
    this.part = function(room) {
console.log('[MultiplayerManager] part', room.url);
      var server = this.getServerForRoom(room);
      server.leave_room(room.url);
    }
    this.spawnRemotePlayer = function(data) {
      var userId = data.userId;
      var roomId = data.roomId;

      var room = this.rooms[roomId] || this.activeroom;
console.log('[MultiplayerManager] spawn remote guy', userId, roomId, room);

      var spawnpos = (data.position && data.position.pos ? data.position.pos.split(" ").map(parseFloat) : [0,0,0]);
      this.remoteplayers[userId] = room.spawn('remoteplayer', userId, { position: spawnpos, player_id: userId, player_name: userId, pickable: false, collidable: false, janus: this});
      var remote = this.remoteplayers[userId];

      this.remotePlayerCount = Object.keys(this.remoteplayers).length;
      this.playerCount = this.remotePlayerCount + 1;

      // If a new player spawned, let's send an avatar update ASAP
      this.updateAvatar();
      return remote;
    }
    this.updateAvatar = function() {
      this.avatarNeedsUpdate = true;
    }

    this.handleServerConnect = function(msg) {
console.log('[MultiplayerManager] connected', msg);
      //this.sendPlayerUpdate({first: true});
      var server = msg.target;

      elation.events.fire({element: this, type: 'janusweb_client_connected', data: this.janusweb.userId});
      if (this.janusweb.chat) {
        this.janusweb.chat.addmessage({userId: ' ! ', message: 'Connected to ' + server._host + ' as ' + this.janusweb.userId });
      }
    }
    this.handleServerDisconnect = function(ev) {
console.log('[MultiplayerManager] disconnected', ev);
      if (this.janusweb.chat) {
        this.janusweb.chat.addmessage({userId: ' ! ', message: 'Disconnected'});
      }
    }
    this.handleServerMessage = function(msg) {
//console.log('[MultiplayerManager] server msg', msg);
      var method = msg.data.method
      if (method == 'user_moved') {
        this.handleUserMoved(msg);
      } else if (method == 'user_disconnected') {
        this.handleUserDisconnect(msg);
      } else if (method == 'user_enter') {
        this.handleUserEnter(msg);
      } else if (method == 'user_leave') {
        this.handleUserLeave(msg);
      } else if (method == 'user_portal') {
        this.handlePortal(msg);
      } else if (method == 'user_chat') {
        this.handleUserChat(msg);
      }
    }
    this.handleUserMoved = function(msg) {
      var userId = msg.data.data.position._userId;

      if (!this.remoteplayers[userId]) {
        var remoteplayer = this.spawnRemotePlayer(msg.data.data);
        elation.events.fire({element: this, type: 'user_joined', data: remoteplayer});
      } else {
        var remote = this.remoteplayers[userId];
        var room = this.rooms[msg.data.data.roomId] || this.activeroom;
        var movedata = msg.data.data.position;

        if (remote.room !== room) {
          remote.setRoom(room);
        }

        remote.updateData(movedata);
      }
    }
    this.handleUserDisconnect = function(msg) {
      var remoteplayer = this.remoteplayers[msg.data.data.userId];
console.log('[MultiplayerManager] player disconnected', msg, remoteplayer);
      if (remoteplayer) {
        elation.events.fire({element: this, type: 'janusweb_user_disconnected', data: remoteplayer});
        if (this.janusweb.chat) {
          this.janusweb.chat.addmessage({userId: ' ! ', message: msg.data.data.userId + ' disconnected' });
        }
        if (remoteplayer && remoteplayer.parent) {
          remoteplayer.die();
        }
        delete this.remoteplayers[msg.data.data.userId];
        this.remotePlayerCount = Object.keys(this.remoteplayers).length;
        this.playerCount = this.remotePlayerCount + 1;
      }
    }
    this.handleUserEnter = function(msg) {
      var remoteplayer = this.remoteplayers[msg.data.data.userId];
console.log('[MultiplayerManager] player entered', msg, remoteplayer);
      if (!remoteplayer) {
        remoteplayer = this.spawnRemotePlayer(msg.data.data);
      } else {
        var room = this.rooms[msg.data.data.roomId];
      }
      if (remoteplayer.room !== room) {
console.log('CHANGE ROOM', remoteplayer.room, room);
        remoteplayer.setRoom(room);
      }
      elation.events.fire({element: this, type: 'janusweb_user_joined', data: remoteplayer});
      if (this.janusweb.chat) {
        this.janusweb.chat.addmessage({userId: ' ! ', message: msg.data.data.userId + ' joined room' });
      }
      this.remotePlayerCount = Object.keys(this.remoteplayers).length;
      this.playerCount = this.remotePlayerCount + 1;
    }
    this.handleUserLeave = function(msg) {
      var remoteplayer = this.remoteplayers[msg.data.data.userId];
console.log('[MultiplayerManager] player left', msg, remoteplayer);
      if (remoteplayer) {
        elation.events.fire({element: this, type: 'janusweb_user_left', data: remoteplayer});
        if (this.janusweb.chat) {
          this.janusweb.chat.addmessage({userId: ' ! ', message: msg.data.data.userId + ' left room' });
        }
        if (remoteplayer) {
          remoteplayer.setRoom(null);
        }
        this.remotePlayerCount = Object.keys(this.remoteplayers).length;
        this.playerCount = this.remotePlayerCount + 1;
      }
    }
    this.handlePortal = function(msg) {
      var portaldata = msg.data.data;
      var portalname = 'portal_' + portaldata.userId + '_' + md5(portaldata.url);

      var node = this.parser.parseNode(portaldata);
      var room = this.rooms[portaldata.roomId];

      if (room) {
        room.spawn('janusportal', portalname, {
          url: portaldata.url,
          janus: this,
          room: room,
          title: portaldata.url,
          position: node.pos,
          orientation: node.orientation,
        });
      }
    }
    this.handleUserChat = function(msg) {
      if (this.janusweb.chat) {
        this.janusweb.chat.addmessage(msg.data.data);
      }
    }
    this.handleRoomJoin = function(ev) {
      if (this.activeroom != ev.target) {
        if (this.activeroom) {
          this.part(this.activeroom);
        }

        var room = this.activeroom = ev.target;
        if (room.loaded) {
          this.join(room);
        } else {
          elation.events.add(room, 'room_load_processed', elation.bind(this, this.join, room));
        }
      }
    }
    this.handleRoomPart = function(ev) {
      if (this.activeroom == ev.target) {
        this.part(this.activeroom);
        this.activeroom = false;
      }
    }
    this.handleUsernameChange = function(ev) {
      var name = ev.data;
      console.log('[MultiplayerManager] player changed username', name);
      for (var k in this.servers) {
        this.servers[k].setUserId(name);
      }
    }
  });
});
