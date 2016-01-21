elation.require(['engine.things.generic'], function() {
  elation.component.add('engine.things.janusimage', function() {
    this.postinit = function() {
      this.defineProperties({
        image_id: { type: 'string' },
        color: { type: 'color', default: 0xffffff },
        lighting: { type: 'boolean', default: true },
      });
    }
    this.createObject3D = function() {
      this.texture = elation.engine.assets.find('image', this.properties.image_id);
      if (this.texture) {
        
        elation.events.add(this.texture, 'asset_load', elation.bind(this, this.imageloaded));

        var geo = this.createGeometry();
        var mat = this.createMaterial();
        return new THREE.Mesh(geo, mat);
      } else {
        console.log('ERROR - could not find image ' + this.properties.image_id);
      }
    }
    this.createGeometry = function() {
      var aspect = 1,
          thickness = .1;
      if (this.texture && this.texture.image) {
        aspect = this.texture.image.height / this.texture.image.width;
      }
      var box = new THREE.BoxGeometry(2, 2 * aspect, thickness);
      box.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, thickness / 2));
      return box;
    }
    this.createMaterial = function() {
      var matargs = {
        map: this.texture,
        color: this.properties.color,
        transparent: true,
      };
      var sidemattex = this.texture.clone();
      this.sidetex = sidemattex;
      sidemattex.repeat.x = .0001;
      var sidematargs = {
        map: sidemattex,
        color: this.properties.color,
        transparent: true
      };

      var mat = (this.properties.lighting ? new THREE.MeshPhongMaterial(matargs) : new THREE.MeshBasicMaterial(matargs));
      var sidemat = (this.properties.lighting ? new THREE.MeshPhongMaterial(sidematargs) : new THREE.MeshBasicMaterial(sidematargs));
      var facemat = new THREE.MeshFaceMaterial([sidemat,sidemat,sidemat,sidemat,mat,mat]);
      return facemat;
    }
    this.adjustAspectRatio = function() {
      var img = this.texture.image;
      var geo = this.createGeometry();
      this.objects['3d'].geometry = geo;
    }
    this.imageloaded = function(ev) {
      this.adjustAspectRatio();
      this.sidetex.image = this.texture.image;
      this.sidetex.needsUpdate = true;
      this.refresh();
    }
  }, elation.engine.things.generic);
});
