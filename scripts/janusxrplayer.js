elation.require(['engine.things.generic', 'janusweb.external.webxr-input-profiles'], function() {
  elation.component.add('engine.things.janusxrplayer', function() {
    this.postinit = function() {
      elation.engine.things.janusxrplayer.extendclass.postinit.call(this);
      this.defineProperties({
        session: { type: 'object' }
      });
      if (this.session) {
        console.log('xr player gets a session', this.session);
        let sess = this.session;
        sess.addEventListener('inputsourceschange', (ev) => { this.processInputSources(this.session.inputSources);});
        sess.addEventListener('selectstart', (ev) => { this.handleSelectStart(ev);});
        sess.addEventListener('selectend', (ev) => { this.handleSelectEnd(ev);});
        sess.addEventListener('select', (ev) => { this.handleSelect(ev);});
      }
      this.inputs = {};
      initJanusObjects();
      this.trackedobjects = {
        head: this.createObject('trackedplayer_head', { })
      };
      this.camera = this.spawn('camera', this.name + '_camera', { position: [0,0,0] } );

      this.teleporter = player.createObject('locomotion_teleporter', { xrplayer: this.getProxyObject() });
    }
    this.setSession = function(session) {
      this.session = session;
      console.log('xr player session changed', this.session);
      this.inputs = {};
      if (session) {
        session.addEventListener('inputsourceschange', (ev) => { this.processInputSources(this.session.inputSources);});
      } else {
        this.resetOrientation();
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
      for (let k in this.inputs) {
        let input = this.inputs[k];
        let id = 'hand_' + k;
        if (!this.trackedobjects[id]) {
          this.trackedobjects[id] = this.createObject('trackedplayer_hand', { device: input });
        }
        let pose = xrFrame.getPose(input.gripSpace, xrReferenceFrame);
        if (pose) {
          let raypose = xrFrame.getPose(input.targetRaySpace, xrReferenceFrame);
          this.trackedobjects[id].updatePose(pose, xrFrame, xrReferenceFrame, raypose);
          this.trackedobjects[id].visible = true;
        } else {
          this.trackedobjects[id].visible = false;
        }
      }
      //this.position.copy(player.pos);
      //player.orientation.copy(this.orientation);
      player.head.orientation.copy(this.trackedobjects['head'].orientation);
      player.head.position.copy(this.trackedobjects['head'].position)
      this.dispatchEvent({type: 'xrframe', data: xrReferenceFrame});
//this.orientation.copy(player.orientation);
    }
    this.getReferenceFrame = function() {
      return this.engine.client.xrspace;
    }
    this.handleSelectStart = function(ev) {
      console.log('select started', ev);
      let handid = 'hand_' + ev.inputSource.handedness;
      if (this.trackedobjects[handid]) {
        this.trackedobjects[handid].handleSelectStart(ev);
      }
    }
    this.handleSelectEnd = function(ev) {
      console.log('select ended', ev);
      let handid = 'hand_' + ev.inputSource.handedness;
      if (this.trackedobjects[handid]) {
        this.trackedobjects[handid].handleSelectEnd(ev);
      }
    }
    this.handleSelect = function(ev) {
      console.log('selected', ev);
      let handid = 'hand_' + ev.inputSource.handedness;
      if (this.trackedobjects[handid]) {
        this.trackedobjects[handid].handleSelect(ev);
      }
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
      this.position.copy(pose.transform.position);
      this.orientation.copy(pose.transform.orientation);
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
          hand: this
        });
      },
      updateDevice(device) {
        if (device !== this.device) {
          this.device = device;
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

        this.controller = this.createObject('object', {
          id: motionController.assetUrl,
        });
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
            if (!this.handmodel) {
              console.log('new hand!', this.device.hand, this.device);
              this.handmodel = this.createObject('object', {
                id: 'cube',
                scale: V(.2, .075, .025),
                col: 'green'
              });
            }
            let handpos = xrFrame.getPose(this.device.hand[XRHand.WRIST], xrReferenceFrame);
            this.handmodel.pos = handpos.transform.position;
            this.handmodel.orientation.copy(handpos.transform.orientation);
          }
          if (this.motionController) {
            this.updateMotionControllerModel(this.motionController);
          }
          if (this.pointer && raypose) {
            this.pointer.pos.copy(raypose.transform.position);
            this.pointer.orientation.copy(raypose.transform.orientation);
          }
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
      create() {
        this.lasercolor = V(1,0,0);
        this.laser = this.createObject('linesegments', {
          positions: [V(0,0,0), V(0,0,-1000)],
          opacity: .5,
          col: this.lasercolor
        });
        this.raycaster = this.createObject('raycaster', {});
        this.raycaster.addEventListener('raycastenter', (ev) => this.handleRaycastEnter(ev));
        this.raycaster.addEventListener('raycastmove', (ev) => this.handleRaycastMove(ev));
        this.raycaster.addEventListener('raycastleave', (ev) => this.handleRaycastLeave(ev));
      },
      updateLaserEndpoint(endpoint) {
        this.worldToLocal(this.laser.positions[1].copy(endpoint));
        this.laser.updateLine();
      },
      handleRaycastEnter(ev) {
        let proxyobj = ev.data.object,
            obj = proxyobj._target;

        if (this.activeobject) {
          this.engine.client.view.proxyEvent({
            type: "mouseout",
            element: this.activeobject.objects['3d'],
            //relatedTarget: oldpickedthing,
            data: ev.data.intersection,
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
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
          this.laser.opacity = .4;
          this.laser.updateColor();
        } else {
          this.laser.col.setRGB(1,0,0);
          this.laser.opacity = .1;
          this.laser.updateColor();
        }

        this.updateLaserEndpoint(ev.data.intersection.point);

        let evdata = {
          type: "mouseover",
          element: ev.data.intersection.mesh,
          //relatedTarget: oldpickedthing,
          data: ev.data.intersection,
          clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
          clientY: 0,
        };
        if (this.hand) {
          evdata.data.gamepad = this.hand.device.gamepad;
        }
        //elation.events.fire(evdata);
        this.engine.client.view.proxyEvent(evdata, evdata.element);
      },
      handleRaycastMove(ev) {
        this.updateLaserEndpoint(ev.data.intersection.point);
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
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            button: 0,
          }, obj);
        }
      },
      handleSelectEnd(ev) {
        if (this.activeobject) {
          let obj = this.activeobject.objects['3d'];
          this.engine.client.view.proxyEvent({
            type: "mousemove",
            element: obj,
            //data: ev.data.intersection, // FIXME - need to store intersection data from raycastmove
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            button: 0,
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
            clientX: 0, // FIXME - can we project back to the screen x,y from the intersection point?
            clientY: 0,
            button: 0,
          }, obj);
        }
      },
    });
  }
});
