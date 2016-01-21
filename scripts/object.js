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
        websurface_id: { type: 'string' },
        lighting: { type: 'boolean', default: true },
        col: { type: 'string' },
        cull_face: { type: 'string', default: 'back' },
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
          var div = elation.html.create('div');
          div.className = 'janusweb_websurface state_uninitialized';
          //div.appendChild(iframe);

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
      var image = false,
          color = false,
          side = this.sidemap[this.properties.cull_face];

      side = THREE.DoubleSide;
      if (this.properties.image_id) {
        image = elation.engine.assets.find('image', this.properties.image_id);
      }
      if (this.properties.video_id) {
        image = elation.engine.assets.find('video', this.properties.video_id);
      }
      if (this.properties.col) {
        color = new THREE.Color();
        if (this.properties.col[0] == '#') {
          color = color.setHex(parseInt(this.properties.col.substr(1), 16));  
        } else {
          var col = this.properties.col.split(' ');
          color = color.setRGB(col[0], col[1], col[2]);  
        } 
      }
      this.objects['3d'].traverse(function(n) { 
        if (n.material) {
          if (image) {
            n.material.map = image; 
          }
          if (color && n.material.color) {
            n.material.color.copy(color);
          }
          if (side) {
            n.material.side = side;
          }
          if (n.geometry) {
/*
            if ((n.geometry instanceof THREE.BufferGeometry && !n.geometry.attributes.normals) ||
                (n.geometry instanceof THREE.Geometry && !n.geometry.faceVertexNormals)) {
              n.geometry.computeFaceNormals();
              n.geometry.computeVertexNormals();
            }
*/
          }
        }
      });
      this.refresh();
    }
  }, elation.engine.things.generic);
});
