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
        room: { type: 'object' },
        image_id: { type: 'string' },
        video_id: { type: 'string' },
        loop: { type: 'boolean' },
        collision_id: { type: 'string' },
        websurface_id: { type: 'string' },
        lighting: { type: 'boolean', default: true },
        col: { type: 'string' },
        cull_face: { type: 'string', default: 'back' },
        blend_src: { type: 'string', default: 'src_alpha' },
        blend_dest: { type: 'string', default: 'one_minus_src_alpha' },
        rotate_axis: { type: 'string', default: '0 1 0' },
        rotate_deg_per_sec: { type: 'string' },
        props: { type: 'object' },
      });
      elation.events.add(this, 'thing_init3d', elation.bind(this, this.assignTextures));
    }
    this.createChildren = function() {
      if (this.objects['3d'].userData.loaded) {
        //this.assignTextures();
      } else {
        elation.events.add(this.objects['3d'], 'asset_load', elation.bind(this, this.assignTextures));
      }
    }
    this.createForces = function() {
      var rotate_axis = this.properties.rotate_axis,
          rotate_speed = this.properties.rotate_deg_per_sec;
      if (rotate_axis && rotate_speed) {
        var speed = (rotate_speed * Math.PI/180);
        var axisparts = rotate_axis.split(' ');
        var axis = new THREE.Vector3().set(axisparts[0], axisparts[1], axisparts[2]);
        axis.multiplyScalar(speed);
        this.objects.dynamics.setAngularVelocity(axis);
      }

      if (this.properties.collision_id) {
        var collider = elation.engine.assets.find('model', this.properties.collision_id);
        if (collider.userData.loaded) {
          this.extractColliders(collider, true);
        } else {
          elation.events.add(collider, 'asset_load', elation.bind(this, function(ev) { this.extractColliders(collider, true); }) );
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
    this.assignTextures = function() {
console.log('assign textures', this.name, this);
      var modelasset = false,
          texture = false,
          color = false,
          blend_src = false,
          blend_dest = false,
          side = this.sidemap[this.properties.cull_face];

      if (this.properties.render.model) {
        modelasset = elation.engine.assets.find('model', this.properties.render.model, true);
      }
      if (this.properties.image_id) {
        texture = elation.engine.assets.find('image', this.properties.image_id);
        elation.events.add(texture, 'asset_load', elation.bind(this, this.assignTextures));
      }
      if (this.properties.video_id) {
        var videoasset = elation.engine.assets.find('video', this.properties.video_id, true);
        if (videoasset) {
          texture = videoasset.getAsset();
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
      if (this.properties.col) {
        color = new THREE.Color();
        var col = this.properties.col;
        if (!col && modelasset && modelasset.col) {
          col = modelasset.col;
        }
        color.setRGB(col[0], col[1], col[2]);  
      }
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

      var hasalpha = {};
      this.objects['3d'].traverse(elation.bind(this, function(n) { 
        if (n.material) {
          var materials = [];
          if (n.material instanceof THREE.MeshFaceMaterial) {
            //materials = [n.material.materials[1]];
            for (var i = 0; i < n.material.materials.length; i++) {
              var m = this.copyMaterial(n.material.materials[i]);
              materials.push(m); 
            }
            n.material.materials = materials;
          } else {
            var m = this.copyMaterial(n.material);
            materials.push(m); 
            n.material = m;
          }
          materials.forEach(elation.bind(this, function(m) {
            if (texture) {
              m.map = texture; 
            }
            if (m.map && m.map.image) {
              if (m.map.image instanceof HTMLCanvasElement) {
console.log('go canvas');
                // FIXME - don't think this works
                hasalpha[m.map.image.src] = this.canvasHasAlpha(m.map.image);
                if (hasalpha[m.map.image.src]) {
                  m.transparent = true;
                  m.alphaTest = 0.1;
                  m.needsUpdate = true;
                }
              } else if (m.map.image.src && m.map.image.src.match(/\.(png|tga)$/)) {
                // If the image is a PNG, check to see if it's got an alpha channel
                // If it does, set the proper material parameters
                elation.events.add(m.map.image, 'load', elation.bind(this, function(ev) {
                  if (typeof hasalpha[ev.target.src] == 'undefined') {
    console.log('CHECK IT?', m.map.image.src);
                    var canvas = document.createElement('canvas');
                    canvas.width = m.map.image.width;
                    canvas.height = m.map.image.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(m.map.image, 0, 0);

                    hasalpha[ev.target.src] = this.canvasHasAlpha(canvas);
                    m.map.image = canvas;
                  }
    //console.log(m.map, this, ev.target.src + '? ', hasalpha);
                  if (hasalpha[ev.target.src]) {
                    m.transparent = true;
                    m.alphaTest = 0.1;
                    m.needsUpdate = true;
                  }
                }));
              }
            }
            m.roughness = 0.75;
            if (color && m.color) {
              m.color.copy(color);
            }
            if (side) {
              m.side = side;
            }
            if (blend_src) m.blendSrc = blend_src;
            if (blend_dest) m.blendDst = blend_dest;
            //m.needsUpdate = true;
          }));
          if (n.geometry) {
/*
            if ((n.geometry instanceof THREE.BufferGeometry && !n.geometry.attributes.normals) ||
                (n.geometry instanceof THREE.Geometry && !n.geometry.faceVertexNormals)) {
              n.geometry.computeFaceNormals();
              n.geometry.computeVertexNormals();
            }
*/
          }
        };
      }));
      this.refresh();
    }
    this.copyMaterial = function(oldmat) {
      var m = (this.properties.lighting != false || oldmat.lightMap ? new THREE.MeshPhongMaterial() : new THREE.MeshBasicMaterial());
      m.map = oldmat.map;
      m.normalMap = oldmat.normalMap;
      m.lightMap = oldmat.lightMap;
      m.color.copy(oldmat.color);
      m.transparent = oldmat.transparent;

      return m;
    }
    this.canvasHasAlpha = function(canvas) {
      var ctx = canvas.getContext('2d');
      var pixeldata = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var hasalpha = false;
      for (var i = 3; i < pixeldata.data.length; i+=4) {
        if (pixeldata.data[i] != 255) {
          return true;
        }
      }
      return false;
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
  }, elation.engine.things.janusbase);
});
