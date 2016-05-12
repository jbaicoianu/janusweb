elation.require(['engine.things.generic'], function() {
  elation.component.add('engine.things.januswebsurface', function() {
    this.postinit = function() {
      this.defineProperties({
        src: { type: 'string' },
        color: { type: 'color', default: 0xffffff },
      });
    }
    this.createObject3D = function() {
      var plane = new THREE.PlaneBufferGeometry(1,1);
      var matargs = {
        map: elation.engine.assets.find('image', this.properties.image_id),
        color: this.properties.color,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 0.1,
        transparent: true,
        side: THREE.DoubleSide
      };
      //plane.applyMatrix(new THREE.Matrix4().makeTranslation(.5,-.5,0));
      var mat = (this.properties.lighting ? new THREE.MeshPhongMaterial(matargs) : new THREE.MeshBasicMaterial(matargs));
      return new THREE.Mesh(plane, mat);
    }
    this.createObjectDOM = function() {
    }
  }, elation.engine.things.generic);
});

