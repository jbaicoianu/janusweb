elation.require(['engine.things.generic'], function() {
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
      }
      this.inputs = {};
      initJanusObjects();
      this.trackedobjects = {
        head: this.createObject('trackedplayer_head', { })
      };
      this.camera = this.spawn('camera', this.name + '_camera', { position: [0,0,0] } );
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
        this.inputs[input.handedness] = input;
      }
    }
    this.updateXR = function(xrFrame) {
      if (!xrFrame) return;
      let xrReferenceFrame = this.getReferenceFrame();
      let viewerPose = xrFrame.getViewerPose(xrReferenceFrame);
      if (viewerPose) {
        this.trackedobjects['head'].updatePose(viewerPose);
      } else {
        // You've lost your head!  Should we do something about it?
      }
      for (let k in this.inputs) {
        let input = this.inputs[k];
        let id = 'hand_' + k;
        if (!this.trackedobjects[id]) {
          //this.trackedobjects[id] = this.spawn('janusxrplayer_trackedobject', null, { });
          this.trackedobjects[id] = this.createObject('trackedplayer_hand', { device: input });
        }
        let pose = xrFrame.getPose(input.gripSpace, xrReferenceFrame);
        if (pose) {
          this.trackedobjects[id].updatePose(pose);
          this.trackedobjects[id].visible = true;
        } else {
          this.trackedobjects[id].visible = false;
        }
      }
      this.position.copy(player.pos);
      //player.orientation.copy(this.orientation);
      player.head.orientation.copy(this.trackedobjects['head'].orientation);
      player.head.position.copy(this.trackedobjects['head'].position)
      this.dispatchEvent({type: 'xrframe', data: xrReferenceFrame});
    }
    this.getReferenceFrame = function() {
      return this.engine.client.xrspace;
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
    this.updatePose = function(pose) {
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
      updatePose(pose) {
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
        this.handle = this.createObject('object', {
          id: 'sphere',
          col: '#333',
          scale: V(.03, .03, .1),
          pos: V(0,0,.05),
          rotation: V(15,0,0)
        });
this.handle.col = 'red';
    /*
        this.ring = this.createObject('object', {
          id: 'torus',
          scale: V(.075),
          pos: V(0,0,0),
          col: '#333',
          rotation: V(30,0,0),
        });
        this.ring.opacity = .1;
    */
        this.face = this.createObject('object', {
          pos: V(0, 0.02, .01),
          rotation: V(5,0,0)
        });
        this.underface = this.face.createObject('object', {
          id: 'cylinder',
          scale: V(.045, .0075, .045),
          pos: V(0,-.0075,0),
          col: '#333',
        });
        this.buttons = [];
        this.createButtons();

    /*
        this.pointer = this.createObject('trackedplayer_controller_laser', {
          positions: [V(0,0,0), V(0,0,-1000)],
          col: 'red'
        });
    */
    /*
    if (this.device.hand == 'left') {
    this.createObject('fpscounter', {
      pos: V(),
      scale: V(.25),
      rotation: V(-90, 0, 0)
    });
    }
    */
      },
      updatePose(pose) {
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
      }
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
      create() {
        this.lasercolor = V(1,0,0);
        this.laser = this.createObject('linesegments', {
          positions: [V(0,0,0), V(0,0,-1000)],
          col: this.lasercolor
        });
        this.raycaster = this.createObject('raycaster', {
        });
        this.raycaster.addEventListener('raycastenter', (ev) => this.handleRaycastEnter(ev));
        this.raycaster.addEventListener('raycastleave', (ev) => this.handleRaycastLeave(ev));
      },
      handleRaycastEnter(ev) {
        this.laser.color = V(0,1,0);
        this.laser.updateColor();
      },
      handleRaycastLeave(ev) {
        this.laser.color = V(0,1,1);
        this.laser.updateColor();
      },
    });
  }
});
