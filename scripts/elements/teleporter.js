elation.component.add('janusweb.elements.teleporter', {
    active: false,
    longpresstime: 250,
    deadzone: 5,

    create() {
      this.marker = this.createObject('Object', {
        id: 'pipe',
        col: '#009',
        scale: V(.5,.05,.5)
      });
      this.light = this.createObject('Light', {
        col: '#009',
        pos: V(0,1,0),
        light_range: 20,
        light_intensity: 8
      });
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
        pickable: false,
        loop: true
      });
      this.particles.particle_vel = V(-.4, 0, -.4); // FIXME - particle velocity isn't being set on spawn
      this.sound = room.createObject('Sound', { id: 'teleport2' }, this);

      this.setRoom(this.room);
      this.disableCursor();
      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('touchmove', this.handleTouchMove);
    },
    setRoom(room) {
      if (!room.addEventListener) room = room.getProxyObject();
      this.stop();
      room.appendChild(this);
      this.room = room;
      this.start();
      room.addEventListener('mousedown', this.handleMouseDown);
      room.addEventListener('mouseup', this.handleMouseUp);
      this.disableCursor();
    },
    handleMouseDown(ev) {
      this.longpresstimer = setTimeout(this.enableCursor, this.longpresstime);
      this.mousediff = [0,0];
      this.active = false;
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
      }
    },
    handleMouseUp() {
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
      this.pos = player.cursor_pos;
      this.visible = true;
      this.active = true;
    },
    disableCursor() {
      this.visible = false;
      this.active = false;
    },
    update() {
      if (this.active) {
        this.pos = player.cursor_pos;
      }
    }
  });
