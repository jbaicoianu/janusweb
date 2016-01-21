elation.require(['engine.things.theaterscreen'], function() {
  elation.component.add('engine.things.janusvideo', function() {
    this.postinit = function() {
      elation.engine.things.janusvideo.extendclass.postinit.call(this);
      this.defineProperties({
        //src: { type: 'string' },
        loop: { type: 'boolean', default: false },
        color: { type: 'color', default: 0xffffff },
        lighting: { type: 'boolean', default: true },
      });
    }
    this.createObject3D = function() {
      var plane = new THREE.PlaneBufferGeometry(1,1);
      plane.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 0.1));

      if (!this.video) {
        this.createVideo();
      }

      this.texture = new THREE.Texture( this.video );
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
      this.texture.format = THREE.RGBFormat;
      this.texture.generateMipmaps = false;

      var matargs = {
        map: this.texture,
        color: this.properties.color,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
      };
      //plane.applyMatrix(new THREE.Matrix4().makeTranslation(.5,-.5,0));
      //var mat = new THREE.MeshBasicMaterial(matargs);
      var mat = (this.properties.lighting ? new THREE.MeshPhongMaterial(matargs) : new THREE.MeshBasicMaterial(matargs));
      var mesh = new THREE.Mesh(plane, mat);
      mesh.renderOrder = 2;
      return mesh;
    }
  }, elation.engine.things.theaterscreen);
});

