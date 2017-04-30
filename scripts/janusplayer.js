elation.require(['engine.things.player', 'janusweb.external.JanusVOIP', 'ui.button'], function() {
  elation.requireCSS('janusweb.janusplayer');

  elation.component.add('engine.things.janusplayer', function() {
    this.postinit = function() {
      elation.engine.things.janusplayer.extendclass.postinit.call(this);
      this.defineProperties({
        janus: {type: 'object' },
        cursor_visible: {type: 'boolean', default: true, set: this.toggleCursorVisibility},
        usevoip: {type: 'boolean', default: false }
      });
      this.controlstate2 = this.engine.systems.controls.addContext('janusplayer', {
        'voip_active': ['keyboard_v,keyboard_shift_v', elation.bind(this, this.activateVOIP)],
        'browse_back': ['gamepad_any_button_4', elation.bind(this, this.browseBack)],
        'browse_forward': ['gamepad_any_button_5', elation.bind(this, this.browseForward)],
      });
      this.vectors = {
        xdir: new THREE.Vector3(1, 0, 0),
        ydir: new THREE.Vector3(0, 1, 0),
        zdir: new THREE.Vector3(0, 0, 1),
        eye_pos: new THREE.Vector3(0, 1.6, 0),
        head_pos: new THREE.Vector3(0, 1.6, 0),
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
      this.cursor_style = 'default';
      this.cursor_object = '';
      this.lookat_object = '';
      if (this.usevoip) {
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
      }
      elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.updateVectors));
      elation.events.add(this.engine.systems.render.views.main, 'render_view_prerender', elation.bind(this, this.updateCursor));
      elation.events.add(null, 'mouseover', elation.bind(this, this.updateFocusObject));
      elation.events.add(null, 'mousemove', elation.bind(this, this.updateFocusObject));
      elation.events.add(null, 'mouseout', elation.bind(this, this.updateFocusObject));
      elation.events.add(this.engine.client.container, 'mousedown', elation.bind(this, this.updateMouseStatus));
      elation.events.add(this.engine.client.container, 'mouseup', elation.bind(this, this.updateMouseStatus));

      this.updateVRButton();
    }
    this.createChildren = function() {
      elation.engine.things.janusplayer.extendclass.createChildren.call(this);

      setTimeout(elation.bind(this, function() {
        this.cursors = {
          'default': elation.engine.assets.find('image', 'cursor_arrow'),
          'crosshair': elation.engine.assets.find('image', 'cursor_crosshair'),
          'pointer': elation.engine.assets.find('image', 'cursor_hand'),
        };
        this.cursor = new THREE.Sprite(new THREE.SpriteMaterial({color: 0xffffff, depthTest: false, depthWrite: false, map: null}));
        this.engine.systems.world.scene['world-3d'].add(this.cursor);
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
    this.updateVRButton = function() {
      if (this.engine.client.view.vrdisplay) {
        if (!this.vrbutton) {
          this.vrbutton = elation.ui.button({classname: 'janusweb_vr', label: 'Enter VR'});
          this.engine.client.buttons.add('vr', this.vrbutton);
          elation.events.add(this.vrbutton, 'ui_button_click', elation.bind(this, function(ev) { this.engine.client.toggleVR(ev); }));
          elation.events.add(this.engine.client.view, elation.bind(this, function(ev) {
            var vrdisplay = ev.data;
            elation.events.add(ev.data, 'vrdisplaypresentchange', elation.bind(this, function() { this.vrbutton.label = (vrdisplay && vrdisplay.isPresenting ? 'Exit' : 'Enter') + ' VR'; }));
          }));
        }
      }
    }
    this.activateVOIP = function(ev) {
      var on = (ev.value == 1);
      if (this.voip) {
        if (on) {
          this.voip.start();
        } else {
          this.voip.stop();
        }
      }
    }
    this.updateHMD = function(vrdevice) {
      if (vrdevice && !this.vrbutton) {
        this.updateVRButton();
      }
      elation.engine.things.janusplayer.extendclass.updateHMD.call(this, vrdevice);
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
          this.hands.left.active = hands.left && hands.left.active;
          this.hands.right.active = hands.right && hands.right.active;
          if (hands.left && hands.left.position) {
            var pos = hands.left.palmPosition || hands.left.position,
                orient = hands.left.palmOrientation || hands.left.orientation;
            if (pos instanceof THREE.Vector3) pos = pos.toArray();
            if (orient instanceof THREE.Quaternion) orient = orient.toArray();
            //this.localToWorld(this.hands.left.position.fromArray(pos));
            if (pos) {
              this.hands.left.position.fromArray(pos);
            }

            if (orient) {
              transform.makeRotationFromQuaternion(orient);
              transform.extractBasis(this.hands.left.xdir, this.hands.left.ydir, this.hands.left.zdir);
              this.hands.left.xdir.normalize();
              this.hands.left.ydir.normalize();
              this.hands.left.zdir.normalize();
            }

            if (hands.left.fingerTips) {
              this.localToWorld(this.hands.left.p0.copy(hands.left.fingerTips[0]));
              this.localToWorld(this.hands.left.p1.copy(hands.left.fingerTips[1]));
              this.localToWorld(this.hands.left.p2.copy(hands.left.fingerTips[2]));
              this.localToWorld(this.hands.left.p3.copy(hands.left.fingerTips[3]));
              this.localToWorld(this.hands.left.p4.copy(hands.left.fingerTips[4]));
            }
          }
          if (hands.right && hands.right.position) {
            var pos = hands.right.palmPosition || hands.right.position,
                orient = hands.right.palmOrientation || hands.right.orientation;
            if (pos instanceof THREE.Vector3) pos = pos.toArray();
            if (orient instanceof THREE.Quaternion) orient = orient.toArray();
            //this.localToWorld(this.hands.right.position.fromArray(pos));
            if (pos) {
              this.hands.right.position.fromArray(pos);
            }

            if (orient) {
              transform.makeRotationFromQuaternion(orient);
              transform.extractBasis(this.hands.right.xdir, this.hands.right.ydir, this.hands.right.zdir);
              this.hands.right.xdir.normalize();
              this.hands.right.ydir.normalize();
              this.hands.right.zdir.normalize();
            }

            if (hands.right.fingerTips) {
              this.localToWorld(this.hands.right.p0.copy(hands.right.fingerTips[0]));
              this.localToWorld(this.hands.right.p1.copy(hands.right.fingerTips[1]));
              this.localToWorld(this.hands.right.p2.copy(hands.right.fingerTips[2]));
              this.localToWorld(this.hands.right.p3.copy(hands.right.fingerTips[3]));
              this.localToWorld(this.hands.right.p4.copy(hands.right.fingerTips[4]));
            }
          }
        }
      }
    }
    this.updateCursor = function() {
      if (this.cursor_object == '') {
        this.camera.localToWorld(this.vectors.cursor_pos.set(0,0,-10));
      }
      if (this.cursor) {
        // Show system cursor when the mouse is unlocked and we're not in VR
        // Otherwise, we'll render one in the 3d scene

        var vrdisplay = this.engine.systems.render.views.main.vrdisplay;
        var useSystemCursor = !(this.engine.systems.controls.pointerLockActive || (vrdisplay));
        if (useSystemCursor) {
          this.cursor.visible = false;
          var view = this.engine.systems.render.views.main;
          if (!view.hasclass('cursor_' + this.cursor_style)) {
            var cursortypes = Object.keys(this.cursors);
            for (var i = 0; i < cursortypes.length; i++) { 
              var thistype = cursortypes[i] == this.cursor_style,
                  hasclass = view.hasclass('cursor_' + cursortypes[i]);
              if (thistype && !hasclass) {
                view.addclass('cursor_' + this.cursor_style);
              } else if (hasclass) {
                view.removeclass('cursor_' + cursortypes[i]);
              }
            }
          }
        } else {
          this.cursor.visible = this.cursor_visible;
          var distance = this.camera.localToWorld(new THREE.Vector3()).distanceTo(this.vectors.cursor_pos);
          var size = distance / 12; // FIXME - add cursor scaling
          this.cursor.position.copy(this.vectors.cursor_pos);
          this.cursor.scale.set(size,size,size);

          if (this.cursor_object == '') {
            this.cursor.material.opacity = .5;
          } else {
            this.cursor.material.opacity = 1;
          }

          if (this.cursors[this.cursor_style]) {
            this.cursor.material.map = this.cursors[this.cursor_style];
          } else if (this.cursors['default']) {
            this.cursor.material.map = this.cursors['default'];
          } else {
            this.cursor.material.map = null;
            this.cursor.visible = false;
          }
        }
      }
      this.camera.objects['3d'].updateMatrix();
      this.camera.objects['3d'].updateMatrixWorld();
    }
    this.updateVectors = function() {
      var v = this.vectors;
      if (this.objects['3d']) {
        this.objects['3d'].matrixWorld.extractBasis(v.xdir, v.ydir, v.zdir)
      }
      if (this.head) {
        this.head.objects['3d'].matrixWorld.extractBasis(v.view_xdir, v.view_ydir, v.view_zdir)
        v.head_pos.setFromMatrixPosition(this.head.objects['3d'].matrixWorld);
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
        var worldpos = this.camera.localToWorld(new THREE.Vector3(0,0,0));
        var diff = ev.data.point.clone().sub(worldpos);
        this.vectors.cursor_pos.copy(diff).multiplyScalar(-.05).add(ev.data.point);

        this.lookat_object = obj.js_id;
        this.vectors.lookat_pos.copy(ev.data.point);
      } else {
        this.cursor_object = '';
        this.lookat_object = '';
        var distance = 20;
        this.camera.localToWorld(this.vectors.cursor_pos.set(0,0,-distance));
      }
    }
    this.toggleCursorVisibility = function() {
      if (this.cursor) {
        this.cursor.visible = this.cursor_visible;
      }
    }
    this.reset_position = function(ev) {
      if (!ev || ev.value == 1) {
        var room = this.engine.client.janusweb.currentroom;
        if (room) {
          var pos = room.playerstartposition;
          // If startpos is < 3 elements, pad it with 0s
          if (pos.length < 3) {
            var len = pos.length;
            pos.length = 3;
            pos.fill(0, len, 3);
          }
          this.properties.position.fromArray(room.playerstartposition);
          this.properties.orientation.copy(room.playerstartorientation);
          this.properties.orientation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)));
          this.head.properties.orientation.copy(this.properties.startcameraorientation);
          this.properties.velocity.set(0,0,0);
          this.objects.dynamics.angular.set(0,0,0);
          //this.engine.systems.controls.calibrateHMDs();
          this.refresh();
        }
      }
    }
    this.getProxyObject = function() {
      var proxy = new elation.proxy(this, {
        pos:           ['property', 'position'],
        vel:           ['property', 'velocity'],
        accel:         ['property', 'acceleration'],
        eye_pos:       ['property', 'vectors.eye_pos'],
        head_pos:      ['property', 'vectors.head_pos'],
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
        cursor_style: ['property', 'cursor_style'],
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
