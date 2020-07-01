janus.registerElement('locomotion_teleporter', {
  active: false,
  longpresstime: 350,
  deadzone: 5,
  xrplayer: null,

  create() {
    this.marker = this.createObject('Object', {
    });
    this.ring = this.marker.createObject('object', {
      id: 'pipe',
      col: V(0,0,155),
      emissive: V(0,0,155),
      scale: V(.5,.01,.5),
      collidable: false,
      pickable: false,
    });
    this.cylinder = this.marker.createObject('object', {
      id: 'cylinder',
      col: V(0,0,155,.2),
      scale: V(.5,1.5,.5),
      collidable: false,
      pickable: false,
    });
    this.pointer = this.marker.createObject('Object', {
      id: 'pyramid',
      col: 'red',
      rotation: V(90,0,0),
      scale: V(.1,.5,.0125),
      pos: V(0,.01,0),
      collidable: false,
      pickable: false,
    });
/*
    this.light = this.createObject('Light', {
      col: '#009',
      pos: V(0,1,0),
      light_range: 20,
      light_intensity: 8
    });
*/
    this.particles = this.createObject('Particle', {
      col: V(0,.2,1,.2),
      pos: V(-.25,.1,-.25),
      scale: V(.05),
      //vel: V(-.5,0,-.5),
      particle_vel: V(-.4,0,-.4),
      rand_vel: V(.8,2,.8),
      rand_col: V(.5,.5,1),
      rand_pos: V(.5,0,.5),
      accel: V(0,-1,0),
      rand_accel: V(0,2,0),
      rate: 50,
      count: 50,
      duration: 1,
      collision_id: '',
      collidable: false,
      pickable: false,
      loop: true
    });
    this.particles.particle_vel = V(-.4, 0, -.4); // FIXME - particle velocity isn't being set on spawn
    this.sound = room.createObject('Sound', { id: 'teleport2' }, this);

    this.disableCursor();
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('touchmove', this.handleTouchMove, true);

    this.activecontrols = this.addControlContext('teleporter', {
      'teleport_x': {
        defaultbindings: 'gamepad_any_axis_0,gamepad_any_axis_2',
        onchange: ev => this.handleTeleportChange(ev),
        onactivate: ev => this.handleTeleportTurn(ev),
      },
      'teleport_y': {
        defaultbindings: 'gamepad_any_axis_1,gamepad_any_axis_3',
        onchange: ev => this.handleTeleportChange(ev),
        onactivate: ev => this.handleTeleportStart(ev),
      },
      'teleport_trigger': {
        defaultbindings: 'gamepad_any_button_0',
        onactivate: ev => this.handleTeleportTrigger(ev),
      },
    });
    this.activateControlContext('teleporter');

    elation.events.add(janus._target, 'room_change', (ev) => this.handleRoomChange(ev));
  },
  update() {
    if (this.active) {
      let hand = this.xrplayer.trackedobjects.hand_right; // FIXME - figure out hand based on which controller is triggering the teleporter
      let hits = hand.raycast(V(0,0,-1));
      if (hits.length > 0) {
        let hit = hits[0];
        if (hit.distance < 200) {
          this.pos = player.worldToLocal(hits[0].point);
          this.updateTeleportAngle();
        }
      }
      this.pointer.rotation = V(90, 0, -this.teleportangle * 180 / Math.PI);
    }
  },
  handleRoomChange(ev) {
    this.setRoom(room);
  },
  handleTeleportChange(ev) {
    if (this.teleportactive) {
      let controls = this.activecontrols;
      let xy = new THREE.Vector2(controls.teleport_x, controls.teleport_y),
          len = xy.length();

      if (len > .8) {
        this.updateTeleportAngle();
      } else if (len < .01) {
        this.teleport();
        this.teleportactive = false;
        this.disableCursor();
      }
    }
  },
  handleTeleportStart(ev) {
    if (!this.teleportactive && Math.abs(ev.value) > .8) {
      this.teleportactive = true;
      this.enableCursor();
      this.updateTeleportAngle();
    }
  },
  handleTeleportTurn(ev) {
    if (!this.teleportactive) {
      let turn = new THREE.Quaternion();
      turn.setFromEuler(new THREE.Euler(0, Math.PI / 4 * (ev.value > 0 ? -1 : 1), 0));
      player.orientation.multiply(turn);
    }
  },
  handleTeleportTrigger(ev) {
    if (this.active) {

    }
  },
  teleport() {
    let pos = player.localToWorld(this.pos.clone());
    player.pos = pos;
    let playerangle = Math.atan2(this.pos.x, this.pos.z);
    this.xrplayer.orientation._target.setFromEuler(new THREE.Euler(0, this.teleportangle - playerangle, 0));
  },
  updateTeleportAngle() {
    let controls = this.activecontrols;
    let controllerangle = Math.atan2(controls.teleport_x, controls.teleport_y);
    let playerangle = Math.atan2(this.pos.x, this.pos.z);
    this.teleportangle = (controllerangle + playerangle) + Math.PI;
  },
  handleMouseDown(ev) {
    if (ev.button == 0 && player.enabled) {
      this.longpresstimer = setTimeout(this.enableCursor, this.longpresstime);
      this.mousediff = [0,0];
      this.active = false;
    }
  },
  handleMouseMove(ev) {
    if (this.longpresstimer) {
      this.mousediff[0] += ev.movementX;
      this.mousediff[1] += ev.movementY
      var distance = Math.sqrt(this.mousediff[0] * this.mousediff[0] + this.mousediff[1] * this.mousediff[1]);
      if (distance > this.deadzone) {
        clearTimeout(this.longpresstimer);
      }
    }
  },
  handleTouchMove(ev) {
    if (this.longpresstimer) {
      var touch = ev.changedTouches[0];

      if (this.lasttouch) {
        this.mousediff[0] += touch.clientX - this.lasttouch[0];
        this.mousediff[1] += touch.clientY - this.lasttouch[1];
      } else {
        this.mousediff[0] = 0;
        this.mousediff[1] = 0;
      }
      this.lasttouch = [touch.clientX, touch.clientY];
      var distance = Math.sqrt(this.mousediff[0] * this.mousediff[0] + this.mousediff[1] * this.mousediff[1]);
      if (distance > this.deadzone) {
        clearTimeout(this.longpresstimer);
      }
      if (this.active) {
        ev.stopPropagation();
        ev.preventDefault();
      }
    }
  },
  handleMouseUp(ev) {
    if (this.longpresstimer) {
      clearTimeout(this.longpresstimer);
    }
    if (this.active) {
      player.pos = player.cursor_pos;
      this.sound.pos = player.pos;
      this.sound.play();
    }
    this.disableCursor();
  },
  enableCursor() {
    this.visible = true;
    this.active = true;
    this.particles.start();
  },
  disableCursor() {
    this.visible = false;
    this.active = false;
    this.particles.stop();
  },
});
