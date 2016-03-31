elation.require(['engine.things.generic','engine.things.remoteplayer', 'janusweb.room', 'janusweb.JanusClientConnection'], function() {
  elation.requireCSS('janusweb.janusweb');
  elation.component.add('engine.things.janusweb', function() {
    this.rooms = [];

    this.postinit = function() {
      this.defineProperties({
        url: { type: 'string', default: false },
        homepage: { type: 'string', default: "http://www.janusvr.com/" },
        corsproxy: { type: 'string', default: '' }
      });
      elation.events.add(window, 'popstate', elation.bind(this, this.handlePopstate));

      if (this.properties.corsproxy != '') {
        elation.engine.assets.setCORSProxy(this.properties.corsproxy);
      }
      elation.engine.assets.loadAssetPack('/media/janusweb/assets.json');

      this.engine.systems.controls.addContext('janus', {
        'load_url': [ 'keyboard_tab', elation.bind(this, this.showLoadURL) ],
        'room_debug': [ 'keyboard_f6', elation.bind(this, this.showRoomDebug) ]
      });
      this.engine.systems.controls.activateContext('janus');
      this.remotePlayers = {};
      this.lastUpdate = Date.now();
      this.tmpMat = new THREE.Matrix4();
      this.tmpVecX = new THREE.Vector3();
      this.tmpVecY = new THREE.Vector3();
      this.tmpVecZ = new THREE.Vector3();
      this.sentUpdates = 0;
      this.updateRate = 15;
    }
    this.createChildren = function() {
      var hashargs = elation.url();
      var starturl = hashargs['janus.url'] || this.properties.url || this.properties.homepage;
      //setTimeout(elation.bind(this, this.load, starturl, true), 5000);
      this.load(starturl, true);
      // connect to presence server
      this.userId = Date.now().toString();
      janusOptions = {
        host: 'ws://ec2-54-148-60-8.us-west-2.compute.amazonaws.com:9001',
        userId: this.userId,
        version: '23.4',
        roomUrl: starturl
      }
      this.jcc = new JanusClientConnection(janusOptions);
      this.jcc.addEventListener('message', function(msg) {
        this.onJanusMessage(msg);
      }.bind(this));
      this.jcc.addEventListener('connect', function() {
        this.sendPlayerUpdate({first: true});
        elation.events.add(this.engine.client.player, 'thing_change', elation.bind(this, this.sendPlayerUpdate));
      }.bind(this));
      elation.events.add(this, 'room_active', elation.bind(this, this.subscribe));
      elation.events.add(this, 'room_disable', elation.bind(this, this.unsubscribe));
    }
    this.clear = function() {
      if (this.currentroom) {
        this.remove(this.currentroom);
        //this.currentroom.die();
        //setTimeout(elation.bind(this.currentroom, this.currentroom.die), 1000);
        //this.currentroom.die();
        this.currentroom.disable();
        this.currentroom = false;
      }
      this.refresh();
    }
    this.load = function(url, makeactive) {
      var roomname = url;//.replace(/[^\w]/g, "_");

      var room = this.spawn('janusroom', roomname, {
        url: url,
        janus: this
      });
      // FIXME - should be able to spawn without adding to the heirarchy yet
      this.remove(room);

      this.rooms[url] = room;
      console.log('made new room', url, room);
      this.loading = false;
      if (room && makeactive) {
        this.setActiveRoom(url);
      }
    }
    this.setActiveRoom = function(url, pos) {
      this.clear();
      if (!url) {
        url = this.properties.homepage || this.properties.url;
      } else {
        this.properties.url = url;
      }
      this.loading = true;
      if (this.rooms[url]) {
        if (this.currentroom !== this.rooms[url]) {
          this.currentroom = this.rooms[url];
          this.add(this.currentroom);
          this.currentroom.setActive();
          this.properties.url = url;
          this.loading = false;
        }
      } else {
        this.load(url, true);
      }
      if (pos) {
        this.engine.client.player.properties.position.set(pos[0], pos[1], pos[2]);
        this.engine.client.player.properties.orientation.set(0,0,1,0);
      }
      var hashargs = elation.url();
      hashargs['janus.url'] = url;
      document.location.hash = elation.utils.encodeURLParams(hashargs);
    }
    this.handlePopstate = function(ev) {
      var hashargs = elation.url();
      var hashurl = hashargs['janus.url'];
      if (hashurl != this.properties.url && !this.loading) {
        this.setActiveRoom(hashurl);
      }
    }
    this.showLoadURL = function(ev) {
      if (ev.value == 1) {
        var url = prompt('url?');
        if (url) {
          this.setActiveRoom(url, [0,0,0]);
        }
      }
    }
    this.showRoomDebug = function(ev) {
      if (ev.value == 1) {
        this.currentroom.showDebug();
      }
    }
    this.subscribe = function(ev) {
      console.log('sub fired:', ev);
      this.jcc.subscribe(ev.data.properties.url);
      this.jcc.enter_room(ev.data.properties.url);
    }
    this.unsubscribe = function(ev) {
      console.log('unsub fired:', ev);
      this.jcc.unsubscribe(ev.data.properties.url);
    }
    this.onJanusMessage = function(msg) {
      var method = msg.data.method
      if (method == 'user_moved') {
        var userId = msg.data.data.position._userId;
        if (!this.remotePlayers.hasOwnProperty(userId)) {
          this.spawnRemotePlayer(msg.data.data);
        }
        else {
          this.moveRemotePlayer(msg.data.data);
        }
      }
      else if (method == 'user_disconnected' || method == 'user_leave') {
        console.log("removing player", msg.data.data.userId);
        this.remotePlayers[msg.data.data.userId].die();
        delete this.remotePlayers[msg.data.data.userId];
      }
    }
    this.quaternionToJanus = function(quat) {
      // takes a quaternion, returns an object OTF {dir: "0 0 0", up_dir: "0 0 0", view_dir: "0 0 0"}
      this.tmpMat.makeRotationFromQuaternion(quat);
      this.tmpMat.extractBasis(this.tmpVecX, this.tmpVecY, this.tmpVecZ);
      var ret = {
        dir: this.tmpVecY.toArray().join(' '),
        //up_dir: this.tmpVecY.toArray().join(' '),
        up_dir: '0 1 0',
        view_dir: this.tmpVecX.toArray().join(' ')
      }
      return ret;
    }
    this.spawnRemotePlayer = function(data) {
      var userId = data.position._userId;
      var spawnpos = data.position.pos.split(" ").map(parseFloat);
      this.remotePlayers[userId] = this.spawn('remoteplayer', userId, { position: spawnpos, player_id: userId});
      var remote = this.remotePlayers[userId];
      remote.janusDirs = {
        tmpVec1: new THREE.Vector3(),
        tmpVec2: new THREE.Vector3(),
        tmpVec3: new THREE.Vector3(),
        tmpMat4: new THREE.Matrix4()
      }
    }
    this.moveRemotePlayer = function(data) {
      var movepos = data.position.pos.split(" ").map(parseFloat);
      var remote = this.remotePlayers[data.position._userId];
      remote.janusDirs.tmpVec1.fromArray([0, 0, 0]);
      remote.janusDirs.tmpVec2.fromArray(data.position.view_dir.split(" "));
      remote.janusDirs.tmpVec3.fromArray(data.position.up_dir.split(" "));
      remote.janusDirs.tmpMat4.lookAt(remote.janusDirs.tmpVec1, remote.janusDirs.tmpVec2, remote.janusDirs.tmpVec3);
      remote.properties.orientation.setFromRotationMatrix(remote.janusDirs.tmpMat4);
      remote.set('position', movepos, true);
      
    }
    this.sendPlayerUpdate = function(opts) {
      // opts.first is a bool, if true then we are sending our avatar along with the move update
      // else, we send the avatar on every 15th update
      if (Date.now() - this.lastUpdate < 20) return;
      var player = this.engine.client.player;
      var dirs = this.quaternionToJanus(player.properties.orientation)
      var moveData = {
        "pos": this.engine.client.player.properties.position.toArray().join(" "),
        "dir": dirs.dir,
        "up_dir": dirs.up_dir,
        "view_dir": dirs.view_dir,
        "head_pos": "0 0 0",
        "anim_id": "idle"
      }
      //console.log('movedata update', moveData);
      if (opts.first || this.sentUpdates == this.updateRate) {
        moveData["avatar"] = "<FireBoxRoom><Assets><AssetObject id=^jump^ src=^http://www.janusvr.com/avatars/animated/Beta/jump.fbx.gz^ /><AssetObject id=^fly^ src=^http://www.janusvr.com/avatars/animated/Beta/fly.fbx.gz^ /><AssetObject id=^speak^ src=^http://www.janusvr.com/avatars/animated/Beta/speak.fbx.gz^ /><AssetObject id=^walk^ src=^http://www.janusvr.com/avatars/animated/Beta/walk.fbx.gz^ /><AssetObject id=^type^ src=^http://www.janusvr.com/avatars/animated/Beta/type.fbx.gz^ /><AssetObject id=^portal^ src=^http://www.janusvr.com/avatars/animated/Beta/portal.fbx.gz^ /><AssetObject id=^run^ src=^http://www.janusvr.com/avatars/animated/Beta/run.fbx.gz^ /><AssetObject id=^idle^ src=^http://www.janusvr.com/avatars/animated/Beta/idle.fbx.gz^ /><AssetObject id=^body^ src=^http://www.janusvr.com/avatars/animated/Beta/Beta.fbx.gz^ /><AssetObject id=^walk_back^ src=^http://www.janusvr.com/avatars/animated/Beta/walk_back.fbx.gz^ /><AssetObject id=^walk_left^ src=^http://www.janusvr.com/avatars/animated/Beta/walk_left.fbx.gz^ /><AssetObject id=^walk_right^ src=^http://www.janusvr.com/avatars/animated/Beta/walk_right.fbx.gz^ /><AssetObject id=^head_id^ /></Assets><Room><Ghost id=^" + this.userId + "^ js_id=^105^ locked=^false^ onclick=^^ oncollision=^^ interp_time=^0.1^ pos=^0.632876 -1.204882 32.774837^ vel=^0 0 0^ accel=^0 0 0^ xdir=^0.993769 0 -0.111464^ ydir=^0 1 0^ zdir=^0.111464 0 0.993769^ scale=^0.0095 0.0095 0.0095^ col=^#a1e0c0^ lighting=^true^ visible=^true^ shader_id=^^ head_id=^head_id^ head_pos=^0 0 0^ body_id=^body^ anim_id=^^ anim_speed=^1^ eye_pos=^0 1.6 0^ eye_ipd=^0^ userid_pos=^0 0.5 0^ loop=^false^ gain=^1^ pitch=^1^ auto_play=^false^ cull_face=^back^ play_once=^false^ /></Room></FireBoxRoom>";
      this.sentUpdates = 0;
      }
      this.jcc.send({'method': 'move', 'data': moveData});
      this.lastUpdate = Date.now();
      this.sentUpdates++;
    }
  }, elation.engine.things.generic);
});
