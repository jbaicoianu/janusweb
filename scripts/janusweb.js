elation.require(['engine.things.generic', 'janusweb.room'], function() {
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

    }
    this.createChildren = function() {
      var hashargs = elation.url();
      var starturl = hashargs['janus.url'] || this.properties.url || this.properties.homepage;
      //setTimeout(elation.bind(this, this.load, starturl, true), 5000);
      this.load(starturl, true);
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
  }, elation.engine.things.generic);
});
