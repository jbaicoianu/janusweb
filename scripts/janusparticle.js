elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusparticle', function() {
    this.postinit = function() {
      elation.engine.things.janusparticle.extendclass.postinit.call(this);
      this.defineProperties({ 
        image_id: { type: 'string', set: this.updateMaterial },
        rate: { type: 'float', default: 1 },
        count: { type: 'int', default: 0 },
        duration: { type: 'float', default: 1.0 },
        fade_in: { type: 'float', default: 1.0 },
        fade_out: { type: 'float', default: 1.0 },
        duration: { type: 'float', default: 1.0 },
        particle_scale: { type: 'vector3', default: [1, 1, 1]},
        particle_vel: { type: 'vector3', default: [0, 0, 0]},
        particle_accel: { type: 'vector3', default: [0, 0, 0]},
        rand_pos: { type: 'vector3', default: [0, 0, 0]},
        rand_vel: { type: 'vector3', default: [0, 0, 0]},
        rand_accel: { type: 'vector3', default: [0, 0, 0]},
        rand_col: { type: 'vector3', default: [0, 0, 0]},
        rand_scale: { type: 'vector3', default: [0, 0, 0]},
        loop: { type: 'bool', default: false },
      });
      this.particles = [];
      this.emitted = 0;
      this.currentpoint = 0;
      this.lasttime = 0;
      elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.updateParticles));
    }
    this.createObject3D = function() {
      var geo = this.geometry = new THREE.Geometry()

      this.createParticles();

      var texture = null;
      if (this.image_id) {
        texture = elation.engine.assets.find('image', this.image_id);
        //elation.events.add(texture, 'asset_load', elation.bind(this, this.assignTextures));
        elation.events.add(texture, 'update', elation.bind(this, this.refresh));
      }

      var mat = new THREE.PointsMaterial({color: this.color, map: texture, size: this.particle_scale.x, transparent: true, alphaTest: 0.05});
      this.scale.set(1,1,1);
      var obj = new THREE.Points(geo, mat);
      return obj;
    }
    this.createForces = function() {
      this.properties.velocity.set(0,0,0); // FIXME - hack to override "vel" property mapping
    }
    this.createParticles = function() {
      this.particles = [];

      var count = this.count;
      for (var i = 0; i < count; i++) {
        var point = this.createPoint();
        this.resetPoint(point);

        this.geometry.vertices[i] = point.pos;
        this.particles[i] = point;
      }
      if (this.geometry.vertices.length > count) {
        this.geometry.vertices.splice(count)
      }
      this.emitted = 0;
      this.currentpoint = 0;
      this.lasttime = performance.now();
      setTimeout(elation.bind(this, this.updateBoundingSphere), this.duration * 1000);
    }
    this.updateParticles = function(ev) {
      //console.log('go!', ev);
      //this.physics.step(ev.data.delta);
//console.log('pdate', this.particles[0].toArray());

      var now = performance.now(),
          elapsed = now - this.lasttime,
          endtime = now + this.duration * 1000,
          emitted = 0,
          startpoint = this.currentpoint;
          spawncount = this.rate * elapsed / 1000;
          count = this.count,
          loop = this.loop;

      if (count != this.particles.length) {
        this.createParticles();
      }
      for (var i = 0; i < count; i++) {
        var idx = (i + startpoint) % count;
        var p = this.particles[idx];
        if (p.active == 1) {
          this.updatePoint(p, elapsed/1000);
          if (now > p.endtime) {
            p.active = (loop ? 0 : 2);
          }

        } else if (p.active == 0) {
          if (spawncount > emitted) {
            this.resetPoint(p);
            p.starttime = now;
            p.endtime = endtime;
            p.active = 1;
            emitted++;
            this.currentpoint = (this.currentpoint + 1) % count;
          }
        } 
      }
      this.lasttime = now;

      this.objects['3d'].geometry.verticesNeedUpdate = true;
      this.refresh();
    }
    this.updateBoundingSphere = function() {
      this.objects['3d'].geometry.computeBoundingSphere();
    }
    this.createPoint = function() {
      return {
        pos: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3(0, 0, 0),
        accel: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(1,1,1),
        color: new THREE.Color(255, 255, 255),
        active: 0,
        start: 0,
        end: 0
      };
    }
    this.updatePoint = (function() {
      var tmpvec = new THREE.Vector3();
      return function(point, delta) {
        tmpvec.copy(point.accel).multiplyScalar(delta);
        point.vel.add(tmpvec);

        tmpvec.copy(point.vel).multiplyScalar(delta);
        point.pos.add(tmpvec);
      }
    })();
    this.resetPoint = function(point) {
      var rand_pos = this.properties.rand_pos;
      point.pos.set(Math.random() * rand_pos.x, Math.random() * rand_pos.y, Math.random() * rand_pos.z);

      var vel = point.vel,
          accel = point.accel,
          rand_vel = this.properties.rand_vel,
          rand_accel = this.properties.rand_accel;

      vel.copy(this.properties.particle_vel);
      accel.copy(this.properties.particle_accel);

      if (rand_vel.lengthSq() > 0) {
        vel.x += rand_vel.x * Math.random();
        vel.y += rand_vel.y * Math.random();
        vel.z += rand_vel.z * Math.random();
      }
      if (rand_accel.lengthSq() > 0) {
        accel.x += rand_accel.x * Math.random();
        accel.y += rand_accel.y * Math.random();
        accel.z += rand_accel.z * Math.random();
      }
    }
    this.getProxyObject = function() {
      var proxy = elation.engine.things.janusparticle.extendclass.getProxyObject.call(this);
      proxy._proxydefs = {
        vel:  [ 'property', 'particle_vel'],
        accel:  [ 'property', 'particle_accel'],
        rand_pos:  [ 'property', 'rand_pos'],
        rand_vel:  [ 'property', 'rand_vel'],
        rand_accel:  [ 'property', 'rand_accel'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
