elation.require(['engine.things.generic', 'janusweb.external.webxr-input-profiles'], function() {
  elation.component.add('engine.things.janusxrplayer', function() {
    this.postinit = function() {
      elation.engine.things.janusxrplayer.extendclass.postinit.call(this);
      this.defineProperties({
        session: { type: 'object' },
        xrview: { type: 'object' }
      });
      this.inputs = {};
      initJanusObjects();
      this.trackedobjects = {
        head: this.createObject('trackedplayer_head', { })
      };
      this.camera = this.spawn('camera', this.name + '_camera', { position: [0,0,0] } );

      this.teleporter = player.createObject('locomotion_teleporter', { xrplayer: this.getProxyObject() });

      if (this.session) {
        console.log('xr player got a new session', this.session);
        this.setSession(this.session, this.xrview);
      }
    }
    this.setSession = function(session, view) {
      this.session = session;
      console.log('xr player session changed', this.session, view);
      this.inputs = {};
      if (session) {
        session.addEventListener('inputsourceschange', (ev) => { this.processInputSources(this.session.inputSources);});
        session.addEventListener('selectstart', (ev) => { this.handleSelectStart(ev);});
        session.addEventListener('selectend', (ev) => { this.handleSelectEnd(ev);});
        session.addEventListener('select', (ev) => { this.handleSelect(ev);});

        if (this.session.inputSources && this.session.inputSources.length > 0) {
          this.processInputSources(this.session.inputSources);
        }
      } else {
        this.resetOrientation();
      }
      this.engine.systems.sound.setActiveListener(this.trackedobjects.head._target.objects['3d']);
      if (session) {
        player.cursor_visible = false;
      } else {
        player.cursor_visible = room.cursor_visible;
      }
      this.xrview = view;
      if (view && this.camera) {
        setTimeout(() => {
          view.setactivething(this);
        }, 100);
      }
    }
    this.resetOrientation = function() {
        player.pos.copy(this.position);
        //player.orientation.copy(this.orientation);
        player.head.orientation.set(0,0,0,1);
        player.head.position.set(0,0,0);
    }
    this.processInputSources = function(inputs) {
      for (let i = 0; i < inputs.length; i++) {
        let input = inputs[i];
        let id = 'hand_' + input.handedness;
        if (this.trackedobjects[id]) {
          this.trackedobjects[id].updateDevice(input);
        }
        this.inputs[input.handedness] = input;
      }
    }
    this.updateXR = function(xrFrame) {
      if (!xrFrame) return;
      let xrReferenceFrame = this.getReferenceFrame();
      let viewerPose = xrFrame.getViewerPose(xrReferenceFrame);
      if (viewerPose) {
        this.trackedobjects['head'].updatePose(viewerPose, xrFrame, xrReferenceFrame);
      } else {
        // You've lost your head!  Should we do something about it?
      }
      let hasControllers = false;
      for (let k in this.inputs) {
        let input = this.inputs[k];
        let id = 'hand_' + k;
        if (!this.trackedobjects[id]) {
          this.trackedobjects[id] = this.createObject('trackedplayer_hand', { device: input });
        }
        let pose = null,
            raypose = null;
        if (input.gripSpace) {
          pose = xrFrame.getPose(input.gripSpace, xrReferenceFrame);
        }
        if (input.targetRaySpace) {
          raypose = xrFrame.getPose(input.targetRaySpace, xrReferenceFrame);
        }
        this.trackedobjects[id].updatePose(pose, xrFrame, xrReferenceFrame, raypose);
        if (pose) {
          this.trackedobjects[id].visible = true;
          hasControllers = true;
        } else {
          this.trackedobjects[id].visible = false;
        }
      }
      if (player.gazecaster) {
        player.gazecaster.enabled = !hasControllers;
      }
      //this.position.copy(player.pos);
      //player.orientation.copy(this.orientation);
      player.head.orientation.copy(this.trackedobjects['head'].orientation);
      player.head.position.copy(this.trackedobjects['head'].position).sub(player.neck.position).sub(player.torso.position);
      this.dispatchEvent({type: 'xrframe', data: xrReferenceFrame});
//this.orientation.copy(player.orientation);
    }
    this.getReferenceFrame = function() {
      return this.engine.systems.render.renderer.xr.getReferenceSpace();
    }
    this.handleSelectStart = function(ev) {
      console.log('select started', ev);
      let handid = 'hand_' + ev.inputSource.handedness;
      if (this.trackedobjects[handid]) {
        this.trackedobjects[handid].handleSelectStart(ev);
      }
      // FIXME - probably need to fake a mouse event instead of passing through a select event
      elation.events.fire({type: 'janus_room_mousedown', element: room._target, event: ev});
    }
    this.handleSelectEnd = function(ev) {
      console.log('select ended', ev);
      let handid = 'hand_' + ev.inputSource.handedness;
      if (this.trackedobjects[handid]) {
        this.trackedobjects[handid].handleSelectEnd(ev);
      }
      // FIXME - probably need to fake a mouse event instead of passing through a select event
      elation.events.fire({type: 'janus_room_mouseup', element: room._target, event: ev});
    }
    this.handleSelect = function(ev) {
      console.log('selected', ev);
      let handid = 'hand_' + ev.inputSource.handedness;
      if (this.trackedobjects[handid]) {
        this.trackedobjects[handid].handleSelect(ev);
      }
      // FIXME - probably need to fake a mouse event instead of passing through a select event
      if (room.onClick) {
        room.onClick(ev);
      }
      elation.events.fire({type: 'click', element: room._target, event: ev});
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusobject.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          session:  [ 'property', 'session'],
          xrview:  [ 'property', 'xrview'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusbase);
  elation.component.add('engine.things.janusxrplayer_trackedobject', function() {
    this.create = function() {
/*
      this.createObject('object', {
        id: 'cube',
        scale: V(.05,.1,.05),
        pos: V(0,.05,0),
        col: 'red'
      });
*/
    },
    this.updatePose = function(pose, xrFrame, xrReferenceFrame) {
      if (pose) {
        this.position.copy(pose.transform.position);
        this.orientation.copy(pose.transform.orientation);
      }
    }
  }, elation.engine.things.janusbase);

  function initJanusObjects() {
    let deviceMapping = {
      'Oculus Touch (Left)': {
        axes: [
          {name: 'thumbstick', indexes: [0, 1]}
        ],
        buttons: [
          {type: 'thumbstick', name: 'thumbstick', pos: [-.01, 0, 0]},
          {type: 'button', name: 'trigger', pos: [0, -.02, -.01], size: .012},
          {type: 'button', name: 'grab', pos: [.01, -.02, .04], size: .012},
          {type: 'button',  name: 'X', pos: [.01, 0, .01], size: .009},
          {type: 'button', name: 'Y', pos: [.015, 0, 0], size: .009},
          {type: 'button', name: 'menu', pos: [0, 0, .02], size: .005}
        ]
      },
      'Oculus Touch (Right)': {
        axes: [
          {name: 'thumbstick', indexes: [0, 1]}
        ],
        buttons: [
          {type: 'thumbstick', name: 'thumbstick', pos: [.01, 0, 0]},
          {type: 'button', name: 'trigger', pos: [0, -.02, -.01], size: .012},
          {type: 'button', name: 'grab', pos: [-.01, -.02, .04], size: .012},
          {type: 'button',  name: 'B', pos: [-.01, 0, .01], size: .009},
          {type: 'button', name: 'A', pos: [-.015, 0, 0], size: .009},
          {type: 'button', name: 'home', pos: [0, 0, .02], size: .005}
        ]
      },
    };

    janus.registerElement('trackedplayer_head', {
      device: null,
      create() {
/*
        this.headmodel = this.createObject('object', {
          id: 'sphere',
          //collision_id: 'sphere',
          //collision_trigger: true,
          col: 'yellow',
          scale: V(.2, .3, .2)
        });
        this.hmdmodel = this.createObject('object', {
          id: 'cube',
          //collision_id: 'cube',
          col: '#111',
          scale: V(.175,.075,.1),
          pos: V(0, .05, -.05)
        });
        this.mouth = this.createObject('object', {
          id: 'sphere',
          col: '#111',
          scale: V(.15, .05, .05),
          pos: V(0, -.05, -.075)
        });
*/
      },
      updatePose(pose, xrFrame, xrReferenceFrame) {
        if (pose) {
          let pos = pose.transform.position;
          if (pos) {
            this.pos.copy(pos);
          }

          let orientation = pose.transform.orientation;
          if (orientation) {
            this.orientation.copy(orientation);
          }
        } else {
          this.pos.set(0,0,0);
        }
      }
    });
    janus.registerElement('trackedplayer_hand', {
      device: null,
      create() {
        this.gamepad = this.device.gamepad;
        if (this.gamepad) {
          this.createMotionController(this.device);
          janus.engine.systems.controls.addVirtualGamepad(this.device.gamepad);
        }
        this.pointer = this.parent.createObject('trackedplayer_controller_laser', {
          hand: this,
        });

        this.virtualskeleton = this.createObject('trackedplayer_hand_virtualskeleton', {
          hand: this.device.hand,
        });
        player.setHand(this.device.handedness, this.virtualskeleton);
      },
      updateDevice(device) {
        if (device !== this.device) {
          this.device = device;
          this.pointer.device = device;
          if (this.device.gamepad !== this.gamepad) {
            janus.engine.systems.controls.removeVirtualGamepad(this.gamepad);
            janus.engine.systems.controls.addVirtualGamepad(this.device.gamepad);
            this.gamepad = this.device.gamepad;
          }
        }
      },
      stopInput() {
        janus.engine.systems.controls.removeVirtualGamepad(this.device.gamepad);
      },
      async createMotionController(xrInputSource) {
        let uri = 'https://baicoianu.com/~bai/webxr-input-profiles/packages/assets/dist/profiles';
        const { profile, assetPath } = await elation.janusweb.external.webxrinput.fetchProfile(xrInputSource, uri);
        const motionController = new elation.janusweb.external.webxrinput.MotionController(xrInputSource, profile, assetPath);
        this.motionController = motionController;

        this.loadNewAsset('object', { id: 'blah-' + this.device.handedness, src: motionController.assetUrl });

        this.controller = this.createObject('object', {
          id: 'blah-' + this.device.handedness,
          visible: true,
        });
        this.controller.addEventListener('load', (ev) => { this.controller.visible = true; });
      },
      updateMotionControllerModel(motionController) {
        // Update the 3D model to reflect the button, thumbstick, and touchpad state
        const motionControllerRoot = this.objects['3d'].getObjectByName('root');

        if (!motionControllerRoot) {
          return;
        }

        Object.values(motionController.components).forEach((component) => {
          for (let k in component.visualResponses) {
            let visualResponse = component.visualResponses[k];
            // Find the topmost node in the visualization
            const valueNode = motionControllerRoot.getObjectByName(visualResponse.valueNodeName);

            // Calculate the new properties based on the weight supplied
            if (visualResponse.valueNodeProperty === 'visibility') {
              valueNode.visible = visualResponse.value;
            } else if (visualResponse.valueNodeProperty === 'transform') {
              const minNode = motionControllerRoot.getObjectByName(visualResponse.minNodeName);
              const maxNode = motionControllerRoot.getObjectByName(visualResponse.maxNodeName);

              THREE.Quaternion.slerp(
                minNode.quaternion,
                maxNode.quaternion,
                valueNode.quaternion,
                visualResponse.value
              );

              valueNode.position.lerpVectors(
                minNode.position,
                maxNode.position,
                visualResponse.value
              );
            }
          };
        });
      },
      updatePose(pose, xrFrame, xrReferenceFrame, raypose) {
        if (pose) {
          let pos = pose.transform.position;
          this.pos.copy(pos);
          let orientation = pose.transform.orientation;
          this.orientation.copy(orientation);

/*
          if (this.device.axes.length > 0) {
            let axes = this.device.axes;
            
            if (this.thumb) {
              this.thumb.setXY(axes[0], axes[1]);
            }
          }
          if (this.device.buttons.length > 0) {
            let numbuttons = this.device.buttons.length;
            for (let i = 0; i < numbuttons; i++) {
              let button = this.buttons[i],
                  buttonstate = this.device.buttons[i];
              if (button) {
                if (buttonstate.pressed) {
                  button.setState('pressed');
                } else if (buttonstate.touched) {
                  button.setState('touched');
                } else {
                  button.setState('default');
                }
              }
            }
          }
*/
          if (this.device.hand) {
            if (!this.skeleton) {
              console.log('new hand!', this.device.hand, this.device, this);
              this.skeleton = this.parent.createObject('trackedplayer_hand_skeleton', {
                hand: this.device.hand,
              });
              player.setHand(this.device.handedness, this.skeleton);
            }
            this.skeleton.updatePose(xrFrame, xrReferenceFrame);
            if (this.controller) this.controller.visible = false;
            if (this.skeleton) this.skeleton.visible = true;
          } else {
            if (this.controller) this.controller.visible = true;
            if (this.skeleton) {
              this.skeleton.die();
              this.skeleton = false;
              player.setHand(this.device.handedness, this.virtualskeleton);
            }
          }
          if (this.motionController) {
            this.updateMotionControllerModel(this.motionController);
          }
        }
        if (this.pointer && raypose) {
          this.pointer.pos.copy(raypose.transform.position);
          this.pointer.orientation.copy(raypose.transform.orientation);
        }
      },
      createButtons() {
        if (this.device) {
          let key = 'Oculus Touch (' + this.device.handedness + ')'; //Object.keys(deviceMapping).find(id => this.device.id.startsWith(id));

          let cfg = deviceMapping[key];
          let gamepad = this.device.gamepad;
          if (gamepad) {
            let controllerbuttons = gamepad.buttons;
            if (cfg) {
              for (let i = 0; i < controllerbuttons.length; i++) {
                let button = controllerbuttons[i],
                    buttoncfg = cfg.buttons[i] || {},
                    buttontype = buttoncfg.type || 'button',
                    buttonpos = (buttoncfg.pos ? V(buttoncfg.pos[0], buttoncfg.pos[1], buttoncfg.pos[2]) : V()),
                    buttonsize = buttoncfg.size || .0125;
               
                this.buttons[i] = this.face.createObject('trackedplayer_controller_' + buttontype, {
                  pos: buttonpos,
                  size: buttonsize,
                });
                if (buttontype == 'thumbstick') {
                  // FIXME - this should respect the axis index configuration
                  this.thumb = this.buttons[i];
                }
              }
            } else {
              this.thumb = this.createObject('trackedplayer_controller_thumbstick', {
                size: .02,
                pos: V(-.01,.015,.01),
                col: '#666',
                rotation: V(5,0,0)
              });
              let numbuttons = controllerbuttons.length;
              for (let i = 0; i < controllerbuttons.length; i++) {
                if (!this.buttons[i]) {
                  this.buttons[i] = this.face.createObject('trackedplayer_controller_button', {
                    pos: V(.015 * i - (numbuttons * .015 / 2), .025, -.01),
                    size: .0125,
                  });
                }
              }
            }
          }
        }
      },
      pulse(value, duration) {
        if (this.device.hapticActuators) {
          this.device.hapticActuators.forEach(ha => {
            ha.pulse(value, duration);
          });
        }
      },
      raycast(dir, pos) {
        if (this.pointer) {
          return this.pointer.raycast(dir, pos);
        }
      },
      handleSelectStart(ev) {
        this.pointer.handleSelectStart(ev);
      },
      handleSelectEnd(ev) {
        this.pointer.handleSelectEnd(ev);
      },
      handleSelect(ev) {
        this.pointer.handleSelect(ev);
      },
    });
    janus.registerElement('trackedplayer_controller_button', {
      size: .1,
      state: 'default',
      states: {
        default: '#666',
        touched: '#888',
        pressed: '#6f6',
        highlighted: '#f0f',
      },

      create() {
        this.button = this.createObject('object', {
          id: 'cylinder',
          scale: V(this.size, this.size / 5, this.size),
          col: this.states[this.state]
        });
      },
      setState(state) {
        if (this.button && this.states[state] && this.state != state) {
          this.state = state;
          this.button.col = this.states[state];
          if (state == 'pressed') {
            this.parent.parent.pulse(1, 20);
            this.button.pos.y = -this.size / (5 * 1.9);
          } else if (state == 'default') {
            //this.parent.pulse(1, 20);
            this.button.pos.y = 0;
          } else if (state == 'touched') {
            this.button.pos.y = 0;
          }
        }
      }
    });
    janus.registerElement('trackedplayer_controller_thumbstick', {
      range: 30,
      size: .1,
      state: 'default',
      states: {
        default: '#666',
        touched: '#888',
        pressed: '#6f6',
        highlighted: '#f0f',
      },

      create() {
        this.shaft = this.createObject('object', {
          id: 'cylinder',
          scale: V(this.size / 5, this.size / 2, this.size / 5),
          col: this.states.default,
        });
        this.button = this.createObject('object', {
          id: 'cylinder',
          scale: V(this.size, this.size / 5, this.size),
          col: this.states.default,
          pos: V(0,this.size / 2,0)
        });
      },
      setState(state) {
        if (this.button && this.states[state] && this.state != state) {
          this.state = state;
          this.button.col = this.states[state];
          if (state == 'pressed') {
            this.parent.parent.pulse(1, 20);
          } else if (state == 'default') {
            //this.parent.pulse(1, 20);
          }
        }
      },
      setXY(x, y) {
        this.rotation.set(y * this.range, 0, x * -this.range);
      }
    });

    janus.registerElement('trackedplayer_controller_laser', {
      hand: null,
      device: null,
      create() {
        this.lasercolor = V(1,0,0);
        this.laser = this.createObject('linesegments', {
          positions: [V(0,0,0), V(0,0,-.5)],
          opacity: .8,
          col: this.lasercolor,
          visible: false,
        });
        this.bonk = this.createObject('object', {
          id: 'cylinder',
          col: 'white',
          lighting: false,
          scale: V(.005, .5, .005),
          rotation: V(-90,0,0),
          opacity: .2,
        });
        this.cursor = room.createObject('object', {
          id: 'plane',
          scale: V(.75),
          image_id: 'cursor_dot_inactive',
          billboard: 'y',
          visible: true,
          renderorder: 20,
          depth_test: false,
          depth_write: false,
          lighting: false,
          opacity: .5,
          cull_face: 'none',
        });
        this.raycaster = this.createObject('raycaster', {});
        this.raycaster.addEventListener('raycastenter', (ev) => this.handleRaycastEnter(ev));
        this.raycaster.addEventListener('raycastmove', (ev) => this.handleRaycastMove(ev));
        this.raycaster.addEventListener('raycastleave', (ev) => this.handleRaycastLeave(ev));
      },
      updateLaserEndpoint(endpoint, normal) {
        this.worldToLocal(this.laser.positions[1].copy(endpoint));
        this.laser.updateLine();
        this.cursor.pos.copy(endpoint);
        if (this.cursor.room !== room) room.appendChild(this.cursor);
        //this.cursor.zdir.copy(player.view_dir).multiplyScalar(-1);
        //this.cursor.zdir = normal;
        this.cursor.visible = true;
      },
      handleRaycastEnter(ev) {
        let proxyobj = ev.data.object,
            obj = proxyobj._target;
        let oldactiveobject = this.activeobject;
        if (this.activeobject) {
          this.engine.client.view.proxyEvent({
            type: "mouseout",
            element: this.activeobject.objects['3d'],
            relatedTarget: this.activeobject,
            data: ev.data.intersection,
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            bubbles: true,
          }, this.activeobject.objects['3d']);
        }
        this.activeobject = proxyobj;

        if (obj && proxyobj && (
              obj.onclick ||
              elation.events.hasEventListener(obj, 'click') ||
              elation.events.hasEventListener(proxyobj, 'click') ||
              obj.onmousedown ||
              elation.events.hasEventListener(obj, 'mousedown') ||
              elation.events.hasEventListener(proxyobj, 'mousedown')
            )) {
          this.laser.col.setRGB(0,1,0);
          this.laser.opacity = .8;
          this.laser.updateColor();
          this.cursor.image_id = 'cursor_dot_active';
          this.cursor.opacity = 1;
          //this.laser.visible = false; // FIXME - hack to disable laser without breaking things

/*
          let gamepad = this.device.gamepad;
          if ("hapticActuators" in gamepad && gamepad.hapticActuators.length > 0) {
            gamepad.hapticActuators[0].pulse(1, 100);
          }
*/

        } else {
          this.laser.col.setRGB(1,0,0);
          this.laser.opacity = .4;
          this.laser.updateColor();
          this.cursor.image_id = 'cursor_dot_inactive';
          this.cursor.opacity = .5;
          //this.laser.visible = false; // FIXME - hack to disable laser without breaking things
        }

        this.updateLaserEndpoint(ev.data.intersection.point, ev.data.intersection.face.normal);

        this.lasthit = ev.data.intersection;
        let evdata = {
          type: "mouseover",
          element: ev.data.intersection.mesh,
          relatedTarget: oldactiveobject,
          data: this.lasthit,
          clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
          clientY: 0,
          bubbles: true,
          inputSourceObject: this.hand,
        };
        if (this.hand) {
          evdata.data.gamepad = this.hand.device.gamepad;
        }
        //elation.events.fire(evdata);
        this.engine.client.view.proxyEvent(evdata, evdata.element);
      },
      handleRaycastMove(ev) {
        this.updateLaserEndpoint(ev.data.intersection.point, ev.data.intersection.face.normal);
        if (this.activeobject) {
          let obj = this.activeobject.objects['3d'];
          this.lasthit = ev.data.intersection;

          this.engine.client.view.proxyEvent({
            type: "mousemove",
            element: obj,
            data: this.lasthit,
            //data: ev.data.intersection, // FIXME - need to store intersection data from raycastmove
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            button: 0,
            bubbles: true,
            inputSourceObject: this.hand,
          }, obj);
        }
      },
      handleRaycastLeave(ev) {
        this.laser.col.setRGB(0,1,1);
        this.laser.opacity = .2;
        this.laser.updateColor();
      },
      handleSelectStart(ev) {
        if (this.activeobject) {
          let obj = this.activeobject.objects['3d'];
          this.engine.client.view.proxyEvent({
            type: "mousedown",
            element: obj,
            //data: ev.data.intersection, // FIXME - need to store intersection data from raycastmove
            data: this.lasthit,
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            button: 0,
            bubbles: true,
            inputSourceObject: this.hand,
          }, obj);
        }
      },
      handleSelectEnd(ev) {
        if (this.activeobject) {
          let obj = this.activeobject.objects['3d'];
          this.engine.client.view.proxyEvent({
            type: "mouseup",
            element: obj,
            //data: ev.data.intersection, // FIXME - need to store intersection data from raycastmove
            data: this.lasthit,
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            button: 0,
            bubbles: true,
            inputSourceObject: this.hand,
          }, obj);
        }
      },
      handleSelect(ev) {
        if (this.activeobject) {
          let obj = this.activeobject.objects['3d'];
          console.log('CLICK IT', this.activeobject);
          this.engine.client.view.proxyEvent({
            type: "click",
            element: obj,
            //data: ev.data.intersection, // FIXME - need to store intersection data from raycastmove
            data: this.lasthit,
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            button: 0,
            bubbles: true,
            inputSourceObject: this.hand,
          }, obj);
        }
      },
    });
    janus.registerElement('trackedplayer_hand_skeleton', {
      hand: null,
      fingernames: ['THUMB', 'INDEX', 'MIDDLE', 'RING', 'LITTLE'],
      phalanxnames: ['METACARPAL', 'PHALANX_PROXIMAL', 'PHALANX_DISTAL', 'PHALANX_TIP'],

      isactive: true,
      handpos: null,
      p0: null,
      p1: null,
      p2: null,
      p3: null,
      p4: null,

      create() {
        this.handmodel = this.parent.createObject('object', {
          id: 'cube',
          scale: V(.075, .025, .075),
          col: 'green'
        });
        this.tmpobj = new THREE.Object3D();
        this.joints = new THREE.InstancedMesh(new THREE.SphereBufferGeometry(1), new THREE.MeshPhysicalMaterial({color: 0xccffcc, metalness: .2, roughness: .5}), 26);
        this.joints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.jointposes = {};
        this.objects['3d'].add(this.joints);
        this.handpos = new THREE.Vector3(0, 0, 0);
        this.p0 = new THREE.Vector3(0, 0, 0);
        this.p1 = new THREE.Vector3(0, 0, 0);
        this.p2 = new THREE.Vector3(0, 0, 0);
        this.p3 = new THREE.Vector3(0, 0, 0);
        this.p4 = new THREE.Vector3(0, 0, 0);
      },
      updatePose(xrFrame, xrReferenceFrame) {
        if (!this.hand || !this.joints || !this.hand[0]) return;

        let tmpobj = this.tmpobj,
            i = 0;
        let poses = this.jointposes;
        let wristpose = xrFrame.getJointPose(this.hand[XRHand['WRIST']], xrReferenceFrame);
        this.jointposes['WRIST'] = wristpose;
        for (let fingernum = 0; fingernum < this.fingernames.length; fingernum++) {
          let fingername = this.fingernames[fingernum];
          for (let jointnum = 0; jointnum < this.phalanxnames.length; jointnum++) {
            i++;
            let jointname = fingername + '_' + this.phalanxnames[jointnum];
            let jointpose = xrFrame.getJointPose(this.hand[XRHand[jointname]], xrReferenceFrame);
            if (jointpose) {
              let radius = Math.max(.005, jointpose.radius); 
              tmpobj.position.copy(jointpose.transform.position);
              tmpobj.quaternion.copy(jointpose.transform.orientation);
              tmpobj.scale.set(radius, radius, radius);
              tmpobj.updateMatrix();
              this.joints.setMatrixAt(i, tmpobj.matrix);
            }
            this.jointposes[jointname] = jointpose;
          }
        }
        this.joints.instanceMatrix.needsUpdate = true;

        if (this.jointposes['WRIST']) this.localToWorld(this.handpos.copy(this.jointposes['WRIST'].transform.position));
        if (this.jointposes['THUMB_PHALANX_TIP']) this.localToWorld(this.p0.copy(this.jointposes['THUMB_PHALANX_TIP'].transform.position));
        if (this.jointposes['INDEX_PHALANX_TIP']) this.localToWorld(this.p1.copy(this.jointposes['INDEX_PHALANX_TIP'].transform.position));
        if (this.jointposes['MIDDLE_PHALANX_TIP']) this.localToWorld(this.p2.copy(this.jointposes['MIDDLE_PHALANX_TIP'].transform.position));
        if (this.jointposes['RING_PHALANX_TIP']) this.localToWorld(this.p3.copy(this.jointposes['RING_PHALANX_TIP'].transform.position));
        if (this.jointposes['LITTLE_PHALANX_TIP']) this.localToWorld(this.p4.copy(this.jointposes['LITTLE_PHALANX_TIP'].transform.position));
        this.isactive = true;
      }
    });
    janus.registerElement('trackedplayer_hand_virtualskeleton', {
      hand: null,

      isactive: true,
      handpos: null,
      p0: null,
      p1: null,
      p2: null,
      p3: null,
      p4: null,

      create() {
        this.handpos = V();
        this.p0 = V();
        this.p1 = V();
        this.p2 = V();
        this.p3 = V();
        this.p4 = V();
      },
      update() {
        this.localToWorld(this.handpos.set(0,0,0));
        this.localToWorld(this.p0.set(0,0,0));
        this.localToWorld(this.p1.set(0,0,0));
        this.localToWorld(this.p2.set(0,0,0));
        this.localToWorld(this.p3.set(0,0,0));
        this.localToWorld(this.p4.set(0,0,0));
      }
    });
  }
});
