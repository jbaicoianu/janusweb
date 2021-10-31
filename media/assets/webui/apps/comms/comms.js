elation.elements.define('janus-comms-panel', class extends elation.elements.base {
  create() {
    this.defineAttributes({
      labelfont: { type: 'string', default: 'monospace' },
    });
    this.player = player;
    this.client = this.getClient();
    this.janusweb = this.client.janusweb;
    this.elements = elation.elements.fromTemplate('janus.comms.panel', this);
    if (typeof room != 'undefined') {
      this.room = room;
    }
  }
  getClient() {
    var node = this;
    while (node) {
      if (node.tagName == 'JANUS-UI-MAIN') {
        return node.client;
      }
      node = node.parentNode
    }
  }
});
elation.elements.define('janus-comms-status', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttributes({
      state: { type: 'string', default: 'disconnected' }
    });
  }
  create() {
    this.player = player;
    if (typeof room != 'undefined') {
      this.room = room;
    }
    if (janus.network) {
      this.server = janus.network.getServerForRoom(room);
      if (this.server) {
        this.server.addEventListener('connect', ev => this.handleServerConnect(ev));
        this.server.addEventListener('connecting', ev => this.handleServerConnecting(ev));
        this.server.addEventListener('disconnecting', ev => this.handleServerDisconnecting(ev));
        this.server.addEventListener('disconnect', ev => this.handleServerDisconnect(ev));

        if (this.server.status == 1) {
          this.state = 'connecting';
        } else if (this.server.status == 2) {
          this.state = 'connected';
        }
      } else if (room.private) {
        this.state = 'private';
      } else {
        this.state = 'disconnected';
      }
    }
    this.elements = elation.elements.fromTemplate('janus.comms.status', this);

    //elation.events.add(player._target, 'username_change', (ev) => this.handleUsernameChange(ev));
  }
  render() {
    this.innerHTML = '';
    this.elements = this.fromTemplate('janus.comms.status', this);
  }
  handleUsernameChange(ev) {
    // Update the userid label if player's name changes
    this.elements.useridlabel.innerText = player.userid;
  }
  handleServerConnect(ev) {
    this.state = 'connected';
    this.refresh();
  }
  handleServerConnecting(ev) {
    this.state = 'connecting';
    this.refresh();
  }
  handleServerDisconnecting(ev) {
    this.state = 'disconnecting';
    this.refresh();
  }
  handleServerDisconnect(ev) {
    this.state = 'disconnected';
    this.refresh();
  }
});
elation.elements.define('janus-comms-userlist', class extends elation.elements.ui.list {
  create() {
    this.defineAttributes({
      labelfont: { type: 'string', default: 'monospace' },
    });
    this.player = player;
    if (typeof room != 'undefined') {
      this.room = room;
    }
    this.elements = elation.elements.fromTemplate('janus.comms.userlist', this);
    this.client = this.getClient();
    this.janusweb = this.client.janusweb;
    this.userlist_room = this.elements.userlist_room;
    this.userlist_online = this.elements.userlist_online;
    this.userlist_friends = this.elements.userlist_friends;

    this.usermarkers = {};

    elation.events.add(this.janusweb, 'room_load_start', (ev) => { this.updateRoom(ev.data); });
    elation.events.add(this.janusweb.network, 'janusweb_user_joined,janusweb_user_left,janusweb_user_disconnected', (ev) => this.updateUsers());
    setTimeout(() => {
      this.updateUsers();
    }, 100);
  }
  getClient() {
    var node = this;
    while (node) {
      if (node.tagName == 'JANUS-UI-MAIN') {
        return node.client;
      }
      node = node.parentNode
    }
  }
  updateRoom(room) {
    this.room = room;
    this.innerHTML = '';
    this.elements = elation.elements.fromTemplate('janus.comms.userlist', this);
    this.userlist_room = this.userlist_room;
    this.userlist_online = this.userlist_online;
    this.userlist_friends = this.userlist_friends;
    this.updateUsers();
  }
  updateUsers() {
    if (!janus.network) return;
    var remoteplayers = janus.network.remoteplayers;
    var users = Object.keys(remoteplayers);
    users.unshift(player.userid);

    this.elements.roomusers.value = users.length;
    
    this.userlist_room.setItems(users);

    for (let k in remoteplayers) {
      let p = remoteplayers[k];
      if (this.usermarkers[k] && this.usermarkers[k].parent !== p.getProxyObject()) {
        this.usermarkers[k].die();
        delete this.usermarkers[k];
      }
      if (!this.usermarkers[k]) {
        this.usermarkers[k] = p.createObject('playerlabel', {
          player_name: k,
          pos: V(p.userid_pos),
          font: this.labelfont,
        });
        this.usermarkers[k].start();
      } 

    }
  }
  setFont(fontname) {
    this.labelfont = fontname;
    for (let k in this.usermarkers) {
      this.usermarkers[k].setFont(fontname);
    }
  }
});
elation.elements.define('janus-comms-chat', class extends elation.elements.base {
  init() {
    elation.events.add(janus.network, 'janusweb_user_chat', (ev) => this.handleUserChat(ev));
    elation.events.add(janus.network, 'janusweb_user_joined', (ev) => this.handleUserJoined(ev));
    elation.events.add(janus.network, 'janusweb_user_left', (ev) => this.handleUserLeft(ev));
    elation.events.add(janus.network, 'janusweb_user_disconnected', (ev) => this.handleUserDisconnected(ev));

    this.numunread = 0;
  }
  create() {
    this.elements = elation.elements.fromTemplate('janus.comms.chat', this);

    //this.elements.chatinput.addEventListener('accept', (ev) => this.sendMessage(ev.value));
    this.elements.chatinput.onaccept = (ev) => {
      this.sendMessage(this.elements.chatinput.value);
      if (false && this.shouldreturnfocus) {
        player.enable();
        this.shouldreturnfocus = false;
      } else {
        this.elements.chatinput.focus();
      }
    }
    this.elements.chatinput.onfocus = (ev) => {
      this.elements.chatinput.placeholder = 'Type something!';
      player.disable();
      this.updateUnread(0, true);
    }
    this.elements.chatinput.onblur = (ev) => this.elements.chatinput.placeholder = 'Press T for text chat';

    window.addEventListener('keydown', (ev) => {
      // FIXME - this should set up a bindable context in the engine's control system
      if (ev.keyCode == 84 && player.enabled) {
        this.elements.chatinput.focus();
        // FIXME - we should only return focus to the player if the player was active when we focused the chat
        this.shouldreturnfocus = true;
        player.disable();
        ev.preventDefault();
      }
    });
    elation.events.add(janus._target, 'clientprint', (ev) => this.handleClientPrint(ev.data));
    // FIXME - first element with the current design is a <detail> element, but this is fragile if that changes
    this.elements[0].addEventListener('toggle', (ev) => this.elements.chatinput.focus());
  }
  scrollToBottom() {
    setTimeout(() => {
      this.elements.chatlist.scrollTop = this.elements.chatlist.scrollHeight;
    }, 100);
  }
  handleUserJoined(ev) {
    var data = ev.data;
    this.elements.chatmessages.add({
      timestamp: new Date().getTime(),
      type: 'join',
      userId: data.id,
      message: 'has joined ' + (data.room.title || data.room.url),
    });
    this.scrollToBottom();
  }
  handleUserLeft(ev) {
    var data = ev.data;
    this.elements.chatmessages.add({
      timestamp: new Date().getTime(),
      type: 'part',
      userId: data.id,
      message: 'has left the room'
    });
    this.scrollToBottom();
  }
  handleUserDisconnected(ev) {
    var data = ev.data;
    this.elements.chatmessages.add({
      timestamp: new Date().getTime(),
      type: 'disconnect',
      userId: data.id,
      message: 'has disconnected'
    });
    this.scrollToBottom();
  }
  handleUserChat(ev) {
    var data = ev.data;
    this.elements.chatmessages.add({
      timestamp: new Date().getTime(),
      type: 'chat',
      userId: data.userId,
      message: data.message.data || data.message.message
    });
    this.scrollToBottom();
    this.updateUnread(1);
  }
  sendMessage(msg) {
    if (msg && msg.length > 0) {
      janus.network.send({'method': 'chat', data: msg});
      this.elements.chatmessages.add({
        timestamp: new Date().getTime(),
        type: 'selfchat',
        userId: player.userid,
        message: msg
      });
      this.elements.chatinput.value = '';
      this.scrollToBottom();
    }
  }
  handleClientPrint(msg) {
    this.elements.chatmessages.add({
      timestamp: new Date().getTime(),
      type: 'print',
      userId: 'room',
      message: msg[0]
    });
    this.scrollToBottom();
  }
  updateUnread(incr=0, clear=false) {
    if (clear) {
      this.numunread = 0;
    }
    if (incr) {
      this.numunread += incr;
    }
    this.elements.unread.count = this.numunread;
  }
});

