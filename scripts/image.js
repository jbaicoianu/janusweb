elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusimage', function() {
    this.postinit = function() {
      elation.engine.things.janusimage.extendclass.postinit.call(this);
      this.defineProperties({
        image_id: { type: 'string', set: this.setMaterialDirty },
        sbs3d: { type: 'boolean', default: false, set: this.setMaterialDirty },
        ou3d: { type: 'boolean', default: false, set: this.setMaterialDirty },
        reverse3d: { type: 'boolean', default: false, set: this.setMaterialDirty },
        onloadstart: { type: 'callback' },
        onloadprogress: { type: 'callback' },
        onload: { type: 'callback' },
      });
    }
    this.createObject3D = function() {
      var geo = this.createGeometry();
      var mat = this.createMaterial();
      var mesh = new THREE.Mesh(geo, mat);

      if (this.texture && this.texture instanceof THREE.SBSTexture) {
        mesh.onBeforeRender = (renderer, scene, camera) => {
          if (camera.name) {
            this.texture.setEye(camera.name);
          }
        }
      }
/*
        var geo = this.createGeometry();
        var mat = this.createMaterial();
        return new THREE.Mesh(geo, mat);
      } else {
        console.log('ERROR - could not find image ' + this.properties.image_id);
      }
*/
      return mesh;
    }
    this.createGeometry = function() {
      var aspect = this.getAspect(),
          thickness = 0.1; //Math.max(this.scale.x, this.scale.z) / (10 * this.scale.z);
      var box = new THREE.BoxBufferGeometry(2, 2 * aspect, thickness);
      box.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, thickness / this.scale.z));

      // Flip the back face for images
      var uvs = box.attributes.uv;
      var start = 20,
          count = 4;
      for (var i = start; i < start + count; i++) {
        uvs.array[i*2] = 1.0 - uvs.array[i*2];
      }

      return box;
    }
    this.createMaterial = function() {
      var matargs = {
        color: this.properties.color,
        transparent: (this.opacity < 1),
        opacity: this.opacity,
        alphaTest: 0.2
      };

      this.asset = this.getAsset('image', this.image_id);
      if (this.asset) {
        this.texture = this.asset.getInstance();
        if (this.texture) {
          this.dispatchEvent({type: 'loadstart'});
          elation.events.add(this.asset, 'asset_load_progress', (ev) => { this.dispatchEvent({type: 'loadprogress', data: ev.data}); });
          elation.events.add(this.texture, 'asset_load', elation.bind(this, this.imageloaded));
          elation.events.add(this.texture, 'update', elation.bind(this, this.refresh));

          matargs.transparent = this.asset.hasalpha;
        } 
      }
      if (this.texture) {
        var sidemattex = this.texture.clone();
        this.sidetex = sidemattex;
        sidemattex.repeat.x = .0001;
        matargs.map = this.texture;
      }
      var sidematargs = {
        map: sidemattex,
        color: this.properties.color,
        transparent: matargs.transparent,
        opacity: matargs.opacity,
        alphaTest: 0.2
      };

      var mat = (this.properties.lighting ? new THREE.MeshPhongMaterial(matargs) : new THREE.MeshBasicMaterial(matargs));
      var sidemat = (this.properties.lighting ? new THREE.MeshPhongMaterial(sidematargs) : new THREE.MeshBasicMaterial(sidematargs));
      var facemat = [sidemat,sidemat,sidemat,sidemat,mat,mat];
      this.facematerial = facemat;
      this.frontmaterial = mat;
      this.sidematerial = sidemat;
      if (this.texture) {
        // Update diffuse map whenever the asset updates (gif frames, etc)
        elation.events.add(this.texture, 'asset_update', elation.bind(this, function(ev) { this.frontmaterial.map = ev.data; }));
      }
      return facemat;
    }
    this.setMaterialDirty = function() {
      this.materialNeedsUpdate = true;
    }
    this.handleFrameUpdates = function(ev) {
      elation.engine.things.janusobject.extendclass.handleFrameUpdates.call(this, ev);
      if (this.materialNeedsUpdate) {
        this.updateMaterial();
      }
    }
    this.updateMaterial = function() {
      this.asset = this.getAsset('image', this.image_id, true);
      this.materialNeedsUpdate = false;
      var newtexture = false;
      if (this.asset) {
        newtexture = this.asset.getInstance();
      }
      if (newtexture && newtexture !== this.texture) {
        this.texture = newtexture;
        if (newtexture.image) {
          this.imageloaded();
        } else {
          elation.events.add(this.texture, 'asset_load', elation.bind(this, this.imageloaded));
        }
        elation.events.add(this.texture, 'asset_update', elation.bind(this, function(ev) { this.frontmaterial.map = ev.data; }));
      } 
    }
    this.getAspect = function() {
      var aspect = 1;
      if (this.asset && this.asset.rawimage) {
        var size = this.getSize(this.asset.rawimage);
        aspect = size.height / size.width;
      }
      if (this.sbs3d || (this.asset && this.asset.sbs3d)) aspect *= 2;
      if (this.ou3d || (this.asset && this.asset.ou3d)) aspect /= 2;
      return aspect;
    }
    this.getSize = function(image) {
      return {width: image.width, height: image.height};
    }
    this.adjustAspectRatio = function() {
      var img = this.texture.image;
      var geo = this.createGeometry();
      geo.computeBoundingBox();
      if (this.colliders.children[0]) {
        this.colliders.children[0].geometry = geo;
      }
      this.objects['3d'].geometry = geo;
    }
    this.imageloaded = function(ev) {
      if (!this.frontmaterial) return;

      this.frontmaterial.map = this.texture;
      this.frontmaterial.needsUpdate = true;
      this.adjustAspectRatio();
      setTimeout(() => {
        this.adjustAspectRatio();
      }, 0);
      this.sidetex.image = this.texture.image;
      this.sidetex.needsUpdate = true;

      if (this.properties.sbs3d || this.asset.sbs3d) {
        // TODO - to really support 3d video, we need to set offset based on which eye is being rendered
        var texture = new THREE.SBSTexture(this.texture.image);
        texture.reverse = this.properties.reverse3d || this.asset.reverse3d;
        texture.needsUpdate = true;
        this.texture = texture;
        this.frontmaterial.map = texture;
        /*
        this.sidematerial.map = texture.clone();
        this.sidematerial.map.needsUpdate = true;
        this.sidematerial.map.repeat.x = .0001;
        */
        //this.objects['3d'].onBeforeRender = () => { texture.swap(); }
      }

      this.dispatchEvent({type: 'load'});
      this.refresh();
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusimage.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          id:  [ 'property', 'image_id'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusbase);
});
