elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusparticle', function() {
    this.postinit = function() {
      elation.engine.things.janusparticle.extendclass.postinit.call(this);
      this.defineProperties({ 
        emitter_id: { type: 'string', set: this.updateGeometry },
        emitter_scale: { type: 'vector3', default: [1, 1, 1], set: this.updateGeometry},
        emitter_pos: { type: 'vector3', default: [0, 0, 0] },
        image_id: { type: 'string', set: this.updateMaterial },
        rate: { type: 'float', default: 1 },
        count: { type: 'int', default: 0 },
        duration: { type: 'float', default: 1.0 },
        opacity: { type: 'float', default: 1.0, set: this.updateMaterial },
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
        blend_src: { type: 'string', default: 'src_alpha', set: this.updateMaterial },
        blend_dest: { type: 'string', default: 'one_minus_src_alpha', set: this.updateMaterial },
      });
      this.particles = [];
      this.emitted = 0;
      this.emitmesh = false;
      this.emitpoints = false;
      this.currentpoint = 0;
      this.lasttime = 0;
      this.loaded = false;
      this.started = false;
      this.pickable = false;
      this.collidable = false;

      this.updateParticles = elation.bind(this, this.updateParticles); // FIXME - hack, this should happen at the lower level of all components
    }
    this.createObject3D = function() {
      var geo = this.geometry = new THREE.BufferGeometry()

      var texture = null;
      if (this.image_id) {
        texture = elation.engine.assets.find('image', this.image_id);
        //elation.events.add(texture, 'asset_load', elation.bind(this, this.assignTextures));
        elation.events.add(texture, 'update', elation.bind(this, this.refresh));
      }
      if (this.emitter_id) {
        var asset = this.getAsset('model', this.emitter_id);
        if (asset) {
          this.emitmesh = asset.getInstance();

          if (asset.loaded) {
            this.loaded = true;
          } else {
            elation.events.add(asset, 'asset_load_complete', elation.bind(this, function() { this.loaded = true; this.createParticles(); this.start(); }));
          }
        }
      } else {
        this.loaded = true;
      }
      this.createParticles();

      if (this.loaded) {
        this.start();
      }

      var mat = new THREE.PointsMaterial({
        color: this.color, 
        map: texture, 
        size: this.particle_scale.x + this.rand_scale.x, 
        transparent: true, 
        opacity: this.opacity,
        alphaTest: 0.001,
        //blending: THREE.AdditiveBlending,
        vertexColors: THREE.VertexColors
      });
      this.material = mat;
      this.scale.set(1,1,1);
      var obj = new THREE.Points(geo, mat);
      return obj;
    }
    this.updateGeometry = function() {
      if (this.emitter_id) {
        var asset = this.getAsset('model', this.emitter_id);
        if (asset) {
          this.emitmesh = asset.getInstance();

          if (asset.loaded) {
            this.emitpoints = null;
            this.loaded = true;
            this.createParticles();
          } else {
            elation.events.add(asset, 'asset_load_complete', elation.bind(this, function() { 
              this.emitpoints = null;
              this.loaded = true; 
              this.createParticles(); 
              this.start(); 
            }));
          }
        }
      }
    }
    this.updateMaterial = function() {
      if (this.material) {
        this.material.opacity = this.opacity;
        this.material.color = this.color;
      }
    }
    this.createForces = function() {
      elation.engine.things.janusparticle.extendclass.createForces.call(this);
      this.properties.velocity.set(0,0,0); // FIXME - hack to override "vel" property mapping
    }
    this.createParticles = function() {
      this.particles = [];

      if (this.emitmesh && !this.emitpoints) {
        this.extractEmitPoints(this.emitmesh);
      }

      var geo = this.geometry;
      var count = this.count;
      var position = (geo.attributes.position && geo.attributes.position.count == count ? geo.attributes.position.array : new Float32Array(count * 3));
      var color = (geo.attributes.color && geo.attributes.color.count == count ? geo.attributes.color.array : new Float32Array(count * 3));

      for (var i = 0; i < count; i++) {
        var point = this.createPoint();
        this.resetPoint(point);

        //this.geometry.vertices[i] = point.pos;
        this.particles[i] = point;

        position[i*3] = point.pos.x;
        position[i*3+1] = point.pos.y;
        position[i*3+2] = point.pos.z;

        color[i*3] = point.color.r;
        color[i*3+1] = point.color.g;
        color[i*3+2] = point.color.b;
      }

      geo.addAttribute('position', new THREE.BufferAttribute(position, 3));
      geo.addAttribute('color', new THREE.BufferAttribute(color, 3));

      this.created = true;
      this.emitted = 0;
      this.currentpoint = 0;
      this.lasttime = performance.now();

      this.updateBoundingSphere();
      if (this.duration > 0) {
        setInterval(elation.bind(this, this.updateBoundingSphere), this.duration * 1000);
      }
    }
    this.resetParticles = function() {
      var geo = this.geometry;
      var count = this.count;
      var position = geo.attributes.position;
      var color = geo.attributes.color;

      for (var i = 0; i < count; i++) {
        var point = this.particles[i];
        this.resetPoint(point);

        position[i*3] = point.pos.x;
        position[i*3+1] = point.pos.y;
        position[i*3+2] = point.pos.z;

        color[i*3] = point.color.r;
        color[i*3+1] = point.color.g;
        color[i*3+2] = point.color.b;
      }
    }
    this.updateParticles = function(ev) {
      if (!this.loaded || !this.started) return;
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
          this.updatePoint(p, idx, elapsed/1000);
          if (now > p.endtime) {
            p.active = (loop ? 0 : 2);
          }
        } else if (p.active == 0) {
          if (spawncount > emitted) {
            this.resetPoint(p, idx);
            p.starttime = now;
            p.endtime = (this.duration > 0 ? endtime : Infinity);
            p.active = 1;
            emitted++;
            this.currentpoint = (this.currentpoint + 1) % count;
          }
        } 
      }
      this.lasttime = now;

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
      this.refresh();
    }
    this.updateBoundingSphere = function() {
      if (this.objects['3d'] && this.objects['3d'].geometry) {
        this.objects['3d'].geometry.computeBoundingSphere();
      }
    }
    this.createPoint = function() {
      return {
        pos: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3(0, 0, 0),
        accel: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(1,1,1),
        color: new THREE.Color(255, 255, 255),
        rand_col: new THREE.Color(0, 0, 0),
        active: 0,
        start: 0,
        end: 0
      };
    }
    this.updatePoint = (function() {
      var tmpvec = new THREE.Vector3();
      return function(point, idx, delta) {
        tmpvec.copy(point.accel).multiplyScalar(delta);
        point.vel.add(tmpvec);

        tmpvec.copy(point.vel).multiplyScalar(delta);
        point.pos.add(tmpvec);

        var pos = this.geometry.attributes.position.array,
            color = this.geometry.attributes.color.array,
            offset = idx * 3;

        pos[offset] = point.pos.x;
        pos[offset+1] = point.pos.y;
        pos[offset+2] = point.pos.z;

        color[offset] = point.color.r;
        color[offset+1] = point.color.g;
        color[offset+2] = point.color.b;
      }
    })();
    this.resetPoint = function(point, idx) {
      var rand_pos = this.properties.rand_pos;
      var randomInRange = function(range) {
        //return (Math.random() - .5) * range;
        return Math.random() * range;
      }
      point.pos.set(randomInRange(rand_pos.x), randomInRange(rand_pos.y), randomInRange(rand_pos.z));
      if (this.emitpoints) {
        var rand_id = Math.floor(Math.random() * this.emitpoints.length);
        point.pos.add(this.emitpoints[rand_id]);
      }
      point.pos.add(this.emitter_pos);

      var vel = point.vel,
          accel = point.accel,
          col = point.color,
          rand_vel = this.properties.rand_vel,
          rand_accel = this.properties.rand_accel,
          rand_col = this.properties.rand_col;

      vel.copy(this.properties.particle_vel);
      accel.copy(this.properties.particle_accel);

      if (rand_vel.lengthSq() > 0) {
        vel.x += randomInRange(rand_vel.x);
        vel.y += randomInRange(rand_vel.y);
        vel.z += randomInRange(rand_vel.z);
      }
      if (rand_accel.lengthSq() > 0) {
        accel.x += randomInRange(rand_accel.x);
        accel.y += randomInRange(rand_accel.y);
        accel.z += randomInRange(rand_accel.z);
      }
      col.copy(this.properties.color);
      if (rand_col.lengthSq() > 0) {
        var rand = Math.random();
        col.r += rand * rand_col.x;
        col.g += rand * rand_col.y;
        col.b += rand * rand_col.z;
      }

      if (this.geometry.attributes.position) {
        var pos = this.geometry.attributes.position.array,
            color = this.geometry.attributes.color.array;

        pos[idx*3] = point.pos.x;
        pos[idx*3+1] = point.pos.y;
        pos[idx*3+2] = point.pos.z;

        color[idx*3] = point.color.r;
        color[idx*3+1] = point.color.g;
        color[idx*3+2] = point.color.b;
      }
    }
    this.extractEmitPoints = function(mesh) {
      if (mesh) {
        var vertices = [];
        var scale = this.properties.emitter_scale;
        mesh.traverse(function(n) {
          if (n && n.geometry) {
            var geo = n.geometry;
            if (geo instanceof THREE.Geometry) {
            } else if (geo instanceof THREE.BufferGeometry) {
              var positions = geo.attributes.position.array;
              for (var i = 0; i < positions.length; i += 3) {
                vertices.push(new THREE.Vector3(positions[i] * scale.x, positions[i+1] * scale.y, positions[i+2] * scale.z));
              }
            }
          }
        });
        if (vertices.length > 0) {
          this.emitpoints = vertices;
        }
      }
    }
    this.start = function() {
      if (!this.created || this.count >= this.particles.length) {
        this.createParticles();
      } else {
        for (var i = 0; i < this.particles.length; i++) {
          this.particles[i].active = 0;
        }
        this.resetParticles();
      }
      this.currentpoint = 0;
      if (this.started) {
        this.stop();
      }
      this.started = true;
      if (this.duration > 0) {
        elation.events.add(this.engine, 'engine_frame', this.updateParticles);
      }
    }
    this.stop = function() {
      this.started = false;
      if (this.duration > 0) {
        elation.events.remove(this.engine, 'engine_frame', this.updateParticles);
      }
    }
    this.getProxyObject = function(classdef) {
      var proxy = elation.engine.things.janusparticle.extendclass.getProxyObject.call(this, classdef);
      proxy._proxydefs = {
        vel:  [ 'property', 'particle_vel'],
        accel:  [ 'property', 'particle_accel'],
        rand_pos:  [ 'property', 'rand_pos'],
        rand_vel:  [ 'property', 'rand_vel'],
        rand_accel:  [ 'property', 'rand_accel'],
        rand_col:  [ 'property', 'rand_col'],
        emitter_id:  [ 'property', 'emitter_id'],
        emitter_scale:  [ 'property', 'emitter_scale'],
        emitter_pos:  [ 'property', 'emitter_pos'],
        opacity:  [ 'property', 'opacity'],
        play:  [ 'function', 'start'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