elation.elements.define('janus-comms-voip', class extends elation.elements.base {
  init() {
  }
  create() {
    this.elements = elation.elements.fromTemplate('janus.comms.voip', this);
  }
});

janus.registerElement('playerlabel', {
  player_name: '',
  font: 'monospace',
  threshold: .2,

  create() {
    this.currentcolor = V(255,255,255);
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 64;
    let imageid = this.player_name + '_playerlabel';
    this.loadNewAsset('image', {
      id: imageid,
      canvas: this.canvas,
      hasalpha: true,
      srgb: false,
    });
    this.label = this.createObject('object', {
      id: 'plane',
      //collision_id: 'cube',
      collision_scale: V(.85,7,.1),
      collision_pos: V(0,-3,0),
      collidable: false,
      pickable: true,
      scale: V(2,.25,1),
      image_id: imageid,
      billboard: 'y',
      lighting: false,
      opacity: .9,
      transparent: true,
      renderorder: 10,
      shadow_cast: false,
    });
    this.updateCanvas();
    this.label.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.label.addEventListener('mouseout', ev => this.handleMouseOut(ev));
    this.label.addEventListener('click', ev => this.handleClick(ev));

    console.log('create a player label', this.player_name, this);
  },
  updateCanvas() {
    let ctx = this.canvas.getContext('2d');

    let font = 'bold 60px "' + this.font + '"';
    document.fonts.load(font).then(fonts => {
      ctx.font = font;
      let measure = ctx.measureText(this.player_name);

      let width = Math.pow(2, Math.ceil(Math.log(measure.width) / Math.log(2)));
      this.canvas.width = width;
      if (this.label) {
        let oldscale = this.label.scale.x;
        this.label.scale.x = width / this.canvas.height * this.label.scale.y;
        this.label.collision_scale = V(.85 / this.label.scale.x, 7, .1); // FIXME - shouldn't be hardcoded
      }

      ctx.font = font;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let c = this.currentcolor;
      // background color
  /*
      ctx.fillStyle = 'rgba(' + c.x + ', ' + c.y + ', ' + c.z + ', 0.1)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  */

      // text with shadow
      ctx.fillStyle = 'rgba(' + c.x + ', ' + c.y + ', ' + c.z + ', 1)';
      ctx.shadowBlur = 2;
      ctx.shadowColor = 'rgba(0,0,0,1)';
      ctx.fillText(this.player_name, (this.canvas.width - measure.width) / 2, this.canvas.height - 10);

  /*
      // outer border
      ctx.strokeStyle = 'rgba(' + c.x + ', ' + c.y + ', ' + c.z + ', 1)';
      ctx.shadowColor = 'rgba(' + c.x + ', ' + c.y + ', ' + c.z + ', 1)';
      ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
  */
      elation.events.fire({element: this.canvas, type: 'update'});
    });
  },
  setFont(fontname) {
    this.font = fontname;
    this.updateCanvas();
  },
  setAudioSource(source) {
    console.log('got an audio source', source);
  },
  setAudioVolume(volume) {
    let scale = 1 + (volume > this.threshold ? volume / 2.5 : 0);
    this.scale.set(scale, scale, scale);
    if (volume > this.threshold) {
      this.label.col = '#0f0';
      if (this.colorreset) {
        clearTimeout(this.colorreset);
      } 
      this.colorreset = setTimeout(() => {
        this.label.col = '#fff';
        this.colorreset = false;
      }, 200);
    }
  },
  handleMouseOver(ev) {
    this.currentcolor.set(0,255,0);
    this.updateCanvas();
  },
  handleMouseOut(ev) {
    this.currentcolor.set(255,255,255);
    this.updateCanvas();
  },
  handleClick(ev) {
    // Present some contextual UI for this user (mute, block, add friend, etc)
  }
});
