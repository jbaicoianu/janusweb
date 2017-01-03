elation.require(['janusweb.janusbase', 'janusweb.websurface'], function() {
  elation.component.add('engine.things.janusobject', function() {
    this.sidemap = {
      'back': THREE.FrontSide,
      'front': THREE.BackSide,
      'none': THREE.DoubleSide
    };
    this.postinit = function() {
      elation.engine.things.janusobject.extendclass.postinit.call(this);
      this.defineProperties({
        janusid: { type: 'string', refreshGeometry: true },
        image_id: { type: 'string', set: this.updateMaterial },
        video_id: { type: 'string', set: this.updateMaterial },
        url: { type: 'string' },
        loop: { type: 'boolean' },
        collision_id: { type: 'string' },
        websurface_id: { type: 'string', set: this.updateMaterial },
        lighting: { type: 'boolean', default: true, set: this.updateMaterial },
        cull_face: { type: 'string', default: 'back', set: this.updateMaterial },
        blend_src: { type: 'string', default: 'src_alpha', set: this.updateMaterial },
        blend_dest: { type: 'string', default: 'one_minus_src_alpha', set: this.updateMaterial },
        collider_id: { type: 'string', set: this.updatePhysics },
        collider_pos: { type: 'vector3', set: this.updatePhysics },
        collider_scale: { type: 'vector3', set: this.updatePhysics },
        collision_static: { type: 'boolean', default: true, set: this.updatePhysics },
      });
      //elation.events.add(this, 'thing_init3d', elation.bind(this, this.assignTextures));

      if (this.websurface_id) {
        var websurface = this.room.websurfaces[this.websurface_id];
        console.log('do a websurface: ' + this.websurface_id, websurface, this.room.baseurl);
        if (websurface) {
          var url = websurface.src;
          if (url && !url.match(/^(https?:)?\/\//)) {
            url = this.room.baseurl + url;
          }
          this.url = url;
        }
        this.pickable = false;
        this.collidable = false;
      }
    }
    this.createObject3D = function() {
      if (this.properties.exists === false) return;

      var object = null, geometry = null, material = null;
      if (this.janusid) {
        var asset = this.getAsset('model', this.janusid);
        if (asset) {
          if (asset.loaded) {
            setTimeout(elation.bind(this, this.assignTextures), 0);
          } else {
            elation.events.add(asset, 'asset_load_complete', elation.bind(this, this.assignTextures));
          }
          object = asset.getInstance();
        }
      } else {
        object = new THREE.Object3D();
      }

      return object;
    }
    this.createChildren = function() {
      //this.properties.collidable = false;
      //this.updateColliderFromGeometry(new THREE.BoxGeometry(1,1,1));
    }
    this.createForces = function() {
      elation.engine.things.janusobject.extendclass.createForces.call(this);
      if (!this.collidable) return;

      var collider_id = this.collider_id || this.collision_id;
      var collider_scale = this.properties.collider_scale || this.properties.scale;
      if (collider_id) {
        if ((!this.collision_static || this.collision_static == 'false') && this.room.gravity) { // FIXME - should never receive 'false' as a string here
          this.objects.dynamics.mass = this.mass = 1;
          this.objects.dynamics.addForce('static', new THREE.Vector3(0, this.room.gravity, 0));
        }

        this.collidable = true;
        if (collider_id == 'sphere') {
          this.setCollider('sphere', {radius: Math.max(collider_scale.x, collider_scale.y, collider_scale.z) / 2});
        } else if (collider_id == 'cube') {
          var halfsize = collider_scale.clone().multiplyScalar(.5);
          this.setCollider('box', {min: halfsize.clone().negate(), max: halfsize});
        } else if (collider_id == 'plane') {
          var halfsize = collider_scale.clone().multiplyScalar(.5);
          halfsize.z = .1;
          this.setCollider('box', {min: halfsize.clone().negate(), max: halfsize});
        } else if (collider_id == 'cylinder') {
          this.setCollider('cylinder', {height: collider_scale.y, radius: Math.max(collider_scale.x, collider_scale.z) / 2, offset: new THREE.Vector3(0, 0.5 * collider_scale.y, 0)});
        } else {
          var colliderasset = this.getAsset('model', collider_id);
          if (colliderasset) {
            var collider = colliderasset.getInstance();
            this.collidermesh = collider;
            if (collider.userData.loaded) {
              this.extractColliders(collider, true);
              collider.userData.thing = this;
              this.colliders.add(collider);
            } else {
              elation.events.add(collider, 'asset_load', elation.bind(this, function(ev) {  
                collider.userData.thing = this;
                this.extractColliders(collider, true);

                //collider.bindPosition(this.position);
                //collider.bindQuaternion(this.orientation);
                //collider.bindScale(this.properties.scale);

                collider.traverse(elation.bind(this, function(n) {
                  if (n.geometry) {
                    n.geometry.computeVertexNormals();
                    n.geometry.computeFaceNormals();
                  }
                  if (n.material) n.material = new THREE.MeshLambertMaterial({color: 0x999900, opacity: .2, transparent: true, emissive: 0x444400, alphaTest: .01, depthTest: false, depthWrite: false});
                  n.userData.thing = this;
                }));
                this.colliders.add(collider);

              }) );
            }
          }
        }
      }
    }
    this.createObjectDOM = function() {
/*
      if (this.websurface_id) {
        var websurface = this.room.websurfaces[this.properties.websurface_id];
        if (websurface) {
          var width = websurface.width || 1024,
              height = websurface.height || 768;

          var iframe = elation.html.create('iframe');
          iframe.src = this.url;
          var div = elation.html.create('div');
          div.className = 'janusweb_websurface ';
          div.appendChild(iframe);
          div.style.width = width + 'px';
          div.style.height = height + 'px';
          iframe.style.width = width + 'px';
          iframe.style.height = height + 'px';

          var obj = new THREE.CSS3DObject(div);
          obj.scale.set(1/width, 1/height, 1);
          this.objects['3d'].add(obj);
        }
      }
*/
    }
    this.updateMaterial = function() {
      this.assignTextures();
    }
    this.replaceWebsurfaceMaterial = function() {
      var blankmaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        opacity: 0,
        transparent: true,
        blending: THREE.NoBlending,
        side: THREE.DoubleSide
      });
      this.objects['3d'].traverse(function(n) {
        if (n.material) n.material = blankmaterial;
      });
    }
    this.assignTextures = function() {
      //console.log('assign textures', this.name, this.objects['3d']);
      if (!this.objects['3d']) return;
      var modelasset = false,
          texture = false,
          color = false,
          blend_src = false,
          blend_dest = false,
          side = this.sidemap[this.properties.cull_face];

      if (this.janusid) {
        modelasset = this.getAsset('model', this.janusid);
      }
      if (this.properties.image_id) {
        textureasset = this.getAsset('image', this.image_id);
        if (textureasset) {
          texture = textureasset.getInstance();
          //elation.events.add(texture, 'asset_load', elation.bind(this, this.assignTextures));
          elation.events.add(texture, 'update', elation.bind(this, this.refresh));
        }
      }
      if (this.properties.video_id) {
        var videoasset = this.getAsset('video', this.properties.video_id);
        if (videoasset) {
          texture = videoasset.getInstance();
          if (videoasset.sbs3d) {
            texture.repeat.x = 0.5;
          }
          if (videoasset.loop || this.properties.loop) {
            texture.image.loop = true;
          }
          if (videoasset.auto_play) {
            texture.image.play();
          }
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          elation.events.add(texture, 'videoframe', elation.bind(this, this.refresh));
          elation.events.add(this, 'click', elation.bind(this, this.pauseVideo));
          this.videotexture = texture;
        }
      }
      if (this.properties.websurface_id) {
        this.replaceWebsurfaceMaterial();
        return;
      }
      if (this.properties.color !== this.defaultcolor) {
        color = this.properties.color;
      }
/*
      if (this.properties.col) {
        var col = this.properties.col;
        if (!col && modelasset && modelasset.col) {
          col = modelasset.col;
        }
        //color.setRGB(col.x, col.y, col.z);
      }
*/
      var srcfactors = {
        'src_alpha': THREE.SrcAlphaFactor,
        'zero': THREE.ZeroFactor,
        'one': THREE.OneFactor,
        'src_color': THREE.SrcColorFactor,
        'one_minus_src_color': THREE.OneMinusSrcColorFactor,
        'one_minus_src_alpha': THREE.OneMinusSrcAlphaFactor,
        'dst_color': THREE.DstColorFactor,
        'one_minus_dst_color': THREE.OneMinusDstColorFactor,
        'one_minus_dst_alpha': THREE.OneMinusDstAlphaFactor,
      }
      if (srcfactors[this.properties.blend_src]) {
        blend_src = srcfactors[this.properties.blend_src];
      }
      if (srcfactors[this.properties.blend_dest]) {
        blend_dest = srcfactors[this.properties.blend_dest];
      }
      var scene = this.engine.systems.world.scene['world-3d'];
      if (!this.hasalpha) this.hasalpha = {};
      var hasalpha = this.hasalpha;
      var remove = [];
      var cloneMaterial = true;//(texture !== false);
      this.objects['3d'].traverse(elation.bind(this, function(n) { 
        if (n.material) {
          var materials = [];
          if (n.material instanceof THREE.MeshFaceMaterial) {
            //materials = [n.material.materials[1]];
            for (var i = 0; i < n.material.materials.length; i++) {
              if (cloneMaterial) {
                var m = this.copyMaterial(n.material.materials[i]);
                materials.push(m); 
              } else {
                materials.push(n.material.materials[i]);
              }
            }
            if (cloneMaterial) {
              n.material = new THREE.MeshFaceMaterial(materials);
            } else {
              n.material.materials = materials;
            }
          } else {
            if (cloneMaterial) {
              var m = this.copyMaterial(n.material);
              materials.push(m); 
              n.material = m;
            } else {
              materials.push(n.material);
            }
          }

          for (var i = 0; i < materials.length; i++) {
            var m = materials[i];
            //m.envMap = scene.background;
            if (texture && texture.image) {
              m.map = texture; 
            } else if (m.map) {
              var imagesrc = m.map.sourceFile;
              var asset = this.getAsset('image', imagesrc);
              if (asset && asset.hasalpha) {
                m.transparent = true;
                m.alphaTest = 0.01;
              }
            }
            //m.roughness = 0.75;
            if (color) {
              m.color = color;
            }
            m.side = side;
            if (blend_src) m.blendSrc = blend_src;
            if (blend_dest) m.blendDst = blend_dest;
            m.blending = THREE.CustomBlending;
            m.needsUpdate = true;
          }
        } else if (n instanceof THREE.Light) {
          remove.push(n);
        }
      }));
      for (var i = 0; i < remove.length; i++) {
        remove[i].parent.remove(remove[i]);
      }
      this.refresh();
    }
    this.copyMaterial = function(oldmat) {
      if (oldmat instanceof THREE.MultiMaterial) {
        var materials = [];
        for (var i = 0; i < oldmat.materials.length; i++) {
          materials.push(this.copyMaterial(oldmat.materials[i]));
        }
        var m = new THREE.MultiMaterial(materials);
      } else {
        var m = (this.properties.lighting != false ? new THREE.MeshPhongMaterial() : new THREE.MeshBasicMaterial());
        //var m = new THREE.MeshBasicMaterial();
        m.anisotropy = 16;
        m.name = oldmat.name;
        m.map = oldmat.map;
        m.normalMap = oldmat.normalMap;
        m.lightMap = oldmat.lightMap;
        m.color.copy(oldmat.color);
        m.transparent = oldmat.transparent;
        m.alphaTest = oldmat.alphaTest;
      }

      return m;
    }
    this.pauseVideo = function() {
      if (this.videotexture) {
        var video = this.videotexture.image;
        if (video.currentTime > 0 && !video.paused && !video.ended) {
          video.pause();
        } else {
          video.play();
        }
      }
    }
    this.start = function() {
      if (this.image_id) {
        var textureasset = this.getAsset('image', this.image_id);
        if (textureasset) {
          var texture = textureasset.getInstance();
          //console.log('start the image!', texture);
        }
      }
      if (this.video_id) {
        var texture = elation.engine.assets.find('video', this.video_id);
        if (!texture.image.playing) {
          texture.image.play();
          //console.log('start the video!', texture);
        }
      }
      if (this.websurface_id) {
        if (!this.websurface) {
          this.websurface = this.spawn('januswebsurface', null, {janus: this.janus, room: this.room, websurface_id: this.websurface_id});
          elation.events.add(this, 'mouseover', elation.bind(this.websurface, this.websurface.hover));
          elation.events.add(this, 'mouseout', elation.bind(this.websurface, this.websurface.unhover));
        }
        this.websurface.start();
      }
    }
    this.stop = function() {
      if (this.image_id) {
        var texture = elation.engine.assets.find('image', this.image_id);
        console.log('stop the image!', texture);
      }
      if (this.video_id) {
        var texture = elation.engine.assets.find('video', this.video_id);
        texture.image.pause();
        console.log('stop the video!', texture);
      }
      if (this.websurface_id && this.websurface) {
        this.websurface.stop();
      }
    }
    this.getProxyObject = function() {
      var proxy = elation.engine.things.janusobject.extendclass.getProxyObject.call(this);
      proxy._proxydefs = {
        id:  [ 'property', 'janusid'],
        url:  [ 'property', 'url'],
        collider_id:  [ 'property', 'collider_id'],
        collider_scale:  [ 'property', 'collider_scale'],
        collision_id:  [ 'property', 'collision_id'],
        collision_static:  [ 'property', 'collision_static'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
