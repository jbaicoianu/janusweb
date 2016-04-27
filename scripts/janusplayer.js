elation.require(['engine.things.player', 'janusweb.external.JanusVOIP', 'ui.button'], function() {
  elation.requireCSS('janusweb.janusplayer');

  elation.component.add('engine.things.janusplayer', function() {
    this.postinit = function() {
      elation.engine.things.janusplayer.extendclass.postinit.call(this);
      this.controlstate2 = this.engine.systems.controls.addContext('janusplayer', {
        'voip_active': ['keyboard_v,keyboard_shift_v', elation.bind(this, this.activateVOIP)],
        'browse_back': ['gamepad_0_button_4', elation.bind(this, this.browseBack)],
        'browse_forward': ['gamepad_0_button_5', elation.bind(this, this.browseForward)],
      });
      this.voip = new JanusVOIPRecorder({audioScale: 1024});
      this.voipqueue = [];
      this.voipbutton = elation.ui.button({append: document.body, classname: 'janusweb_voip', label: 'VOIP'});
      elation.events.add(this.voipbutton, 'mousedown,touchstart', elation.bind(this.voip, this.voip.start));
      elation.events.add(this.voipbutton, 'mouseup,touchend', elation.bind(this.voip, this.voip.stop));
      elation.events.add(this.voip, 'voip_start', elation.bind(this, this.handleVOIPStart));
      elation.events.add(this.voip, 'voip_stop', elation.bind(this, this.handleVOIPStop));
      elation.events.add(this.voip, 'voip_data', elation.bind(this, this.handleVOIPData));
      elation.events.add(this.voip, 'voip_error', elation.bind(this, this.handleVOIPError));
    }
    this.enable = function() {
      elation.engine.things.janusplayer.extendclass.enable.call(this);
      this.engine.systems.controls.activateContext('janusplayer');
    }
    this.disable = function() {
      this.engine.systems.controls.deactivateContext('janusplayer');
      elation.engine.things.janusplayer.extendclass.disable.call(this);
    }
    this.activateVOIP = function(ev) {
      var on = (ev.value == 1);
      if (on) {
        this.voip.start();
      } else {
        this.voip.stop();
      }
    }
    this.handleVOIPStart = function() {
      this.voipbutton.addclass('state_recording');
      elation.events.fire('janusvr_voip_start');
    }
    this.handleVOIPStop = function() {
      elation.events.fire('janusvr_voip_stop');
      this.voipbutton.removeclass('state_recording');
    }
    this.handleVOIPData = function(ev) {
      this.voipqueue.push(ev.data);
    }
    this.handleVOIPError = function(ev) {
      this.voipbutton.addclass('state_error');
      this.voipbutton.setTitle(ev.data.name + ': ' + ev.data.message);
      elation.events.fire('janusvr_voip_error');
    }
    this.browseBack = function(ev) {
      if (ev.value == 1) {
        history.go(-1);
      }
    }
    this.browseForward = function(ev) {
      if (ev.value == 1) {
        history.go(1);
      }
    }
  }, elation.engine.things.player);
});
