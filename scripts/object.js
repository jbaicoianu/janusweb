elation.require(['engine.things.generic'], function() {
  elation.component.add('engine.things.janusobject', function() {
    this.sidemap = {
      'back': THREE.FrontSide,
      'front': THREE.BackSide,
      'none': THREE.DoubleSide
    };
    this.postinit = function() {
      this.defineProperties({
        room: { type: 'object' },
        image_id: { type: 'string' },
        video_id: { type: 'string' },
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
    }
    this.createChildren = function() {
      if (this.objects['3d'].userData.loaded) {
        this.assignTextures();
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
        var q = new THREE.Quaternion().setFromAxisAngle(axis, speed);
        var vel = new THREE.Euler().setFromQuaternion(q);
        this.objects.dynamics.setAngularVelocity(vel);
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
      var texture = false,
          color = false,
          blend_src = false,
          blend_dest = false,
          side = this.sidemap[this.properties.cull_face];

      if (this.properties.image_id) {
        texture = elation.engine.assets.find('image', this.properties.image_id);
      }
      if (this.properties.video_id) {
        var videoasset = elation.engine.assets.find('video', this.properties.video_id, true);
        if (videoasset) {
          texture = videoasset.getAsset();
          if (videoasset.sbs3d) {
            // TODO - to really support 3d video, we need to set offset based on which eye is being rendered
            texture.repeat.x = 0.5;
          }
          if (videoasset.auto_play) {
            texture.image.play();
          }
          elation.events.add(texture, 'videoframe', elation.bind(this, this.refresh));
        }
      }
      if (this.properties.col) {
        color = new THREE.Color();
        var col = this.properties.col;
        color.setRGB(col[0], col[1], col[2]);  
      }
      if (this.properties.blend_src == 'src_color') {
        blend_src = THREE.SrcColorFactor;
      }
      if (this.properties.blend_dest == 'one_minus_src_alpha') {
        blend_dest = THREE.OneMinusSrcAlphaFactor;
      } else if (this.properties.blend_dest == 'one_minus_constant_color') {
        blend_dest = THREE.OneMinusConstantColorFactor;
      }
      this.objects['3d'].traverse(elation.bind(this, function(n) { 
        if (n.material) {
          var materials = [];
          if (n.material instanceof THREE.MeshFaceMaterial) {
            //materials = [n.material.materials[1]];
            for (var i = 0; i < n.material.materials.length; i++) {
              var oldm = n.material.materials[i];
              //var m = (this.properties.lighting != false ? new THREE.MeshPhongMaterial() : new THREE.MeshBasicMaterial());
              //var m = new THREE.MeshPhongMaterial();
              var m = new THREE.MeshStandardMaterial();
              m.map = oldm.map;
              m.normalMap = oldm.normalMap;
              m.lightMap = oldm.lightMap;
              m.color.copy(oldm.color);
              m.transparent = oldm.transparent;
              materials.push(m); 
            }
            //materials = n.material.materials;
            n.material.materials = materials;
          } else {
              var oldm = n.material;
              //var m = (this.properties.lighting != false ? new THREE.MeshPhongMaterial() : new THREE.MeshBasicMaterial());
              var m = new THREE.MeshStandardMaterial();
              m.map = oldm.map;
              m.normalMap = oldm.normalMap;
              m.lightMap = oldm.lightMap;
              m.color.copy(oldm.color);
              m.transparent = oldm.transparent;
              materials.push(m); 
              n.material = m;
          }
          materials.forEach(elation.bind(this, function(m) {
            if (texture) {
              m.map = texture; 
            }
            // FIXME - hack for transparent PNGs
            if (m.map && m.map.sourceFile && m.map.sourceFile.match(/[^0-9]\.(png|tga)$/)) {
              m.transparent = true;
            }
            if (color && m.color) {
              m.color.copy(color);
            }
            if (side) {
              m.side = side;
            }
            if (blend_src) m.blendSrc = blend_src;
            if (blend_dest) m.blendDst = blend_dest;
            m.needsUpdate = true;
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
  }, elation.engine.things.generic);
});
