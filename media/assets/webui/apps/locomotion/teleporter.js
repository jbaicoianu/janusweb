janus.registerElement('locomotion_teleporter', {
  active: false,
  longpresstime: 500,
  deadzone: 5,
  xrplayer: null,
  linesegments: 100,

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
      shadow: false,
      shadow_cast: false,
      shadow_receive: false,
      renderorder: 51,
      depth_test: false,
      depth_write: false,
    });
    this.cylinder = this.marker.createObject('object', {
      id: 'cylinder',
      col: V(0,0,155,.4),
      scale: V(.5,1.5,.5),
      collidable: false,
      pickable: false,
      shadow: false,
      shadow_cast: false,
      shadow_receive: false,
      renderorder: 50,
    });
    this.pointer = this.marker.createObject('Object', {
      id: 'pyramid',
      col: 'red',
      rotation: V(90,0,0),
      scale: V(.1,.5,.0125),
      pos: V(0,.01,0),
      collidable: false,
      pickable: false,
      shadow: false,
      shadow_cast: false,
      shadow_receive: false,
      renderorder: 52,
    });
/*
    this.light = this.createObject('Light', {
      col: '#009',
      pos: V(0,1,0),
      light_range: 20,
      light_intensity: 8
    });
*/
    this.particles = room.createObject('Particle', {
      col: V(0,.2,1,.4),
      pos: V(-.25,.1,-.25),
      scale: V(.05),
      //vel: V(-.5,0,-.5),
      particle_vel: V(-.4,2,-.4),
      rand_vel: V(.8,2,.8),
      rand_col: V(.5,.5,1),
      rand_pos: V(.5,0,.5),
      accel: V(0,-1,0),
      rand_accel: V(0,2,0),
      rate: 50,
      count: 60,
      duration: .5,
      collision_id: '',
      collidable: false,
      pickable: false,
      loop: true
    });
    this.shroud = this.createObject('object', {
      id: 'sphere',
      scale: V(2),
      lighting: false,
      col: 'black',
      cull_face: 'none',
      depth_test: false,
      depth_write: false,
      shadow_cast: false,
      shadow_receive: false,
      renderorder: 1000,
      visible: false,
    });

    let linepositions = [];
    for (let i = 0; i < this.linesegments; i++) {
      linepositions.push(V(0));
      linepositions.push(V(0));
    }

    this.laser = room.createObject('linesegments', {
      positions: linepositions,
      opacity: .8,
      col: 'blue',
      visible: false,
    });
    player.head.add(this.shroud._target);
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

    //room.addEventListener('mousedown', (ev) => this.handleMouseDown(ev));
    //room.addEventListener('mouseup', (ev) => this.handleMouseUp(ev));
    elation.events.add(janus._target, 'room_change', (ev) => this.handleRoomChange(ev));
  },
  update() {
    if (this.active) {
      let hand = this.xrplayer.trackedobjects['hand_' + this.teleporthand];
      let startpoint,
          segments = this.linesegments,
          duration = .25,
          speed = 4,
          g = V(0, -1, 0),
          p1 = V(),
          v1 = V(),
          v0;

      if (hand) {
        startpoint = hand.pointer.localToWorld(V(0, 0, 0));
        v0 = hand.pointer.localToWorld(V(0, 0, -speed)).sub(startpoint);
      } else {
        startpoint = player.head.localToWorld(V(0,0,0));
        v0 = player.head.localToWorld(V(0,0,-speed)).sub(startpoint);
      }
      let i = 0,
          p0 = startpoint.clone(),
          dir = v0.clone().normalize();
      let laserpoints = this.laser.positions;
      // Trace our arc in steps, performing a raytrace at each step
      for (i = 0; i < segments; i++) {
        let t = (i + 1) * duration / segments
        dir.copy(v0);
        speed = dir.length();
        dir.divideScalar(speed);
        let hits = room.raycast(dir, p0, null, speed);
        if (hits.length > 0) {
          let hit = hits[0];
          p1.copy(hit.point);
          if (hit.distance < 200) {
            this.pos = player.worldToLocal(hit.point);
            this.localToWorld(this.particles.emitter_pos.set(0,0,0));
            this.updateTeleportAngle();
          }
          laserpoints[i * 2].copy(p0);
          laserpoints[i * 2 + 1].copy(p1);
          // Zero out any further line segments
          for (let k = i+1; k < segments; k++) {
            laserpoints[k * 2].set(0,0,0);
            laserpoints[k * 2 + 1].set(0,0,0);
          }
          break;
        } else {
          p1.copy(g).multiplyScalar(.5 * t * t).add(v0.clone().multiplyScalar(t)).add(p0);;
          v1.copy(g).multiplyScalar(t).add(v0);
          laserpoints[i * 2].copy(p0);
          laserpoints[i * 2 + 1].copy(p1);
          p0.copy(p1);
          v0.copy(v1);
        }
      }
      this.laser.updateLine();
      if (this.laser.room !== room._target) room.appendChild(this.laser);
      this.pointer.orientation._target.setFromEuler(new THREE.Euler(Math.PI/2, this.teleportangle, 0, "YXZ"));
    } else {
      if (this.shroud.visible) {
        ////this.worldToLocal(player.head.localToWorld(this.shroud.pos.set(0,0,0)));
        if (this.shroud.opacity > .001) {
          this.shroud.opacity *= .9;
          if (this.shroud.opacity <= .001) {
            this.shroud.visible = false;
            this.shroud.opacity = 0;
          }
        }
      }
    }
  },
  handleRoomChange(ev) {
    this.setRoom(room);

    room.addEventListener('mousedown', (ev) => this.handleMouseDown(ev));
    room.addEventListener('mouseup', (ev) => this.handleMouseUp(ev));
  },
  handleTeleportChange(ev) {
    //if (!room.teleport) return;
    if (this.teleportactive) {
      let controls = this.activecontrols;
      let xy = new THREE.Vector2(controls.teleport_x, controls.teleport_y),
          len = xy.length();

      if (len > .8) {
        this.updateTeleportAngle();
      } else if (len < .01) {
        this.showShroud();
        this.teleport();
        this.teleportactive = false;
        this.teleporthand = false;
        this.disableCursor();
      }
    }
  },
  handleTeleportStart(ev, hand) {
    if (!room.teleport) return;
    if (!this.teleportactive && Math.abs(ev.value) > .8) {
      this.teleportactive = true;
      this.teleporthand = 'right';
      this.enableCursor();
      this.updateTeleportAngle();
    }
  },
  handleTeleportTurn(ev) {
    if (!this.teleportactive) {
      this.showShroud();
      let turn = new THREE.Quaternion();
      turn.setFromEuler(new THREE.Euler(0, Math.PI / 4 * (ev.value > 0 ? -1 : 1), 0));
      player.orientation.multiply(turn);
    }
  },
  handleTeleportTrigger(ev) {
    if (!room.teleport) return;
    if (this.active) {

    }
  },
  teleport() {
    //if (!room.teleport) return;
    let pos = player.localToWorld(this.pos.clone());
    pos.y += player.fatness; // FIXME - This accounts for wonky player sphere collider, when we switch to a capsule we won't need it
    player.pos = pos;
    player.vel = V(0,0,.01); // "wake up" physics engine
    player.angular.set(0,0,0);
    let playerangle = Math.atan2(this.pos.x, this.pos.z);
    console.log('Teleport player', pos, playerangle);
    this.xrplayer.orientation._target.setFromEuler(new THREE.Euler(0, this.teleportangle - playerangle, 0));
  },
  updateTeleportAngle() {
    let controls = this.activecontrols;
    let controllerangle = Math.atan2(controls.teleport_x, controls.teleport_y);
    let playerangle = Math.atan2(this.pos.x, this.pos.z);
    this.teleportangle = (controllerangle + playerangle) + Math.PI;
  },
  handleMouseDown(ev) {
    if (!room.teleport) return;
    if (ev.button == 0 && (player.enabled || janus.hmd)) {
      this.longpresstimer = setTimeout(() => { console.log('timer fired'); this.enableCursor(); }, this.longpresstime);
      this.mousediff = [0,0];
      //this.active = true;
    }
  },
  handleMouseMove(ev) {
    if (!room.teleport) return;
    if (this.longpresstimer) {
      this.mousediff[0] += ev.movementX;
      this.mousediff[1] += ev.movementY
      var distance = Math.sqrt(this.mousediff[0] * this.mousediff[0] + this.mousediff[1] * this.mousediff[1]);
      if (distance > this.deadzone) {
        clearTimeout(this.longpresstimer);
        this.longpresstimer = false;
      }
    }
  },
  handleTouchMove(ev) {
    if (!room.teleport) return;
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
    //if (!room.teleport) return;
    if (this.longpresstimer) {
      clearTimeout(this.longpresstimer);
      this.longpresstimer = false;
    }
    if (this.active) {
/*
      player.pos = this.pos;
      this.sound.pos = this.pos;
      this.sound.play();
*/
      this.showShroud();
      this.teleport();
    }
    this.disableCursor();
  },
  enableCursor() {
    if (!room.teleport) return;
    this.visible = true;
    this.particles.visible = true;
    if (this.laser.room !== room._target) room.appendChild(this.laser);
    if (this.particles.room !== room._target) room.appendChild(this.particles);
    this.laser.visible = true;
    this.active = true;
    this.particles.start();
  },
  disableCursor() {
    this.visible = false;
    this.particles.visible = false;
    this.laser.visible = false;
    this.active = false;
    this.particles.stop();
  },
  showShroud() {
    this.shroud.visible = true;
    this.shroud.opacity = 1;
  }
});
