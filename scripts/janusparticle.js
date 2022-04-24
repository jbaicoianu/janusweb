elation.require(['janusweb.janusbase'], function() {

  let shaderdef = {
    vertex: `
      attribute float size;
      attribute vec4 customColor;
      varying vec4 vColor;
      void main() {
        vColor = customColor;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragment: `
      uniform vec3 color;
      uniform sampler2D sprite;
      varying vec4 vColor;
      void main() {
        gl_FragColor = vec4( color * vColor.rgb, vColor.a );
        #ifdef USE_MAP
          gl_FragColor = gl_FragColor * texture2D( sprite, gl_PointCoord );
        #endif
      }
    `
  };

  elation.component.add('engine.things.janusparticle', function() {
    this.postinit = function() {
      elation.engine.things.janusparticle.extendclass.postinit.call(this);
      this.defineProperties({ 
        emitter_id: { type: 'string', set: this.updateGeometry },
        emitter_scale: { type: 'vector3', default: [1, 1, 1], set: this.updateGeometry},
        emitter_pos: { type: 'vector3', default: [0, 0, 0] },
        image_id: { type: 'string', set: this.updateMaterial },
        rate: { type: 'float', default: 1 },
        count: { type: 'int', default: 100, set: this.updateParticles },
        duration: { type: 'float', default: 1.0 },
        opacity: { type: 'float', default: 1.0, set: this.updateMaterial },
        fade_in: { type: 'float', default: 1.0 },
        fade_out: { type: 'float', default: 1.0 },
        particle_scale: { type: 'vector3', default: [1, 1, 1], set: this.updateMaterial},
        particle_vel: { type: 'vector3', default: [0, 0, 0]},
        particle_accel: { type: 'vector3', default: [0, 0, 0]},
        rand_pos: { type: 'vector3', default: [0, 0, 0]},
        rand_vel: { type: 'vector3', default: [0, 0, 0]},
        rand_accel: { type: 'vector3', default: [0, 0, 0]},
        rand_col: { type: 'vector3', default: [0, 0, 0]},
        rand_scale: { type: 'vector3', default: [0, 0, 0]},
        loop: { type: 'bool', default: true, set: this.updateParticles },
        refreshrate: { type: 'int', default: 30 },
        blend_src: { type: 'string', default: 'src_alpha', set: this.updateMaterial },
        blend_dest: { type: 'string', default: 'one_minus_src_alpha', set: this.updateMaterial },
        depth_write: { type: 'bool', default: false },
        depth_test: { type: 'bool', default: true },
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
      this.boundingRadiusSq = 0;
      this.boundingSphereWorld = new THREE.Sphere();
      this.furthestPoint = new THREE.Vector3();
      this.lastrefresh = 0;
      this.updateParticles = elation.bind(this, this.updateParticles); // FIXME - hack, this should happen at the lower level of all components
    }
    this.createObject3D = function() {
      var geo = this.geometry = new THREE.BufferGeometry();

      var texture = null,
          textureasset = null;
      if (this.image_id) {
        textureasset = this.getAsset('image', this.image_id);
        if (textureasset) {
          elation.events.add(textureasset, 'asset_load', elation.bind(this, this.updateMaterial));
          elation.events.add(textureasset, 'update', elation.bind(this, this.refresh));
          this.imageasset = textureasset;
          texture = textureasset.getInstance();
        }
      }
      if (this.emitter_id) {
        var asset = this.getAsset('model', this.emitter_id);
        if (asset) {
          this.emitmesh = asset.getInstance();

          if (asset.loaded) {
            this.loaded = true;
          } else {
            elation.events.add(asset, 'asset_load_complete', elation.bind(this, function() { this.loaded = true; this.createParticles(false); this.start(); }));
          }
        }
      } else {
        this.loaded = true;
      }
      this.createParticles();

      if (this.loaded) {
        this.start();
      }

/*
      var mat = new THREE.PointsMaterial({
        //color: this.color, 
        map: texture, 
        size: this.particle_scale.x + this.rand_scale.x, 
        transparent: true, 
        opacity: this.opacity,
        alphaTest: 0.001,
        //blending: THREE.AdditiveBlending,
        vertexColors: THREE.VertexColors
      });
*/
      let shaderdefines = {};
      if (texture) {
        shaderdefines.USE_MAP = 1;
      }
      var mat = new THREE.ShaderMaterial( {
        uniforms: {
          color: { value: new THREE.Color( 0xffffff ) },
          sprite: { value: texture },
        },
        defines: shaderdefines,
        vertexShader: shaderdef.vertex,
        fragmentShader: shaderdef.fragment,
        //blending: THREE.AdditiveBlending,
        transparent: true,
        alphaTest: .001,
        depthWrite: this.depth_write,
        depthTest: this.depth_test,
      } );

      this.material = mat;
      this.updateMaterial();
      this.scale.set(1,1,1);
      var obj = new THREE.Points(geo, mat);
      if (this.renderorder) obj.renderOrder = this.renderorder;
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
        this.material.transparent = (this.imageasset && this.imageasset.hasalpha) || (this.opacity < 1);
        this.material.color = this.color;
        this.material.size = this.particle_scale.x + this.rand_scale.x; 

        let blend_src = false,
            blend_dest = false,
            srcfactors = {
              'zero': THREE.ZeroFactor,
              'one': THREE.OneFactor,
              'src_color': THREE.SrcColorFactor,
              'dst_color': THREE.DstColorFactor,
              'src_alpha': THREE.SrcAlphaFactor,
              'dst_alpha': THREE.DstAlphaFactor,
              'one_minus_src_color': THREE.OneMinusSrcColorFactor,
              'one_minus_src_alpha': THREE.OneMinusSrcAlphaFactor,
              'one_minus_dst_color': THREE.OneMinusDstColorFactor,
              'one_minus_dst_alpha': THREE.OneMinusDstAlphaFactor,
            };
        if (srcfactors[this.blend_src]) {
          blend_src = srcfactors[this.blend_src];
        }
        if (srcfactors[this.blend_dest]) {
          blend_dest = srcfactors[this.blend_dest];
        }
        if (blend_src || blend_dest) {
          let m = this.material;
          if (blend_src) m.blendSrc = blend_src;
          if (blend_dest) m.blendDst = blend_dest;
          m.blending = THREE.CustomBlending;

          m.blendSrcAlpha = THREE.SrcAlphaFactor;
          m.blendDstAlpha = THREE.OneFactor;
          if (!(this.blend_src == 'src_alpha' && this.blend_dest == 'one_minus_src_alpha')) {
            m.transparent = true;
          }
        } else {
          m.blending = THREE.NormalBlending;
        }
      }
    }
    this.createForces = function() {
      elation.engine.things.janusparticle.extendclass.createForces.call(this);
      this.properties.particle_vel.copy(this.properties.velocity);
      this.properties.velocity.set(0,0,0); // FIXME - hack to override "vel" property mapping
      if ((this.collidable || this.pickable) && !this.collider) {
        this.collider = new THREE.Points(this.geometry, new THREE.PointsMaterial({color: 0xffff00, opacity: .2, transparent: true, size: this.particle_scale.x + this.rand_scale.x, }));
        this.colliders.add(this.collider);
      }
    }
    this.createParticles = function(reset=true) {
      if (reset) {
        this.particles = [];
      }

      if (this.emitmesh && !this.emitpoints) {
        this.extractEmitPoints(this.emitmesh);
      }

      var geo = this.geometry;
      var count = this.count;
      var position = (geo.attributes.position && geo.attributes.position.count == count ? geo.attributes.position.array : new Float32Array(count * 3));
      var color = (geo.attributes.customColor && geo.attributes.customColor.count == count ? geo.attributes.customColor.array : new Float32Array(count * 4));
      var size = (geo.attributes.size && geo.attributes.size.count == count ? geo.attributes.size.array : new Float32Array(count));

      for (var i = 0; i < count; i++) {
        var point = this.particles[i];
        if (reset || !point) {
          point = this.createPoint();
          this.resetPoint(point);
          this.particles[i] = point;
        }
        //this.geometry.vertices[i] = point.pos;

        position[i*3] = point.pos.x;
        position[i*3+1] = point.pos.y;
        position[i*3+2] = point.pos.z;

        color[i*4] = point.color.r;
        color[i*4+1] = point.color.g;
        color[i*4+2] = point.color.b;
        color[i*4+3] = point.opacity;

        size[i] = point.size;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
      geo.setAttribute('customColor', new THREE.BufferAttribute(color, 4));
      geo.setAttribute('size', new THREE.BufferAttribute(size, 1));

      this.created = true;
      this.spawncount = 0;
      this.currentpoint = 0;
      this.lasttime = performance.now();

      //this.updateBoundingSphere();
    }
    this.resetParticles = function() {
      if (!this.created) return;
      var geo = this.geometry;
      var count = this.count;
      var position = geo.attributes.position;
      var color = geo.attributes.customColor;

      for (var i = 0; i < count; i++) {
        var point = this.particles[i];
        this.resetPoint(point);

        position[i*3] = point.pos.x;
        position[i*3+1] = point.pos.y;
        position[i*3+2] = point.pos.z;

        color[i*4] = point.color.r;
        color[i*4+1] = point.color.g;
        color[i*4+2] = point.color.b;
        color[i*4+3] = point.opacity;
      }
      this.emitted = 0;
    }
    this.updateParticles = function(ev) {
      if (!this.loaded || !this.started || !this.parent) return;
      var now = performance.now(),
          elapsed = now - this.lasttime,
          endtime = now + this.duration * 1000,
          emitted = 0,
          startpoint = this.currentpoint,
          spawncount = this.spawncount + this.rate * elapsed / 1000,
          count = this.count,
          loop = this.loop;

      // If we have no particles to render, there's nothing to do!
      if (count <= 0) return;

      if (count != this.particles.length) {
        this.createParticles(false);
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
            spawncount--;
            this.currentpoint = (this.currentpoint + 1) % count;
          }
        } 
      }
      this.spawncount = spawncount;
      this.lasttime = now;
      // Notify the renderer of our changes, but only if we're visible to the player
      // We also rate limit here, so if nothing else in the scene is changing, we
      // render at a lower fps
      this.localToWorld(this.boundingSphereWorld.center.set(0,0,0));
      let geo = this.objects['3d'].geometry;
      if (!geo.boundingSphere) {
        geo.computeBoundingSphere();
      } else {
        let currentBoundingRadius = geo.boundingSphere.radius;
        if (this.boundingRadiusSq > currentBoundingRadius * currentBoundingRadius) {
           geo.boundingSphere.radius = Math.sqrt(this.boundingRadiusSq) + .1;
        }
      }

      this.boundingSphereWorld.radius = geo.boundingSphere.radius;
      if (player.viewfrustum.intersectsSphere(this.boundingSphereWorld) && now - this.lastrefresh > (1000 / this.refreshrate)) {

        this.refresh();
        this.lastrefresh = now;
      }

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.customColor.needsUpdate = true;
    }
    this.updateBoundingSphere = function(vec) {
      if (this.objects['3d']) {
        var lengthSq = vec.lengthSq();
        if (lengthSq > this.boundingRadiusSq) {
          this.boundingRadiusSq = lengthSq;
          this.furthestPoint.copy(vec);
/*
          var geo = this.objects['3d'].geometry;
          if (!geo.boundingSphere) {
            geo.boundingSphere = new THREE.Sphere();
          }
          geo.boundingSphere.radius = Math.sqrt(lengthSq);
*/
        }
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
        size: this.particle_scale.x,
        opacity: 1,
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
            color = this.geometry.attributes.customColor.array,
            size = this.geometry.attributes.size.array,
            offset = idx * 3;

        pos[offset] = point.pos.x;
        pos[offset+1] = point.pos.y;
        pos[offset+2] = point.pos.z;

        color[idx*4] = point.color.r;
        color[idx*4+1] = point.color.g;
        color[idx*4+2] = point.color.b;
        color[idx*4+3] = point.opacity;

        size[idx] = point.size;
        this.updateBoundingSphere(point.pos);
      }
    })();
    this.resetPoint = function(point, idx) {
      var rand_pos = this.properties.rand_pos;
      var randomInRange = function(range) {
        //return (Math.random() - .5) * range;
        return Math.random() * range;
      };
      let pointpos = point.pos;
      pointpos.set(randomInRange(rand_pos.x), randomInRange(rand_pos.y), randomInRange(rand_pos.z));
      if (this.emitpoints) {
        var rand_id = Math.floor(Math.random() * this.emitpoints.length);
        pointpos.add(this.emitpoints[rand_id]);
      }
      pointpos.add(this.emitter_pos);

      point.opacity = this.opacity;

      var vel = point.vel,
          accel = point.accel,
          col = point.color,
          rand_vel = this.properties.rand_vel,
          rand_accel = this.properties.rand_accel,
          rand_col = this.properties.rand_col,
          rand_scale = this.properties.rand_scale;

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
      point.size = this.particle_scale.x + randomInRange(rand_scale.x);
      if (this.geometry.attributes.position) {
        var pos = this.geometry.attributes.position.array,
            color = this.geometry.attributes.customColor.array,
            size = this.geometry.attributes.size.array;

        pos[idx*3] = pointpos.x;
        pos[idx*3+1] = pointpos.y;
        pos[idx*3+2] = pointpos.z;

        color[idx*4] = point.color.r;
        color[idx*4+1] = point.color.g;
        color[idx*4+2] = point.color.b;
        color[idx*4+3] = point.opacity;

        size[idx] = point.size;
        this.updateBoundingSphere(pointpos);
      }
    }
    this.extractEmitPoints = function(mesh) {
      if (mesh) {
        var vertices = [];
        var scale = this.properties.emitter_scale;
        mesh.traverse(function(n) {
          if (n && n.geometry) {
            var geo = n.geometry;
            if (geo instanceof THREE.BufferGeometry) {
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
      if (!this.created || (this.count > this.particles.length)) {
        this.createParticles();
      } else {
/*
        for (var i = 0; i < this.particles.length; i++) {
          this.particles[i].active = 0;
        }
        this.resetParticles();
*/
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
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusparticle.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          loop:  [ 'property', 'loop'],
          vel:  [ 'property', 'particle_vel'],
          accel:  [ 'property', 'particle_accel'],
          rand_pos:  [ 'property', 'rand_pos'],
          rand_vel:  [ 'property', 'rand_vel'],
          rand_accel:  [ 'property', 'rand_accel'],
          rand_col:  [ 'property', 'rand_col'],
          particle_vel:  [ 'property', 'particle_vel'],
          image_id:  [ 'property', 'image_id'],
          emitter_id:  [ 'property', 'emitter_id'],
          emitter_scale:  [ 'property', 'emitter_scale'],
          emitter_pos:  [ 'property', 'emitter_pos'],
          rate:  [ 'property', 'rate'],
          count:  [ 'property', 'count'],
          duration:  [ 'property', 'duration'],
          opacity:  [ 'property', 'opacity'],
          depth_write:  [ 'property', 'depth_write'],
          depth_test:  [ 'property', 'depth_test'],
          play:  [ 'function', 'start'],
        };
      }
      return this._proxyobject;
    }
    this.setPoint = function(pointnum, newpos, newvel, newaccel, newcol, newsize, newopacity=1) {
      var offset = pointnum * 3;

      var point = this.particles[pointnum];
      if (!point) {
        point = this.createPoint();
        point.active = 1;
        this.particles[pointnum] = point;
      }

      point.active = 1;

      var pos = this.geometry.attributes.position.array,
          color = this.geometry.attributes.customColor.array,
          size = this.geometry.attributes.size.array;

      if (newpos) {
        point.pos.copy(newpos);

        pos[offset    ] = newpos.x;
        pos[offset + 1] = newpos.y;
        pos[offset + 2] = newpos.z;

        this.geometry.attributes.position.needsUpdate = true;
        this.updateBoundingSphere(newpos);
      }

      if (newvel) {
        point.vel.copy(newvel);
      }

      if (newaccel) {
        point.accel.copy(newaccel);
      }

      if (newcol) {
        point.color.setRGB(newcol.x, newcol.y, newcol.z);

        color[pointnum*4    ] = newcol.x;
        color[pointnum*4 + 1] = newcol.y;
        color[pointnum*4 + 2] = newcol.z;
        color[pointnum*4 + 3] = elation.utils.any(point.opacity, this.opacity, 1);

        this.geometry.attributes.customColor.needsUpdate = true;
      }
      if (newsize) {
        point.size = newsize;
        size[pointnum] = newsize;

        this.geometry.attributes.size.needsUpdate = true;
      }
      point.opacity = newopacity;

      if (pointnum >= this.count) {
        this.count = this.particles.length;
        this.createParticles(false);
        this.updateParticles();
      }
    }
  }, elation.engine.things.janusbase);
});
