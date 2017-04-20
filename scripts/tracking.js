elation.require([], function() {
  var track = elation.config.get('janusweb.tracking.enabled', false);
  if (elation.env.isBrowser && track) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', elation.config.get('janusweb.tracking.clientid'), 'auto');
    ga('set', 'page', "/");
    //ga('send', 'pageview');

    elation.events.add(null, 'room_change', function(ev) {
      console.log('[tracking] room changed', ev.type, ev.data);
      setTimeout(function() {
        ga('set', 'page', '/sites/' + ev.data);
        ga('send', 'pageview');
      }, 100);
    });
    elation.events.add(null, 'menu_enable', function(ev) {
      console.log('[tracking] menu shown', ev);
      ga('send', 'event', 'menu', 'show');
    });
    elation.events.add(null, 'menu_disable', function(ev) {
      console.log('[tracking] menu hidden', ev);
      ga('send', 'event', 'menu', 'hide');
    });
    elation.events.add(null, 'menuitem_activate', function(ev) {
      console.log('[tracking] menu item selected', ev);
      ga('send', 'event', 'menu', 'select', ev.element.properties.text);
    });
    elation.events.add(null, 'janusweb_chat_send', function(ev) {
      console.log('[tracking] chat sent', ev);
      ga('send', 'event', 'player', 'chat');
    });
    elation.events.add(null, 'janusweb_portal_click', function(ev) {
      console.log('[tracking] portal clicked', ev);
      ga('send', 'event', 'player', 'portal_click', ev.element.properties.url);
    });
    elation.events.add(null, 'janusweb_load_url', function(ev) {
      console.log('[tracking] url loaded', ev);
      ga('send', 'event', 'player', 'load_url', ev.data);
    });
    elation.events.add(null, 'janusweb_client_connected', function(ev) {
      console.log('[tracking] client connected', ev);
      ga('send', 'event', 'client', 'connected', ev.data);
    });
/*
    elation.events.add(document, 'pointerlockchange,mozpointerlockchange', function(ev) {
var el = document.pointerLockElement || document.mozPointerLockElement
      console.log('[tracking] pointer lock!', (el !== null), ev);
      ga('send', 'event', 'player', 'pointerlock', (el !== null));
    });
*/
    elation.events.add(null, 'janusweb_client_disconnected', function(ev) {
      console.log('[tracking] client disconnected', ev);
      ga('send', 'event', 'client', 'disconnected', ev.data);
    });
    elation.events.add(null, 'janusweb_user_joined', function(ev) {
      console.log('[tracking] user joined', ev);
      ga('send', 'event', 'user', 'joined', ev.data.name);
    });
    elation.events.add(null, 'janusweb_user_left', function(ev) {
      console.log('[tracking] user left', ev);
      ga('send', 'event', 'user', 'left', ev.data.name);
    });
    elation.events.add(null, 'janusweb_bookmark_add', function(ev) {
      console.log('[tracking] bookmark added', ev);
      ga('send', 'event', 'bookmark', 'add', ev.data.url);
    });
    elation.events.add(null, 'engine_render_view_vr_detected', function(ev) {
      console.log('[tracking] vr display detected', ev);
      ga('send', 'event', 'vr', 'detected', ev.data.deviceName);
    });
    elation.events.add(null, 'engine_render_view_vr_start', function(ev) {
      console.log('[tracking] vr display activated', ev);
      ga('send', 'event', 'vr', 'start');
    });
    elation.events.add(null, 'voip_init', function(ev) {
      console.log('[tracking] voip init', ev);
      ga('send', 'event', 'voip', 'init');
    });
    elation.events.add(null, 'voip_start', function(ev) {
      console.log('[tracking] voip start', ev);
      ga('send', 'event', 'voip', 'start');
    });
    elation.events.add(null, 'voip_stop', function(ev) {
      console.log('[tracking] voip stop', ev);
      ga('send', 'event', 'voip', 'stop');
    });
    elation.events.add(null, 'voip_error', function(ev) {
      console.log('[tracking] voip error', ev);
      ga('send', 'event', 'voip', 'error', ev.data.name + ' : ' + ev.data.message);
    });
    elation.events.add(null, 'engine_render_view_vr_end', function(ev) {
      console.log('[tracking] vr display ended', ev);
      ga('send', 'event', 'vr', 'end');
    });
    elation.events.add(null, 'engine_start', function(ev) {
      var engine = ev.element;

      ga('send', 'event', 'engine', 'start');

      elation.events.add(engine, 'engine_stop', function(ev) {
        ga('send', 'event', 'engine', 'stop');
      });

      var fired = {
        playerMoved: false,
        playerTurned: false,
        playerPortaled: false,
        playerChatted: false
      };
      var player = engine.client.player;
      var playerStartPosition = player.properties.position.clone();
      var playerStartOrientation = player.properties.orientation.clone();

      var doPlayerChange = function(ev) {
        var player = ev.element;
        var cs = player.controlstate;

        if (!fired.playerMoved && !player.properties.position.equals(playerStartPosition)) {
          ga('send', 'event', 'player', 'moved');
          fired['playerMoved'] = true;
        }
        if (!fired.playerTurned && !player.properties.orientation.equals(playerStartOrientation)) {
          ga('send', 'event', 'player', 'turned');
          fired['playerTurned'] = true;
        }
      }
      setTimeout(function() {
        elation.events.add(player, 'thing_change', doPlayerChange);
        playerStartPosition.copy(player.properties.position);
        playerStartOrientation.copy(player.properties.orientation);
      }, 1000);

      // report FPS every 15 seconds
/*
      var stats = document.getElementById('fpsText');
      if (stats) {
        setInterval(function() {
          var fpstxt = document.getElementById('fpsText').innerHTML; 
          var fps = fpstxt.substr(0, fpstxt.indexOf(' '))
          ga('send', 'event', 'engine', 'fps', fps);
        }, 15000);
      }
*/
      
    });
    elation.events.add(window, 'error', function(msg) {
      ga('send', 'event', 'client', 'error', msg.message);
    });
  }
});
