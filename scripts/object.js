elation.require(['janusweb.janusbase'], function() {
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
        loop: { type: 'boolean' },
        collision_id: { type: 'string' },
        websurface_id: { type: 'string', set: this.updateMaterial },
        lighting: { type: 'boolean', default: true, set: this.updateMaterial },
        cull_face: { type: 'string', default: 'back', set: this.updateMaterial },
        blend_src: { type: 'string', default: 'src_alpha', set: this.updateMaterial },
        blend_dest: { type: 'string', default: 'one_minus_src_alpha', set: this.updateMaterial },
      });
      //elation.events.add(this, 'thing_init3d', elation.bind(this, this.assignTextures));
    }
    this.createObject3D = function() {
      if (this.properties.exists === false) return;

      var object = null, geometry = null, material = null;
      if (this.janusid) {
        object = elation.engine.assets.find('model', this.janusid);
        if (object.userData.loaded) {
          this.assignTextures();
        } else {
          elation.events.add(object, 'asset_load', elation.bind(this, this.assignTextures));
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

      if (this.collision_id) {
        this.collidable = true;
        if (this.collision_id == 'sphere') {
          this.setCollider('sphere', {radius: Math.max(this.scale.x, this.scale.y, this.scale.z)});
        } else if (this.collision_id == 'cube') {
          var halfsize = this.properties.scale.clone().multiplyScalar(.5);
          this.setCollider('box', {min: halfsize.clone().negate(), max: halfsize});
        } else if (this.collision_id == 'plane') {
          var halfsize = this.properties.scale.clone().multiplyScalar(.5);
          this.setCollider('box', {min: halfsize.clone().negate(), max: halfsize});
        } else if (this.collision_id == 'cylinder') {
          this.setCollider('cylinder', {height: this.scale.y, radius: Math.max(this.scale.x, this.scale.z) / 2, offset: new THREE.Vector3(0, 0.5 * this.scale.y, 0)});
        } else {
          var collider = elation.engine.assets.find('model', this.collision_id);
          this.collidermesh = collider;
          if (collider.userData.loaded) {
            //this.extractColliders(collider, true);
            collider.userData.thing = this;
            this.colliders.add(collider);
          } else {
            elation.events.add(collider, 'asset_load', elation.bind(this, function(ev) {  
              collider.userData.thing = this;
              //this.extractColliders(collider, true);

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
    this.createObjectDOM = function() {
      return;
      if (this.properties.websurface_id) {
        var websurface = this.properties.room.websurfaces[this.properties.websurface_id];
        console.log('do a websurface: ' + this.properties.websurface_id, websurface);
        if (websurface) {
          var width = websurface.width || 1024,
              height = websurface.height || 768;

          var iframe = elation.html.create('iframe');
          iframe.src = 'http://www.github.com/';//websurface.src;
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
    }
    this.updateMaterial = function() {
      this.assignTextures();
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
        modelasset = elation.engine.assets.find('model', this.janusid, true);
      }
      if (this.properties.image_id) {
        texture = elation.engine.assets.find('image', this.image_id);
        if (!texture) {
          var asset = { assettype:'image', name:this.image_id, src: this.image_id, baseurl: this.baseurl }; 
          elation.engine.assets.loadJSON([asset], this.baseurl); 
          texture = elation.engine.assets.find('image', this.image_id);
        }
        elation.events.add(texture, 'asset_load', elation.bind(this, this.assignTextures));
        elation.events.add(texture, 'update', elation.bind(this, this.refresh));
      }
      if (this.properties.video_id) {
        var videoasset = elation.engine.assets.find('video', this.properties.video_id, true);
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
      color = this.properties.color;
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
      var cloneMaterial = false;
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
            n.material.materials = materials;
          } else {
/*
            var m = this.copyMaterial(n.material);
            materials.push(m); 
            n.material = m;
*/
            materials.push(n.material);
          }

          for (var i = 0; i < materials.length; i++) {
            var m = materials[i];
            //m.envMap = scene.background;
            if (texture && texture.image) {
              m.map = texture; 
            }
            if (m.map && m.map.image) {
/*
              if (m.map.image instanceof HTMLCanvasElement) {
                // FIXME - don't think this works
                //hasalpha[m.map.image.src] = this.canvasHasAlpha(m.map.image);
                if (hasalpha[m.map.image.src]) {
                  m.transparent = true;
                  m.alphaTest = 0.01;
                  m.needsUpdate = true;
                }
              } else if (m.map.image.src && m.map.image.src.match(/\.(png|tga)$/)) {
                // If the image is a PNG, check to see if it's got an alpha channel
                // If it does, set the proper material parameters
                elation.events.add(m.map.image, 'load', elation.bind(this, function(ev) {
                  if (typeof hasalpha[ev.target.src] == 'undefined') {
                    var canvas = document.createElement('canvas');
                    canvas.width = m.map.image.width;
                    canvas.height = m.map.image.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(m.map.image, 0, 0);

                    //hasalpha[ev.target.src] = this.canvasHasAlpha(canvas);
                    m.map.image = canvas;
                  }
                  if (hasalpha[ev.target.src]) {
                    m.transparent = true;
                    m.alphaTest = 0.01;
                    m.needsUpdate = true;
                  }
                }));
              }
*/
            }
            //m.roughness = 0.75;
            if (color) {
              m.color = color;
            }
            if (side) {
              m.side = side;
            }
            if (blend_src) m.blendSrc = blend_src;
            if (blend_dest) m.blendDst = blend_dest;
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
      //var m = (this.properties.lighting != false || oldmat.lightMap ? new THREE.MeshPhongMaterial() : new THREE.MeshBasicMaterial());
      var m = new THREE.MeshPhongMaterial();
      m.anisotropy = 16;
      m.name = oldmat.name;
      m.map = oldmat.map;
      m.normalMap = oldmat.normalMap;
      m.lightMap = oldmat.lightMap;
      m.color.copy(oldmat.color);
      m.transparent = oldmat.transparent;
      m.alphaTest = oldmat.alphaTest;

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
      if (this.properties.image_id) {
        var texture = elation.engine.assets.find('image', this.properties.image_id);
        console.log('start the image!', texture);
      }
      if (this.properties.video_id) {
        var texture = elation.engine.assets.find('video', this.properties.video_id);
        if (!texture.image.playing) {
          texture.image.play();
          console.log('start the video!', texture);
        }
      }
    }
    this.stop = function() {
      if (this.properties.image_id) {
        var texture = elation.engine.assets.find('image', this.properties.image_id);
        console.log('stop the image!', texture);
      }
      if (this.properties.video_id) {
        var texture = elation.engine.assets.find('video', this.properties.video_id);
        texture.image.pause();
        console.log('stop the video!', texture);
      }
    }
    this.getProxyObject = function() {
      var proxy = elation.engine.things.janusobject.extendclass.getProxyObject.call(this);
      proxy._proxydefs = {
        id:  [ 'property', 'janusid'],
        collision_id:  [ 'property', 'collision_id'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
