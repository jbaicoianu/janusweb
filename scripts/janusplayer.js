elation.require(['engine.things.player', 'janusweb.external.JanusVOIP', 'ui.button'], function() {
  elation.requireCSS('janusweb.janusplayer');

  elation.component.add('engine.things.janusplayer', function() {
    this.postinit = function() {
      elation.engine.things.janusplayer.extendclass.postinit.call(this);
      this.defineProperties({
        cursor_visible: {type: 'boolean', default: true, set: this.toggleCursorVisibility}
      });
      this.controlstate2 = this.engine.systems.controls.addContext('janusplayer', {
        'voip_active': ['keyboard_v,keyboard_shift_v', elation.bind(this, this.activateVOIP)],
        'browse_back': ['gamepad_0_button_4', elation.bind(this, this.browseBack)],
        'browse_forward': ['gamepad_0_button_5', elation.bind(this, this.browseForward)],
      });
      this.vectors = {
        xdir: new THREE.Vector3(1, 0, 0),
        ydir: new THREE.Vector3(0, 1, 0),
        zdir: new THREE.Vector3(0, 0, 1),
        eye_pos: new THREE.Vector3(0, 1.6, 0),
        view_xdir: new THREE.Vector3(1, 0, 0),
        view_ydir: new THREE.Vector3(0, 1, 0),
        view_zdir: new THREE.Vector3(0, 0, 1),
        cursor_xdir: new THREE.Vector3(1, 0, 0),
        cursor_ydir: new THREE.Vector3(0, 1, 0),
        cursor_zdir: new THREE.Vector3(0, 0, 1),
        cursor_pos: new THREE.Vector3(0, 0, 0),
        lookat_pos: new THREE.Vector3(0, 0, 0),
      };
      this.hands = {
        left: {
          active: false,
          position: new THREE.Vector3(0, 0, 0),
          xdir: new THREE.Vector3(1, 0, 0),
          ydir: new THREE.Vector3(0, 1, 0),
          zdir: new THREE.Vector3(0, 0, 1),
          p0: new THREE.Vector3(0, 0, 0),
          p1: new THREE.Vector3(0, 0, 0),
          p2: new THREE.Vector3(0, 0, 0),
          p3: new THREE.Vector3(0, 0, 0),
          p4: new THREE.Vector3(0, 0, 0),
        },
        right: {
          active: false,
          position: new THREE.Vector3(0, 0, 0),
          xdir: new THREE.Vector3(1, 0, 0),
          ydir: new THREE.Vector3(0, 1, 0),
          zdir: new THREE.Vector3(0, 0, 1),
          p0: new THREE.Vector3(0, 0, 0),
          p1: new THREE.Vector3(0, 0, 0),
          p2: new THREE.Vector3(0, 0, 0),
          p3: new THREE.Vector3(0, 0, 0),
          p4: new THREE.Vector3(0, 0, 0),
        }
      };
      this.cursor_active = false;
      this.cursor_object = '';
      this.lookat_object = '';
      this.voip = new JanusVOIPRecorder({audioScale: 1024});
      this.voipqueue = [];
      this.voipbutton = elation.ui.button({classname: 'janusweb_voip', label: 'VOIP'});
      this.engine.client.buttons.add('voip', this.voipbutton);

      elation.events.add(this.voipbutton, 'mousedown,touchstart', elation.bind(this.voip, this.voip.start));
      elation.events.add(this.voipbutton, 'mouseup,touchend', elation.bind(this.voip, this.voip.stop));
      elation.events.add(this.voip, 'voip_start', elation.bind(this, this.handleVOIPStart));
      elation.events.add(this.voip, 'voip_stop', elation.bind(this, this.handleVOIPStop));
      elation.events.add(this.voip, 'voip_data', elation.bind(this, this.handleVOIPData));
      elation.events.add(this.voip, 'voip_error', elation.bind(this, this.handleVOIPError));
      elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.updateVectors));
      elation.events.add(null, 'mouseover', elation.bind(this, this.updateFocusObject));
      elation.events.add(null, 'mousemove', elation.bind(this, this.updateFocusObject));
      elation.events.add(null, 'mouseout', elation.bind(this, this.updateFocusObject));
      elation.events.add(this.engine.client.container, 'mousedown', elation.bind(this, this.updateMouseStatus));
      elation.events.add(this.engine.client.container, 'mouseup', elation.bind(this, this.updateMouseStatus));

      if (navigator.getVRDisplays) {
        this.vrbutton = elation.ui.button({classname: 'janusweb_vr', label: 'Toggle VR'});
        this.engine.client.buttons.add('vr', this.vrbutton);
        elation.events.add(this.vrbutton, 'ui_button_click', elation.bind(this.engine.client, this.engine.client.toggleVR));
      }
    }
    this.createChildren = function() {
      elation.engine.things.janusplayer.extendclass.createChildren.call(this);

setTimeout(elation.bind(this, function() {
      this.cursor = this.spawn('janusobject', 'playercursor', {
        js_id: 'player_cursor',
        position: this.vectors.cursor_pos,
        janusid: 'cursor_crosshair',
        pickable: false,
        collidable: false,
        visible: this.cursor_visible
      }, true);
      this.vectors.cursor_pos = this.cursor.position;
}), 1000);

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
    this.engine_frame = function(ev) {
      elation.engine.things.janusplayer.extendclass.engine_frame.call(this, ev);
      var transform = new THREE.Matrix4();
      if (this.tracker && this.tracker.hasHands()) {
        var hands = this.tracker.getHands();
        if (hands) {
          this.hands.left.active = hands.left.active;
          this.hands.right.active = hands.right.active;
          if (hands.left && hands.left.position) {
            var pos = hands.left.palmPosition,
                orient = hands.left.palmOrientation;
            if (pos instanceof THREE.Vector3) pos = pos.toArray();
            if (orient instanceof THREE.Quaternion) orient = orient.toArray();
            //this.localToWorld(this.hands.left.position.fromArray(pos));
            this.hands.left.position.fromArray(pos);

            transform.makeRotationFromQuaternion(hands.left.palmOrientation);
            transform.extractBasis(this.hands.left.xdir, this.hands.left.ydir, this.hands.left.zdir);
            this.hands.left.xdir.normalize();
            this.hands.left.ydir.normalize();
            this.hands.left.zdir.normalize();

            this.localToWorld(this.hands.left.p0.copy(hands.left.fingerTips[0]));
            this.localToWorld(this.hands.left.p1.copy(hands.left.fingerTips[1]));
            this.localToWorld(this.hands.left.p2.copy(hands.left.fingerTips[2]));
            this.localToWorld(this.hands.left.p3.copy(hands.left.fingerTips[3]));
            this.localToWorld(this.hands.left.p4.copy(hands.left.fingerTips[4]));
          }
          if (hands.right && hands.right.position) {
            var pos = hands.right.palmPosition,
                orient = hands.right.palmOrientation;
            if (pos instanceof THREE.Vector3) pos = pos.toArray();
            if (orient instanceof THREE.Quaternion) orient = orient.toArray();
            //this.localToWorld(this.hands.right.position.fromArray(pos));
            this.hands.right.position.fromArray(pos);

            transform.makeRotationFromQuaternion(hands.right.palmOrientation);
            transform.extractBasis(this.hands.right.xdir, this.hands.right.ydir, this.hands.right.zdir);
            this.hands.right.xdir.normalize();
            this.hands.right.ydir.normalize();
            this.hands.right.zdir.normalize();

            this.localToWorld(this.hands.right.p0.copy(hands.right.fingerTips[0]));
            this.localToWorld(this.hands.right.p1.copy(hands.right.fingerTips[1]));
            this.localToWorld(this.hands.right.p2.copy(hands.right.fingerTips[2]));
            this.localToWorld(this.hands.right.p3.copy(hands.right.fingerTips[3]));
            this.localToWorld(this.hands.right.p4.copy(hands.right.fingerTips[4]));
          }
        }
      }
    }
    this.updateVectors = function() {
      var v = this.vectors;
      if (this.objects['3d']) {
        this.objects['3d'].matrixWorld.extractBasis(v.xdir, v.ydir, v.zdir)
      }
      if (this.head) {
        this.head.objects['3d'].matrixWorld.extractBasis(v.view_xdir, v.view_ydir, v.view_zdir)
        v.view_zdir.negate();
      }
    }
    this.updateMouseStatus = function(ev) {
      if (ev.type == 'mousedown' && ev.button === 0) {
        this.cursor_active = true;
      } else if (ev.type == 'mouseup' && ev.button === 0) {
        this.cursor_active = false;
      }
    }
    this.updateFocusObject = function(ev) {
      var obj = ev.element;
      if ((ev.type == 'mouseover' || ev.type == 'mousemove') && obj && obj.js_id) {
        this.cursor_object = obj.js_id;
        this.vectors.cursor_pos.copy(ev.data.point);
        var face = ev.data.face;
        if (face) {
          this.vectors.cursor_zdir.copy(face.normal);
          var worldpos = this.localToWorld(new THREE.Vector3(0,0,0));

          this.vectors.cursor_xdir.subVectors(worldpos, this.vectors.cursor_pos).normalize();
          //this.vectors.cursor_ydir.crossVectors(this.vectors.cursor_xdir, this.vectors.cursor_zdir).normalize();
          this.vectors.cursor_ydir.set(0,1,0);
          var dot = this.vectors.cursor_ydir.dot(face.normal);
          if (Math.abs(dot) > 0.9) {
            this.vectors.cursor_ydir.crossVectors(this.vectors.cursor_xdir, this.vectors.cursor_zdir).normalize();
            this.vectors.cursor_xdir.crossVectors(this.vectors.cursor_ydir, this.vectors.cursor_zdir).normalize();
            if (dot / Math.abs(dot) > 0) {
              this.vectors.cursor_zdir.negate();
            }
          } else {
            //this.vectors.cursor_zdir.negate();
            this.vectors.cursor_ydir.set(0,1,0);
            this.vectors.cursor_xdir.crossVectors(this.vectors.cursor_zdir, this.vectors.cursor_ydir).normalize().negate();
          }

          //console.log(this.vectors.cursor_xdir.toArray(), this.vectors.cursor_ydir.toArray(), this.vectors.cursor_zdir.toArray());
          if (this.cursor) {
            var mat = new THREE.Matrix4().makeBasis(this.vectors.cursor_xdir, this.vectors.cursor_ydir, this.vectors.cursor_zdir);
            mat.decompose(new THREE.Vector3(), this.cursor.properties.orientation, new THREE.Vector3());
            var invscale = ev.data.distance / 10;
            this.cursor.scale.set(invscale,invscale,invscale);
          }
        }
//console.log(ev.data);

        this.lookat_object = obj.js_id;
        this.vectors.lookat_pos.copy(ev.data.point);
      } else {
        this.cursor_object = '';
        this.lookat_object = '';
      }
    }
    this.toggleCursorVisibility = function() {
      if (this.cursor) {
        this.cursor.visible = this.cursor_visible;
      }
    }
    this.getProxyObject = function() {
      var proxy = new elation.proxy(this, {
        pos:           ['property', 'position'],
        vel:           ['property', 'velocity'],
        accel:         ['property', 'acceleration'],
        eye_pos:       ['property', 'vectors.eye_pos'],
        head_pos:      ['property', 'head.properties.position'],
        cursor_pos:    ['property', 'vectors.cursor_pos'],
        cursor_xdir:   ['property', 'vectors.cursor_xdir'],
        cursor_ydir:   ['property', 'vectors.cursor_ydir'],
        cursor_zdir:   ['property', 'vectors.cursor_zdir'],
        view_dir:      ['property', 'vectors.view_zdir'],
        dir:           ['property', 'vectors.view_zdir'],
        up_dir:        ['property', 'vectors.ydir'],
        userid:        ['property', 'properties.player_id'],
        flying:        ['property', 'flying'],
        walking:       ['property', 'walking'],
        running:       ['property', 'running'],
        //url:           ['property', 'currenturl'],
        //hmd_enabled:   ['property', 'hmd_enabled'],
        cursor_active: ['property', 'cursor_active'],
        cursor_object: ['property', 'cursor_object'],
        lookat_object: ['property', 'lookat_object'],
        lookat_pos:    ['property', 'vectors.lookat_pos'],
        //lookat_xdir:   ['property', 'properties.lookat_xdir'],
        //lookat_ydir:   ['property', 'properties.lookat_ydir'],
        //lookat_zdir:   ['property', 'properties.lookat_zdir'],
        hand0_active:  ['property', 'hands.left.active'],
        hand0_pos:     ['property', 'hands.left.position'],
        hand0_xdir:    ['property', 'hands.left.xdir'],
        hand0_ydir:    ['property', 'hands.left.ydir'],
        hand0_zdir:    ['property', 'hands.left.zdir'],
        hand0_p0:      ['property', 'hands.left.p0'],
        hand0_p1:      ['property', 'hands.left.p1'],
        hand0_p2:      ['property', 'hands.left.p2'],
        hand0_p3:      ['property', 'hands.left.p3'],
        hand0_p4:      ['property', 'hands.left.p4'],

        hand1_active:  ['property', 'hands.right.active'],
        hand1_pos:     ['property', 'hands.right.position'],
        hand1_xdir:    ['property', 'hands.right.xdir'],
        hand1_ydir:    ['property', 'hands.right.ydir'],
        hand1_zdir:    ['property', 'hands.right.zdir'],
        hand1_p0:      ['property', 'hands.right.p0'],
        hand1_p1:      ['property', 'hands.right.p1'],
        hand1_p2:      ['property', 'hands.right.p2'],
        hand1_p3:      ['property', 'hands.right.p3'],
        hand1_p4:      ['property', 'hands.right.p4'],
        url:           ['property', 'parent.currentroom.url'],
      });
      return proxy;
    }
  }, elation.engine.things.player);
});
