// md5 hash functions

/*
 * http://www.myersdaily.org/joseph/javascript/md5-text.html
 */
var self = (typeof window != 'undefined' ? window : (typeof globals != 'undefined' ? globals : {}));
(function (global) {

  var md5cycle = function (x, k) {
    var a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);

  }

  var cmn = function (q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  var ff = function (a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  var gg = function (a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  var hh = function (a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  var ii = function (a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  var md51 = function (s) {
    var txt = '',
      n = s.length,
      state = [1732584193, -271733879, -1732584194, 271733878],
      i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  /* there needs to be support for Unicode here,
   * unless we pretend that we can redefine the MD-5
   * algorithm for multi-byte characters (perhaps
   * by adding every four 16-bit characters and
   * shortening the sum to 32 bits). Otherwise
   * I suggest performing MD-5 as if every character
   * was two bytes--e.g., 0040 0025 = @%--but then
   * how will an ordinary MD-5 sum be matched?
   * There is no way to standardize text to something
   * like UTF-8 before transformation; speed cost is
   * utterly prohibitive. The JavaScript standard
   * itself needs to look at this: it should start
   * providing access to strings as preformed UTF-8
   * 8-bit unsigned value arrays.
   */
  var md5blk = function (s) { /* I figured global was faster.   */
    var md5blks = [],
      i; /* Andy King said do it this way. */
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  var hex_chr = '0123456789abcdef'.split('');

  var rhex = function (n) {
    var s = '',
      j = 0;
    for (; j < 4; j++)
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    return s;
  }

  var hex = function (x) {
    for (var i = 0; i < x.length; i++)
      x[i] = rhex(x[i]);
    return x.join('');
  }

  var md5 = global.md5 = function (s) {
    return hex(md51(s));
  }

  /* this function is much faster,
  so if possible we use it. Some IEs
  are the only ones I know of that
  need the idiotic second function,
  generated by an if clause.  */

  var add32 = function (a, b) {
    return (a + b) & 0xFFFFFFFF;
  }

  if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
    var add32 = function (x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF),
        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }
  }

})(self);

// event dispatcher by mrdoob https://github.com/mrdoob/eventdispatcher.js
var EventDispatcher = function () {}

EventDispatcher.prototype = {

  constructor: EventDispatcher,

  apply: function ( object ) {

    object.addEventListener = EventDispatcher.prototype.addEventListener;
    object.hasEventListener = EventDispatcher.prototype.hasEventListener;
    object.removeEventListener = EventDispatcher.prototype.removeEventListener;
    object.dispatchEvent = EventDispatcher.prototype.dispatchEvent;

  },

  addEventListener: function ( type, listener ) {

    if ( this._listeners === undefined ) this._listeners = {};

    var listeners = this._listeners;

    if ( listeners[ type ] === undefined ) {

      listeners[ type ] = [];

    }

    if ( listeners[ type ].indexOf( listener ) === - 1 ) {

      listeners[ type ].push( listener );

    }

  },

  hasEventListener: function ( type, listener ) {

    if ( this._listeners === undefined ) return false;

    var listeners = this._listeners;

    if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {

      return true;

    }

    return false;

  },

  removeEventListener: function ( type, listener ) {

    if ( this._listeners === undefined ) return;

    var listeners = this._listeners;
    var listenerArray = listeners[ type ];

    if ( listenerArray !== undefined ) {

      var index = listenerArray.indexOf( listener );

      if ( index !== - 1 ) {

        listenerArray.splice( index, 1 );

      }

    }

  },

  dispatchEvent: function ( event ) {
      
    if ( this._listeners === undefined ) return;

    var listeners = this._listeners;
    var listenerArray = listeners[ event.type ];

    if ( listenerArray !== undefined ) {

      event.target = this;

      var array = [];
      var length = listenerArray.length;

      for ( var i = 0; i < length; i ++ ) {

        array[ i ] = listenerArray[ i ];

      }

      for ( var i = 0; i < length; i ++ ) {

        array[ i ].call( this, event );

      }

    }

  }

};
// jcc
var JanusClientConnection = function(opts)
{
  this._userId = opts.userId;
  this._roomUrl = opts.roomUrl;
  this._version = opts.version;
  this._host = opts.host;
  this.lastattempt = 0;
  this.reconnectdelay = 10000;
  this.rooms = {};
  this.connect();
}

EventDispatcher.prototype.apply(JanusClientConnection.prototype);

JanusClientConnection.prototype.connect = function() {
  this.dispatchEvent({type: 'connecting'});
  this.lastattempt = new Date().getTime();
  this.status = 0;
  this.error = '';
  this._websocket = new WebSocket(this._host, 'binary');
  this.status = 1;
  this.loggedin = false;
  this.loggingin = false;
  this.msgQueue = [];
  this._useridSuffix = '';
  this.pendingReconnect = false;
  this._websocket.onopen = function() {
    this.status = 2;
    this._useridSuffix = '';
    this.sendLogon();
    this.sendQueuedCommands()
    this.dispatchEvent({type: 'connect'});
  }.bind(this);

  this._websocket.onclose = function() {
    this.status = 0;
    this.dispatchEvent({type: 'disconnect'});
    this.reconnect();
  }.bind(this);

  this._websocket.onmessage = this.onMessage.bind(this)  
};
JanusClientConnection.prototype.reconnect = function(force) {
  var now = new Date().getTime();
  if (force || this.lastattempt + this.reconnectdelay <= now) {
    this.pendingReconnect = true;
    if (this._websocket.readyState == this._websocket.OPEN) {
      console.log('Socket already connected, disconnecting');
      this.disconnect();
    } else {
      console.log('Reconnecting...');
      this.connect();
    }
  } else {
    console.log('reconnect attempted too soon', this.lastattempt, now, this.reconnectdelay);
  }
}
JanusClientConnection.prototype.disconnect = function() {
  this.dispatchEvent({type: 'disconnecting'});
  this._websocket.close();
}
JanusClientConnection.prototype.sendQueuedCommands = function() {
  if (this._websocket.readyState > 0) {
    while (this.msgQueue.length > 0) {
      this.send(this.msgQueue.shift());
    }
  } else {
    setTimeout(() => this.sendQueuedCommands(), 100);
  }
}

JanusClientConnection.prototype.sendLogon = function() {
  var msgData = {
    'method': 'logon',
    'data': {
      'userId': this._userId + this._useridSuffix,
      'version': this._version
    }
  }
  if (this._roomUrl) {
    msgData.data.roomId = md5(this._roomUrl);
  }
  this.loggingin = true;
  this.send(msgData);
};
JanusClientConnection.prototype.setUserId = function(userId) {
  this._userId = userId;
  // TODO - if the network protocol had a 'change_name' command, we could switch usernames without reconnecting
  //this.sendLogon();
  this.reconnect(true);
};

JanusClientConnection.prototype.send = function(msg) {
  if (this._websocket.readyState > 1) {
    this.msgQueue.push(msg);
    if (!this.pendingReconnect) {
      this.reconnect();
    }
  } else {
    try {
      this._websocket.send(JSON.stringify(msg) + '\r\n');
    } catch (e) {
      this.msgQueue.push(msg);
    }
  }
};

JanusClientConnection.prototype.onMessage = function(msg) {
  var data = JSON.parse(msg.data);
  if (!this.loggedin && this.loggingin) {
    if (data.method == 'okay') {
      this.loggedin = true;
      this.dispatchEvent({type: 'login'});
      if (this._roomUrl) {
        if (this.rooms[this._roomUrl]) {
          // FIXME - this used to be needed when launching directly into a room, but causes problems with partymode
          //this.enter_room(this._roomUrl, true);
        } else {
          console.log('WARNING - received message for a room we don\'t know about', this._roomUrl);
        }
      }
    } else if (data.method == 'error') {
      console.log('[JanusClientConnection] error logging in', data);
      if (data.data.message == 'User name is already in use') {
        console.log('[JanusClientConnection] Username in use, retrying');
        this._useridSuffix += '_';
        this.sendLogon();
      }
    }
  }
  this.dispatchEvent({type: 'message', data: data});
};

JanusClientConnection.prototype.subscribe = function(url) {
  if (!this.rooms[url] || !this.rooms[url].subscribed) {
    var room = this.rooms[url] = {
      subscribed: true,
      url: url,
      id: md5(url)
    };
    this.send({
      'method': 'subscribe',
      'data': {
        'roomId': room.id
      }
    });
    console.log('[JanusClientConnection] subscribing to ', url, room);
  } else {
    console.log('[JanusClientConnection] already subscribed to ', url, this.rooms[url]);
  }
};

JanusClientConnection.prototype.unsubscribe = function(url) {
  if (this.rooms[url] && this.rooms[url].subscribed) {
    this.rooms[url].subscribed = false;
    this.send({
      'method': 'unsubscribe',
      'data': {
        'roomId': md5(url)
      }
    });
    console.log('[JanusClientConnection] unsubscribing from', url);
  } else {
    console.log('[JanusClientConnection] not subscribed to ', url);
  }
};

JanusClientConnection.prototype.enter_room = function(url, partymode) {
  if (typeof partymode == 'undefined') {
    partymode = false;
  }
  this.send({
    'method': 'enter_room',
    'data': {
      'roomId': md5(url),
      'roomUrl': room.url,
      'roomName': room.title,
      'partyMode': partymode
    }
  });
};
JanusClientConnection.prototype.leave_room = function(url) {
  this.send({
    'method': 'leave_room',
    'data': {
      'roomId': md5(url)
    }
  });
};

