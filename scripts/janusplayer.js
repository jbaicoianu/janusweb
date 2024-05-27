elation.require(['engine.things.player', 'janusweb.external.JanusVOIP', 'ui.button'], function() {
  elation.requireCSS('janusweb.janusplayer');

  elation.component.add('engine.things.janusplayer', function() {
    //this.defaultavatar = '<FireBoxRoom>\n  <Assets>\n    <AssetObject id="screen" src="https://web.janusxr.org/media/assets/hoverscreen.obj" mtl="https://web.janusxr.org/media/assets/hoverscreen.mtl" />\n  </Assets>\n  <Room>\n    <Ghost id="januswebuser" col="#ffffff" lighting="true" head_pos="0 1.4 0" body_id="" eye_pos="0 1.6 0" userid_pos="0 0.5 0" cull_face="back" screen_name="screen_Cube.004">\n      <Object id="screen" js_id="head" />\n    </Ghost>\n  </Room>\n</FireBoxRoom>'
    //this.defaultavatar = '<FireBoxRoom>\n<Assets>\n<AssetObject id="screen" src="https://vesta.janusxr.org/avatars/static/janusweb/janusweb.obj.gz" mtl="https://vesta.janusxr.org/user_avatar/12689/janusweb.mtl" /></Assets>\n<Room>\n<Ghost id="januswebuser" head_id="screen" head_pos="0 1.4 0" body_id="" eye_pos="0 1.6 0" userid_pos="0 0.5 0" cull_face="back" />\n</Room>\n</FireBoxRoom>';
    this.defaultavatar = `
    <FireBoxRoom>
      <assets>
        <assetobject id="body" src="http://www.baicoianu.com/~bai/janusweb/test/janus-avatar-base.glb" />
        <assetobject id="avatar_animations" src="http://www.baicoianu.com/~bai/janusweb/test/janus-avatar-animations.glb" />
      </assets>
      <room>
        <ghost scale=".01 .01 .01" col="#e0d5a1" body_id="body" bone_head="head" />
      </room>
    </FireBoxRoom>
    `;

    this.postinit = function() {
      elation.engine.things.janusplayer.extendclass.postinit.call(this);

      try {
        this.settings = elation.collection.localindexed({storagekey: 'janusweb.player.settings', index: 'key'});
      } catch (e) {
        this.settings = elation.collection.indexed({storagekey: 'janusweb.player.settings', index: 'key'});
      }

      this.defineProperties({
        janus: {type: 'object' },
        room: {type: 'object' },
        cursor_visible: {type: 'boolean', default: true, set: this.toggleCursorVisibility},
        cursor_opacity: {type: 'float', default: 1.0, set: this.toggleCursorVisibility},
        usevoip: {type: 'boolean', default: false },
        defaultanimation: {type: 'string', default: 'idle' },
        collision_radius: {type: 'float', default: .25, set: this.updateCollider},
        party_mode: { type: 'boolean', set: this.updatePartyMode },
        avatarsrc: { type: 'string' },
        cameraview: { type: 'string', default: 'firstperson' },
        camerazoom: { type: 'float', default: 0 },
        cameraangle: { type: 'float', default: 0 },
        decouplehead: { type: 'boolean', default: false },
      });

      var controllerconfig = this.getSetting('controls.settings');
      if (controllerconfig) {
        elation.utils.merge(controllerconfig, this.engine.systems.controls.settings);
      }
      elation.events.add(this.engine.systems.controls, 'settings_change', elation.bind(this, function() {
        this.setSetting('controls.settings', this.engine.systems.controls.settings);
      }));
      elation.events.add(this.engine.client.view.container, 'touchstart', elation.bind(this, this.handleTouchStart));
      elation.events.add(this.engine.client.view.container, 'touchmove', elation.bind(this, this.handleTouchMove));
      elation.events.add(this.engine.client.view.container, 'touchend', elation.bind(this, this.handleTouchEnd));
      elation.events.add(this.engine.client.view.container, 'touchcancel', elation.bind(this, this.handleTouchEnd));

      this.controlstate2 = this.engine.systems.controls.addContext('janusplayer', {
        'toggle_view': ['keyboard_nomod_v,keyboard_shift_v', elation.bind(this, this.toggleCamera)],
        'zoom_out': ['mouse_wheel_down', ev => this.zoomView(-1, ev)],
        'zoom_in': ['mouse_wheel_up', ev => this.zoomView(1, ev)],
        //'browse_back': ['gamepad_any_button_4', elation.bind(this, this.browseBack)],
        //'browse_forward': ['gamepad_any_button_5', elation.bind(this, this.browseForward)],
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
      window.addEventListener('blur', ev => {
        if (document.pointerLockElement && document.activeElement instanceof HTMLIFrameElement) {
          document.pointerLockElement.focus();
//this.disable();
      this.engine.systems.controls.deactivateContext('janusplayer');
      this.engine.systems.controls.activateContext('janusplayer');
let click = new MouseEvent('click', { });
document.body.dispatchEvent(click);
//setTimeout(() => this.enable(), 100);
        }
      });

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
      elation.events.add(this.engine.systems.render.views.main, 'render_view_prerender', elation.bind(this, this.updateCursor));
      elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.handleFrame));
      elation.events.add(this.engine.client.container, 'mousedown', elation.bind(this, this.updateMouseStatus));
      elation.events.add(this.engine.client.container, 'mouseup', elation.bind(this, this.updateMouseStatus));

      this.updateCursorStyle = elation.bind(this, this.updateCursorStyle);

      this.touchcache = {
        positions: []
      };
      this.touchindex = [null, null];

      //this.updateVRButton();
      this.party_mode = this.getSetting('partymode.enabled', false);
      this.currentavatar = '';
      this.getAvatarData().then(d => this.currentavatar = d);
      this.morphtargetchanges = {};
    }
    this.createChildren = function() {
      elation.engine.things.janusplayer.extendclass.createChildren.call(this);

      this.cursor = new THREE.Sprite(new THREE.SpriteMaterial({color: 0xffffff, depthTest: false, depthWrite: false, transparent: true, map: null, fog: false}));
      this.cursor.renderOrder = 100;
      this.engine.systems.world.scene['world-3d'].add(this.cursor);


      this.getAvatarData().then(avatar => {;
        if (avatar && false) { // FIXME - self avatar is buggy so it's disabled
/*
          this.ghost = this.createObject('ghost', {
            ghost_id: this.getUsername(),
            avatar_src: 'data:text/plain,' + encodeURIComponent(avatar),
            showlabel: false
          });
*/
        }
      });

      this.updateCollider();
    }
    this.enable = function() {
      elation.engine.things.janusplayer.extendclass.enable.call(this);
      this.engine.systems.controls.activateContext('janusplayer');
      this.dispatchEvent({type: 'player_enable'});
    }
    this.disable = function() {
      this.engine.systems.controls.deactivateContext('janusplayer');
      elation.engine.things.janusplayer.extendclass.disable.call(this);
      this.dispatchEvent({type: 'player_disable'});
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
        //this.updateVRButton();
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
    this.engine_frame = (function() {
      var _transform = new THREE.Matrix4();
      var _tmpquat = new THREE.Quaternion();

      return function(ev) {
        // FIXME - this should be called in a pre-frame function, so that hands get updated before the renderer runs, for minimal delay
        elation.engine.things.janusplayer.extendclass.engine_frame.call(this, ev);
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
                this.hands.left.handpos.fromArray(pos);
              }

              if (orient) {
                _transform.makeRotationFromQuaternion(_tmpquat.fromArray(orient));
                _transform.extractBasis(this.hands.left.xdir, this.hands.left.ydir, this.hands.left.zdir);
                this.hands.left.xdir.normalize();
                this.hands.left.ydir.normalize();
                this.hands.left.zdir.normalize();
              }

              if (hands.left.fingers) {
                hands.left.fingers[0].fingertip.getWorldPosition(this.hands.left.p0);
                hands.left.fingers[1].fingertip.getWorldPosition(this.hands.left.p1);
                hands.left.fingers[2].fingertip.getWorldPosition(this.hands.left.p2);
                hands.left.fingers[3].fingertip.getWorldPosition(this.hands.left.p3);
                hands.left.fingers[4].fingertip.getWorldPosition(this.hands.left.p4);
              }
            }
            if (hands.right && hands.right.position) {
              var pos = hands.right.palmPosition || hands.right.position,
                  orient = hands.right.palmOrientation || hands.right.orientation;
              if (pos instanceof THREE.Vector3) pos = pos.toArray();
              if (orient instanceof THREE.Quaternion) orient = orient.toArray();
              //this.localToWorld(this.hands.right.position.fromArray(pos));
              if (pos) {
                this.hands.right.handpos.fromArray(pos);
              }

              if (orient) {
                //_transform.makeRotationFromQuaternion(orient);
                _transform.makeRotationFromQuaternion(_tmpquat.fromArray(orient));
                _transform.extractBasis(this.hands.right.xdir, this.hands.right.ydir, this.hands.right.zdir);
                this.hands.right.xdir.normalize();
                this.hands.right.ydir.normalize();
                this.hands.right.zdir.normalize();
              }

              if (hands.right.fingers) {
                hands.right.fingers[0].fingertip.getWorldPosition(this.hands.right.p0);
                hands.right.fingers[1].fingertip.getWorldPosition(this.hands.right.p1);
                hands.right.fingers[2].fingertip.getWorldPosition(this.hands.right.p2);
                hands.right.fingers[3].fingertip.getWorldPosition(this.hands.right.p3);
                hands.right.fingers[4].fingertip.getWorldPosition(this.hands.right.p4);
              }
            }
          }
        }
        if (this.ghost && !this.decouplehead) {
          this.ghost.setHeadOrientation(this.head.orientation, true);
          if (this.ghost._target.head) {
            //this.ghost._target.face.position.copy(this.head.position);
            this.ghost.head.orientation.copy(this.head.orientation).invert();
          }
        }
      }
    })();
    this.handleFrame = function() {
      if (this.lookAtLERPtime) {
        this.updateLookAtLERP();
      }
      if (this.ghost && this.ghost.body) {
        let animid = this.getAnimationID();
        this.ghost.body.anim_id = animid;
      }
    }
    this.updateCursor = (function() {
      var _tmpvec = new THREE.Vector3();

      return function() {
        this.updateMouseControls({data: this.controlstate});
        this.updateVectors();
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
            if (this.cursors && !view.hasclass('cursor_' + this.cursor_style)) {
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
            var distance = this.camera.localToWorld(_tmpvec.set(0,0,0)).distanceTo(this.vectors.cursor_pos);
            var size = distance / 12; // FIXME - add cursor scaling
            this.cursor.position.copy(this.vectors.cursor_pos);
            this.cursor.scale.set(size,size,size);

            if (this.cursor_object == '') {
              this.cursor.material.opacity = .5 * this.cursor_opacity;
            } else {
              this.cursor.material.opacity = this.cursor_opacity;
            }

            if (this.cursors[this.cursor_style]) {
              this.cursor.material.map = this.cursors[this.cursor_style]._texture;
            } else if (this.cursors['default']) {
              this.cursor.material.map = this.cursors['default']._texture;
            } else {
              this.cursor.material.map = null;
              this.cursor.visible = false;
            }
          }
        }
        this.objects['3d'].updateMatrix();
        if (this.objects['3d'].matrixWorldNeedsUpdate) this.objects['3d'].updateMatrixWorld();
        this.camera.objects['3d'].updateMatrix();
        if (this.camera.objects['3d'].matrixWorldNeedsUpdate) this.camera.objects['3d'].updateMatrixWorld();
      }
    })();
    this.updateVectors = function() {
      var v = this.vectors;
      if (this.objects['3d']) {
        let playerpos = this.properties.position;
        if (typeof playerpos.x == 'undefined' || isNaN(playerpos.x)) playerpos.x = 0;
        if (typeof playerpos.y == 'undefined' || isNaN(playerpos.y)) playerpos.y = 0;
        if (typeof playerpos.z == 'undefined' || isNaN(playerpos.z)) playerpos.z = 0;
        this.objects['3d'].updateMatrix();
        this.objects['3d'].updateMatrixWorld();
        this.objects['3d'].matrixWorld.extractBasis(v.xdir, v.ydir, v.zdir);
      }
      if (this.head) {
        this.head.objects['3d'].matrixWorld.extractBasis(v.view_xdir, v.view_ydir, v.view_zdir);
        v.head_pos.setFromMatrixPosition(this.head.objects['3d'].matrixWorld);
      }

      if (this.gaze && this.gaze.object) {
        var now = performance.now();
        var gazetime = 1000;
        if (this.gaze.object.gazetime) {
          gazetime = this.gaze.object.gazetime;
        } else if (this.gaze.object.room && this.gaze.object.room.gazetime) {
          gazetime = this.gaze.object.room.gazetime;
        }
        var diff = now - this.gaze.start;
        var percent = diff / gazetime;
        if (percent < 1) {
          this.gaze.object.dispatchEvent({type: 'gazeprogress', data: percent});
        } else if (!this.gaze.fired) {
          this.gaze.object.dispatchEvent({type: 'gazeprogress', data: 1});
          this.gaze.object.dispatchEvent({type: 'gazeactivate', data: null});
          this.gaze.fired = true;
        }
      }
      if (this.controlstate.jump && !this.jumping) {
        let jumptime = 1;
        if (this.ghost && this.ghost.body && this.ghost.body.animations && this.ghost.body.animations.jump) {
          let jumpanim = this.ghost.body.animations.jump;
          let jumpclip = jumpanim.getClip();

          jumpanim.loop = THREE.LoopOnce;

          if (jumpclip) {
            jumptime = jumpclip.duration;
          }
          this.jumping = true;
          setTimeout(() => this.jumping = false, (jumptime * 1000) * .8);
        }
      }
    }
    this.updateMouseStatus = function(ev) {
      if (ev.type == 'mousedown' && ev.button === 0) {
        this.cursor_active = true;
      } else if (ev.type == 'mouseup' && ev.button === 0) {
        this.cursor_active = false;
      }
    }
    this.updateFocusObject = (function() {
      var _tmpvec = new THREE.Vector3(),
          _diff = new THREE.Vector3();

      return function(ev) {
        var obj = ev.element;
        if ((ev.type == 'mouseover' || ev.type == 'mousemove') && obj && obj.js_id) {
          this.cursor_object = obj.js_id;
          var worldpos = this.camera.localToWorld(_tmpvec.set(0,0,0));
          _diff.copy(ev.data.point).sub(worldpos);
          this.vectors.cursor_pos.copy(_diff).multiplyScalar(-.05).add(ev.data.point);

          this.lookat_object = obj.js_id;
          this.vectors.lookat_pos.copy(ev.data.point);
        } else {
          this.cursor_object = '';
          this.lookat_object = '';
          var distance = 20;
          this.camera.localToWorld(this.vectors.cursor_pos.set(0,0,-distance));
        }
      }
    })();
    this.toggleCursorVisibility = function() {
      if (this.cursor) {
        this.cursor.visible = this.cursor_visible;
      }
    }
    this.setRoom = function(newroom) {
      if (this.room) {
        let oldroomproxy = this.room.getProxyObject();
        oldroomproxy.removeEventListener('mouseover', this.updateCursorStyle);
        oldroomproxy.removeEventListener('mouseout', this.updateCursorStyle);
        this.room.part();
      }
      this.room = newroom;
      this.room.join();

/*
      if (!this.gazecaster) {
        this.gazecaster = newroom.createObject('raycaster', {persist: false});
        this.head.add(this.gazecaster._target);
        //this.gazecaster = this.head.spawn('raycaster', null, {room: this.room, janus: this.janus});
        elation.events.add(this.gazecaster._target, 'raycastenter', elation.bind(this, this.handleGazeEnter));
        elation.events.add(this.gazecaster._target, 'raycastleave', elation.bind(this, this.handleGazeLeave));
        elation.events.add(this.gazecaster._target, 'raycastmove', elation.bind(this, this.handleGazeMove));
      } else {
        this.gazecaster.setRoom(newroom);
      }
*/
      let newroomproxy = newroom.getProxyObject();
      newroomproxy.addEventListener('mouseover', this.updateCursorStyle);
      newroomproxy.addEventListener('mouseout', this.updateCursorStyle);

      if (!this.cursors) {
        this.cursors = {
          'default': janus.getAsset('image', 'cursor_crosshair'),
          'crosshair': janus.getAsset('image', 'cursor_crosshair'),
          'pointer': janus.getAsset('image', 'cursor_hand'),
          'dot_inactive': janus.getAsset('image', 'cursor_dot_inactive'),
          'dot_active': janus.getAsset('image', 'cursor_dot_active'),
        };
      }
      newroom.appendChild(this.getProxyObject());
      if (this.ghost) {
        this.ghost.setRoom(newroom);
      } else if (!this.ghost) { // && this.room.selfavatar) {
        // FIXME - self avatar is buggy so it's disabled
        this.getAvatarData().then(avatar => {
          if (avatar) {
            this.ghost = this.createObject('ghost', {
              ghost_id: this.getUsername(),
              avatar_src: 'data:text/plain,' + encodeURIComponent(avatar),
              showlabel: false,
              //pos: V(0, -this.fatness, 0),
              rotation: V(0, 180, 0),
              renderorder: 101,
            });
            this.ghost.orientation.set(0,1,0,0);
          }
        });
        this.visible = true;
      }

      for (let k in this.children) {
        if (this.children[k].setRoom) {
          this.children[k].setRoom(room);
          this.children[k].start();
        }
      }

      //room.add(this);
      this.updateGravity();
    }
    this.updateGravity = function(gravity) {
      // FIXME - gravity is currently disabled, pending ongoing work with mesh colliders
      return;

      if (typeof gravity == 'undefined' && this.room) {
        gravity = this.room.gravity;
      }
      if (!this.gravity) {
        this.gravity = this.addForce('gravity', V(0, gravity, 0));
      } else {
        this.gravity.update(V(0, gravity, 0));
      }
    }
    this.reset_position = function(ev) {
      if (!ev || ev.value == 1) {
        var room = this.engine.client.janusweb.currentroom;
        if (room) {
          this.properties.position.copy(room.spawnpoint.position);
          this.properties.orientation.copy(room.spawnpoint.quaternion);
          this.head.properties.orientation.copy(this.properties.startcameraorientation);
          this.properties.velocity.set(0,0,0);
          this.objects.dynamics.angular.set(0,0,0);
          //this.engine.systems.controls.calibrateHMDs();
          this.refresh();
        }
      }
    }
    this.start = function() {
      if (!this.started) {
        if (!this.static) {
          elation.events.add(this.room, 'janusweb_script_frame_end', this.handleFrameUpdates);
        } else {
          this.handleFrameUpdates({data: {dt: 0}});
        }
        this.started = true;
      }
      for (var k in this.children) {
        if (this.children[k].start) {
          this.children[k].start();
        }
      }
      this.dispatchEvent({type: 'start', bubbles: false});
    }
    this.stop = function() {
      for (var k in this.children) {
        if (this.children[k].stop) {
          this.children[k].stop();
        }
      }
      if (this.started) {
        if (!this.static) {
          elation.events.remove(this.room, 'janusweb_script_frame_end', this.handleFrameUpdates);
        }
        this.started = false;
        this.dispatchEvent({type: 'stop', bubbles: false});
      }
    }
    this.getProxyObject = function() {
      if (!this._proxyobject) {
        this._proxyobject = new elation.proxy(this, {
          parent:        ['accessor', 'parent.getProxyObject'],
          room:          ['property', 'room'],
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
          dir:           ['property', 'vectors.zdir'],
          up_dir:        ['property', 'vectors.ydir'],
          userid:        ['property', 'janus.userId'],
          enabled:       ['property', 'enabled'],
          flying:        ['property', 'flying'],
          walking:       ['property', 'walking'],
          running:       ['property', 'running'],
          //url:           ['property', 'currenturl'],
          //hmd_enabled:   ['property', 'hmd_enabled'],
          cursor_active: ['property', 'cursor_active'],
          cursor_visible: ['property', 'cursor_visible'],
          cursor_opacity: ['property', 'cursor_opacity'],
          cursor_style: ['property', 'cursor_style'],
          cursor_object: ['property', 'cursor_object'],
          lookat_object: ['property', 'lookat_object'],
          lookat_pos:    ['property', 'vectors.lookat_pos'],
          //lookat_xdir:   ['property', 'properties.lookat_xdir'],
          //lookat_ydir:   ['property', 'properties.lookat_ydir'],
          //lookat_zdir:   ['property', 'properties.lookat_zdir'],
          hand0_active:  ['property', 'hands.left.isactive'],
          hand0_pos:     ['property', 'hands.left.handpos'],
          hand0_xdir:    ['property', 'hands.left.xdir'],
          hand0_ydir:    ['property', 'hands.left.ydir'],
          hand0_zdir:    ['property', 'hands.left.zdir'],
          hand0_p0:      ['property', 'hands.left.p0'],
          hand0_p1:      ['property', 'hands.left.p1'],
          hand0_p2:      ['property', 'hands.left.p2'],
          hand0_p3:      ['property', 'hands.left.p3'],
          hand0_p4:      ['property', 'hands.left.p4'],

          hand1_active:  ['property', 'hands.right.isactive'],
          hand1_pos:     ['property', 'hands.right.handpos'],
          hand1_xdir:    ['property', 'hands.right.xdir'],
          hand1_ydir:    ['property', 'hands.right.ydir'],
          hand1_zdir:    ['property', 'hands.right.zdir'],
          hand1_p0:      ['property', 'hands.right.p0'],
          hand1_p1:      ['property', 'hands.right.p1'],
          hand1_p2:      ['property', 'hands.right.p2'],
          hand1_p3:      ['property', 'hands.right.p3'],
          hand1_p4:      ['property', 'hands.right.p4'],
          url:           ['property', 'parent.currentroom.url'],

          collision_radius: ['property', 'collision_radius'],

          currentavatar: ['property', 'currentavatar'],
          defaultanimation: ['property', 'defaultanimation'],

          localToWorld:  ['function', 'localToWorld'],
          worldToLocal:  ['function', 'worldToLocal'],
          appendChild:   ['function', 'appendChild'],
          removeChild:   ['function', 'removeChild'],
          addForce:      ['function', 'addForce'],
          removeForce:   ['function', 'removeForce'],
          raycast:       ['function', 'raycast'],
          getViewFrustum:['function', 'getViewFrustum'],
          getUsername:   ['function', 'getUsername'],
          setUsername:   ['function', 'setUsername'],
          getSetting:   ['function', 'getSetting'],
          setSetting:   ['function', 'setSetting'],
          setAvatar:    ['function', 'setAvatar'],
        });
      }
      return this._proxyobject;
    }
    this.getAvatarData = function() {
      return new Promise((resolve, reject) => {
        let avatar = this.getSetting('avatar');
        if (!avatar) {
          if (this.avatarsrc) {
            fetch(this.avatarsrc).then(res => res.text()).then(txt => {
              this.currentavatar = txt;
              this.avatarNeedsUpdate = true;
              resolve(txt);
            });
          } else {
            this.currentavatar = this.defaultavatar;
            this.avatarNeedsUpdate = true;
            resolve(this.defaultavatar);
          }
        } else {
          this.avatarNeedsUpdate = true;
          resolve(avatar);
        }
      });
    }
    this.getCurrentAvatarData = function() {
      return this.currentavatar;
    }
    this.setAvatar = function(avatar) {
      this.avatarNeedsUpdate = true;
      this.currentavatar = avatar;
      let setting = this.setSetting('avatar', avatar);

      if (this.ghost) {
        this.ghost.die();
      }
      this.ghost = this.createObject('ghost', {
        ghost_id: this.getUsername(),
        avatar_src: 'data:text/plain,' + encodeURIComponent(avatar),
        showlabel: false,
        //pos: V(0, -this.fatness, 0),
        rotation: V(0, 180, 0),
        renderorder: 101,
      });

      return setting;
    }
    this.hasVoipData = function() {
      return this.voipqueue && this.voipqueue.length > 0;
    }
    this.getVoipData = function() {
      var voipdata = '';
      if (this.voipqueue && this.voipqueue.length > 0) {
        // FIXME - we should probably just return a combined Uint8Array rather than a binary string
        while (this.voipqueue.length > 0) {
          var buf = this.voipqueue.shift();
          var bytes = new Uint8Array(buf.buffer);
          for (var i = 0; i < bytes.byteLength; i++) {
            voipdata += String.fromCharCode(bytes[i]);
          }
        }
      }
      return voipdata;
    }
    this.getAnimationID = function() {
      var animid = this.defaultanimation;
      let running = this.controlstate.run;

      if (this.jumping) {
        animid = 'jump';
      } else if (this.controlstate.move_left) {
        animid = (running ? 'run' : 'walk_left');
      } else if (this.controlstate.move_right) {
        animid = (running ? 'run' : 'walk_right');
      } else if (this.controlstate.move_forward) {
        animid = (running ? 'run' : 'walk');
      } else if (this.controlstate.move_backward) {
        animid = (running ? 'run' : 'walk_back');
      } else if (document.activeElement && this.properties.janus.chat && document.activeElement === this.properties.janus.chat.input.inputelement) {
        animid = 'type';
      } else if (this.hasVoipData()) {
        animid = 'speak';
      }
      return animid;
    }
    this.setHand = function(handedness, handobj) {
      this.hands[handedness] = handobj;
      console.log('player has hands', this.hands);
    }
    this.hasHands = function() {
      return (this.tracker && this.tracker.hasHands());
    }
    this.getHandData = function() {
      var handData = false;
      var hands = this.tracker.getHands();
      if (hands) {
        handData = {};
        if (hands.left && hands.left.active) {
          handData.left = {
            active: true,
            state: hands.left.getState(player.shoulders)
          };
        }
        if (hands.right && hands.right.active) {
          handData.right = {
            active: true,
            state: hands.right.getState(player.shoulders)
          };
        }
      } 
      return handData;
    }
    this.hasMorphTargetData = function() {
      return Object.keys(this.morphtargetchanges).length > 0;
    }
    this.setMorphTargetInfluence = function(morphtarget, value) {
      if (this.ghost && this.ghost.body) {
        this.ghost.body.setMorphTargetInfluence(morphtarget, value);
        //if (this.morphtargetchanges.indexOf(morphtarget) == -1) {
        this.morphtargetchanges[morphtarget] = value;
        //}
      }
    }
    this.getMorphTargetData = function() {
      if (this.hasMorphTargetData()) {
        let data = {};
        let body = this.ghost.body;
        for (let morphtarget in this.morphtargetchanges) {
          data[morphtarget] = this.morphtargetchanges[morphtarget];
          delete this.morphtargetchanges[morphtarget];
        }
        return data;
      }
      return false;
    }
    this.getRandomUsername = function() {
      var adjectives = [
				"Adorable", "Beautiful", "Clean", "Drab", "Elegant", "Fancy", "Glamorous", "Handsome", "Long", "Magnificent",
				"Plain", "Quaint", "Sparkling", "Ugliest", "Unsightly", "Agreeable", "Brave", "Calm", "Delightful", "Eager",
				"Faithful", "Gentle", "Happy", "Jolly", "Kind", "Lively", "Nice", "Obedient", "Proud", "Relieved", "Silly",
				"Thankful", "Victorious", "Witty", "Zealous", "Angry", "Bewildered", "Clumsy", "Defeated", "Embarrassed",
				"Fierce", "Grumpy", "Helpless", "Itchy", "Jealous", "Lazy", "Mysterious", "Nervous", "Obnoxious", "Panicky",
				"Repulsive", "Scary", "Thoughtless", "Uptight", "Worried"
      ];
      var nouns = [
				"Alligator", "Ant", "Bear", "Bee", "Bird", "Camel", "Cat", "Cheetah", "Chicken", "Chimpanzee", "Cow",
				"Crocodile", "Deer", "Dog", "Dolphin", "Duck", "Eagle", "Elephant", "Fish", "Fly", "Fox", "Frog", "Giraffe",
				"Goat", "Goldfish", "Hamster", "Hippopotamus", "Horse", "Kangaroo", "Kitten", "Lion", "Lobster", "Monkey",
				"Octopus", "Owl", "Panda", "Pig", "Puppy", "Rabbit", "Rat", "Scorpion", "Seal", "Shark", "Sheep", "Snail",
				"Snake", "Spider", "Squirrel", "Tiger", "Turtle", "Wolf", "Zebra"
      ];

      var adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      var noun = nouns[Math.floor(Math.random() * nouns.length)];
      var num = Math.floor(Math.random() * 1000);

      return adj + noun + num
    }
    this.getSetting = function(key, defaultvalue) {
      var setting = this.settings.get(key);
      if (!setting) return defaultvalue;
      return elation.utils.any(setting.value, defaultvalue);
    }
    this.setSetting = function(key, value) {
      this.settings.add({key: key, value: value});
      this.settings.save();
    }
    this.removeSetting = function(key) {
      this.settings.remove(key);
      return true;
    }
    this.getUsername = function() {
      var username = this.getSetting('username');
      if (!username) {
        username = this.getRandomUsername();
      }
      return username;
    }
    this.setUsername = function(username) {
      this.setSetting('username', username);
      this.userid = username;
      this.player_id = username;
      janus.userId = username;
      elation.events.fire({type: 'username_change', element: this, data: username});
    }
    this.getNetworkUsername = function() {
      if (this.room) {
        let server = janus.network.getServerForRoom(this.room);
        if (server) {
          return server._userId + server._useridSuffix
        }
      }
    }
    this.updateCursorStyle = function(ev) {
      var vrdisplay = this.engine.systems.render.views.main.vrdisplay;
      var obj = ev.element;
      var proxyobj = (obj.getProxyObject ? obj.getProxyObject() : obj);

      if (obj && proxyobj && (ev.type == 'mouseover' || ev.type == 'mousemove') && (
            obj.onclick ||
            elation.events.hasEventListener(obj, 'click') ||
            elation.events.hasEventListener(proxyobj, 'click') ||
            obj.onmousedown ||
            elation.events.hasEventListener(obj, 'mousedown') ||
            elation.events.hasEventListener(proxyobj, 'mousedown'))
          ) {
        this.cursor_style = 'pointer';
      } else if (this.engine.systems.controls.pointerLockActive || (vrdisplay && vrdisplay.isPresenting)) {
        this.cursor_style = 'crosshair';
      } else {
        this.cursor_style = 'default';
      }
    }
    this.createObject = function(type, args) {
      if (this.room) {
        return this.room.createObject(type, args, this);
      }
    }
    this.appendChild = function(obj) {
      var proxyobj = obj
      if (elation.utils.isString(obj)) {
        proxyobj = this.room.jsobjects[obj];
      }
      if (proxyobj) {
        //var realobj = this.room.getObjectFromProxy(proxyobj);
        if (proxyobj.parent) {
          if (typeof proxyobj.parent.removeChild == 'function') {
            proxyobj.parent.removeChild(proxyobj);
          } else if (typeof proxyobj.parent.remove == 'function') {
            proxyobj.parent.remove(proxyobj._target);
          }
        }
        var realobj = proxyobj._target;
        if (realobj) {
          this.add(realobj);
          if (typeof realobj.start == 'function') {
            realobj.start();
          }
        }
      }
    }
    this.removeChild = function(obj) {
      var proxyobj = obj
      if (elation.utils.isString(obj)) {
        proxyobj = this.room.jsobjects[obj];
      }
      if (proxyobj) {
        //var realobj = this.room.getObjectFromProxy(proxyobj);
        var realobj = proxyobj._target;
        if (realobj) {
          if (typeof realobj.stop == 'function') {
            realobj.stop();
          }
          this.remove(realobj);
        }
      }
    }
    this.updateCollider = function() {
      if (this.objects['dynamics']) {
        if (this.collision_radius > 0) {
/*
          this.setCollider('sphere', {
            radius: this.collision_radius,
          });
          this.collidable = false;
*/
          this.pickable = false;
          this.setCollider('capsule', {
            radius: this.collision_radius,
            length: 1,
            offset: V(0, this.collision_radius, 0)
          });
        } else {
          this.removeCollider();
        }
      }
    }
    this.removeCollider = function() {
      if (this.colliders) {
        for (var i = 0; i < this.colliders.children.length; i++) {
          var collider = this.colliders.children[i];
          collider.parent.remove(collider);
        }
      }
    }
    this.raycast = (function() {
      var _pos = new THREE.Vector3(),
          _dir = new THREE.Vector3(0,0,-1);
      return function(dir, offset, classname, maxdist) {
        if (!this.room) return [];
        if (dir) {
          _dir.copy(dir);
        } else {
          _dir.set(0,0,-1);
        }
        _pos.set(0,0,0);
        if (offset) {
          _pos.add(offset);
        }
        this.head.localToWorld(_pos);
        this.head.objects.dynamics.localToWorldDir(_dir);
        return this.room.raycast(_dir, _pos, classname, maxdist);
      };
    })();
    this.cancelGaze = function() {
      //this.gaze.object.dispatchEvent({type: 'gazecancel'});
      this.gaze = false;
    }
    this.handleGazeEnter = function(ev) {
      var obj = ev.data.object;
      if (obj && obj.dispatchEvent && ev.data.intersection) {
        obj.dispatchEvent({type: 'gazeenter', data: ev.data.intersection});
        this.cursor_object = obj;

        if (this.gaze) {
          this.cancelGaze();
        }
        this.gaze = {
          start: performance.now(),
          object: obj,
          fired: false
        };
      }
    }
    this.handleGazeLeave = function(ev) {
      var obj = ev.data.object;
      if (obj && obj.dispatchEvent) {
        this.cursor_object = '';
        obj.dispatchEvent({type: 'gazeleave', data: ev.data.intersection});
      }
    }
    this.handleGazeMove = function(ev) {
      var obj = ev.data.object;
      if (obj && obj.dispatchEvent) {
        this.cursor_object = obj.js_id || '';

        if (ev.data.intersection.point) {
          this.vectors.cursor_pos.copy(ev.data.intersection.point);
        }
      }
    }
    this.handleTouchStart = function(ev) {
      //if (!this.enabled) return;
      let halfscreenwidth = window.innerWidth / 2;
      this.enabled = true;
      for (let i = 0; i < ev.changedTouches.length; i++) {
        let touch = ev.changedTouches[i];
        this.touchcache.positions[touch.identifier] = [touch.clientX, touch.clientY];
        if (touch.clientX < halfscreenwidth) {
          this.touchindex[0] = touch.identifier;
        } else {
          this.touchindex[1] = touch.identifier;
        }
      }
      if (!document.fullscreenElement) {
        this.engine.client.toggleFullscreen({data: 1});
      }
      this.cancelTouchMovement(ev);
    }
    this.handleTouchMove = function(ev) {
      if (ev.defaultPrevented) return;
      //if (ev.touches.length == 1) {
        //var touchindex = this.touchindex;
      for (let i = 0; i < ev.touches.length; i++) {
        var touch = ev.touches[i];
        var distanceX = touch.clientX - this.touchcache.positions[touch.identifier][0],
            distanceY = touch.clientY - this.touchcache.positions[touch.identifier][1];

        var flip = this.getSetting('controls.touch.flip'),
            flipx = 0,
            flipy = 0;

        if (flip) {
          flipx = flip.x;
          flipy = flip.y;
        }

        if (touch.identifier === this.touchindex[0]) {
          let size = 32;
          let dx = distanceX / size,
              dy = distanceY / size;

          this.controlstate.move_right = dx;
          this.controlstate.move_forward = -dy;
        } else if (touch.identifier === this.touchindex[1]) {
          this.updateMouseControls({
            data: {
              mouse_look: [(flipx ? -1 : 1) * distanceX / 5, (flipy ? -1 : 1 ) * distanceY / 5]
            }
          }, true);
          this.touchcache.positions[touch.identifier][0] = touch.clientX;
          this.touchcache.positions[touch.identifier][1] = touch.clientY;
        }
      }
      this.cancelTouchMovement(ev);
    }
    this.handleTouchEnd = function(ev) {
      this.cancelTouchMovement(ev);
    }
    this.cancelTouchMovement = function(ev) {
      for (let i = 0; i < ev.touches.length; i++) {
        let touch = ev.touches[i];
        if (touch.identifier === this.touchindex[0]) {
          return;
        }
      }
      this.controlstate.move_right = 0;
      this.controlstate.move_forward = 0;
      this.touchindex[0] = null;
    }
    this.updatePartyMode = function(key, value) {
      if (typeof value != 'undefined') {
        this.setSetting('partymode.enabled', value);
      }
    }
    this.scaleTo = (function() {
      let tmpvec = new THREE.Vector3(),
          startscale = new THREE.Vector3(),
          camscale = new THREE.Vector3();
      return function(newscale, scaletime, scalecurve) {
        if (newscale != this.scale) {
          startscale.copy(this.properties.scale);
          if (scaletime) {
            let start = performance.now();
            let timer = setInterval(() => {
              let n = (performance.now() - start) / scaletime;

              this.scale = tmpvec.set(newscale, newscale, newscale).sub(startscale).multiplyScalar(n).add(startscale);
              this.camera.scale = camscale.set(1 / this.scale.x, 1 / this.scale.y, 1 / this.scale.z);
              if (n >= 1) {
                clearInterval(timer);
                this.scale.set(newscale, newscale, newscale);
                this.camera.scale = camscale.set(1 / this.scale.x, 1 / this.scale.y, 1 / this.scale.z);
              }
            }, 16);
          } else {
            this.scale.set(newscale, newscale, newscale);
            this.camera.scale = camscale.set(1 / this.scale.x, 1 / this.scale.y, 1 / this.scale.z);
          }
        }
      };
    })();
    this.dispatchEvent = function(event, target) {
      let firedev = elation.events.fire(event);
    }
    this.lookAt = function(other, up) {
      if (!up) up = new THREE.Vector3(0,1,0);
      var otherpos = false;
      if (other.properties && other.properties.position) {
        otherpos = other.localToWorld(new THREE.Vector3());
      } else if (other instanceof THREE.Vector3) {
        otherpos = other.clone();
      }
      var thispos = this.localToWorld(new THREE.Vector3());

      if (otherpos) {
        var dir = thispos.clone().sub(otherpos).normalize();
        this.properties.orientation.setFromEuler(new THREE.Euler(0, Math.atan2(dir.x, dir.z), 0));
        this.head.properties.orientation.setFromEuler(new THREE.Euler(-Math.asin(dir.y), 0, 0));
        this.refresh();
        room.refresh();
        this.engine.systems.render.setdirty();
      }
    }
    this.lookAtLERP = function(other, time, up) {
      if (this.lerptimer) {
        cancelTimeout(this.lerptimer);
      }
      if (time) {
        let now = performance.now(),
            elapsed = now - this.starttime,
            n = Math.min(1, Math.max(0, elapsed / time));

        this.lookAtLERPstart = now;
        this.lookAtLERPtime = time;
        this.lookAtLERPq1head = player.head.orientation.clone();
        this.lookAtLERPq1body = player.orientation.clone();

        let otherpos = false;
        if (other.properties && other.properties.position) {
          otherpos = other.localToWorld(new THREE.Vector3());
        } else if (other instanceof THREE.Vector3) {
          otherpos = other.clone();
        }
        let thispos = this.localToWorld(new THREE.Vector3());

        if (otherpos) {
          let dir = thispos.clone().sub(otherpos).normalize();
          this.lookAtLERPq2body = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(dir.x, dir.z), 0));
          this.lookAtLERPq2head = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.asin(dir.y), 0, 0));
          this.refresh();
          room.refresh();
          this.engine.systems.render.setdirty();
        }

        if (this.starttime && elapsed <= time) {
          //this.lerptimer = setTimeout(() => this.lookAtLERP(other, time, up), 16);
        }
      }
    }
    this.updateLookAtLERP = function() {
      let now = performance.now(),
          elapsed = now - this.lookAtLERPstart,
          n = Math.min(1, Math.max(0, elapsed / this.lookAtLERPtime));

      //THREE.Quaternion.slerp(this.lookAtLERPq1body, this.lookAtLERPq2body, this.orientation, n);
      //THREE.Quaternion.slerp(this.lookAtLERPq1head, this.lookAtLERPq2head, this.head.orientation, n);
      this.orientation.slerpQuaternions(this.lookAtLERPq1body, this.lookAtLERPq2body, n);
      this.head.orientation.slerpQuaternions(this.lookAtLERPq1head, this.lookAtLERPq2head, n);
      if (n == 1) {
        this.lookAtLERPtime = 0;
      }
    }
    this.spawnPortal = function(url) {
      room.createObject('link', {
        pos: this.localToWorld(V(0, 0, -2)),
        zdir: this.dir.clone(),
        url: url,
        sync: true,
        round: true,
        shader_id: 'defaultportal',
      });

      // FIXME - should only set this if we have an active portal animation, and we should use the animation's duration for our timeout
      this.defaultanimation = 'portal';
      setTimeout(() => this.defaultanimation = 'idle', 3000);
    }
    this.toggleCamera = function(ev) {
      if (ev.value == 1) {
        if (this.cameraview == 'firstperson') {
          this.cameraview = 'thirdperson';
          this.cameraangle = 0;
          this.camerazoom = 2;
        } else {
          this.cameraview = 'firstperson';
          this.cameraangle = 0;
          this.camerazoom = 0;
        }
        this.updateCamera();
      }
    }
    this.zoomView = function(amount, ev) {
      if (this.cameraview == 'thirdperson') {
        //this.camera.position.z -= amount / 10;
        //this.camera.position.z = Math.max(0.001, this.camera.position.z * (amount > 0 ? .95 : 1.05));
        let state = this.engine.systems.controls.state;
        if (state.keyboard_alt) {
          this.cameraangle += amount * Math.PI / 64;
        } else {
          this.camerazoom = Math.max(0.001, this.camerazoom * (amount > 0 ? .95 : 1.05));
        }
        this.updateCamera();
      }
    }
    this.updateCamera = function() {
      if (this.camera) {
        this.camera.fov = this.fov;
        this.camera.position.z = Math.cos(this.cameraangle) * this.camerazoom;
        this.camera.position.x = Math.sin(this.cameraangle) * this.camerazoom;
        this.camera.orientation.setFromEuler(new THREE.Euler(0, this.cameraangle, 0));
      }
    }
    this.setAnimationSequence = function(sequence) {
      let t = 0;
      let currentanimation = this.defaultanimation;
      let body = this.ghost.body;
      sequence.forEach(clipname => {
        let anim = body.animations[clipname];
        if (anim) {
          let clip = anim.getClip();
          setTimeout(() => { this.defaultanimation = clipname; }, t * 1000);
          t += clip.duration;
        }
      });
      setTimeout(() => { this.defaultanimation = currentanimation; }, t * 1000);
    }
  }, elation.engine.things.player);
});
