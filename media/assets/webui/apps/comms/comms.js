elation.elements.define('janus-comms-panel', class extends elation.elements.base {
  create() {
    this.player = player;
    this.room = room;
    this.client = this.getClient();
    this.janusweb = this.client.janusweb;
    this.elements = elation.elements.fromTemplate('janus.comms.panel', this);
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
    this.room = room;
    this.server = janus.network.getServerForRoom(room);
    this.elements = elation.elements.fromTemplate('janus.comms.status', this);
  }
});
elation.elements.define('janus-comms-userlist', class extends elation.elements.ui.list {
  create() {
    this.player = player;
    this.room = room;
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
    var remoteplayers = janus.network.remoteplayers;
    var users = Object.keys(remoteplayers);
    users.unshift(player.userid);

    this.elements.roomusers.count = users.length;
    
    this.userlist_room.setItems(users);

    // TODO - Spawn some 3D object to represent the player's gamertag
    /*
    for (var k in remoteplayers) {
      var p = remoteplayers[k].getProxyObject();
      if (!this.usermarkers[k]) {
setTimeout(() => {
// simple test of a 3d object controlled from the ui
        this.usermarkers[k] = p.createObject('object', {
          id: 'cone',
          col: '#0000ff'
        });
}, 100);
      }
    }
    */
  }
});
elation.elements.define('janus-comms-voip', class extends elation.elements.base {
  init() {
  }
  create() {
    this.elements = elation.elements.fromTemplate('janus.comms.voip', this);
  }
});
elation.elements.define('janus-comms-chat', class extends elation.elements.base {
  init() {
    elation.events.add(janus.network, 'janusweb_user_chat', (ev) => this.handleUserChat(ev));
    elation.events.add(janus.network, 'janusweb_user_joined', (ev) => this.handleUserJoined(ev));
    elation.events.add(janus.network, 'janusweb_user_left', (ev) => this.handleUserLeft(ev));
    elation.events.add(janus.network, 'janusweb_user_disconnected', (ev) => this.handleUserDisconnected(ev));
  }
  create() {
    this.elements = elation.elements.fromTemplate('janus.comms.chat', this);

    //this.elements.chatinput.addEventListener('accept', (ev) => this.sendMessage(ev.value));
    this.elements.chatinput.onaccept = (ev) => {
      this.sendMessage(this.elements.chatinput.value);
console.log('dur', this.shouldreturnfocus);
      if (this.shouldreturnfocus) {
console.log('go back');
        player.enable();
      }
    }
    this.elements.chatinput.onfocus = (ev) => {
      this.elements.chatinput.placeholder = 'Type something!';
      player.disable();
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
      message: 'has joined the room'
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
      message: data.message.data
    });
    this.scrollToBottom();
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
});
