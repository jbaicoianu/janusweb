elation.require(['engine.things.label'], function() {
  elation.component.add('engine.things.janustext', function() {
    this.postinit = function() {
      elation.engine.things.janustext.extendclass.postinit.call(this);
      this.defineProperties({
        room: { type: 'object' },
        color: { type: 'color', default: 0xffffff },
        lighting: { type: 'boolean', default: true },
      });
      this.properties.size = 1;
      this.properties.thickness = .11;
      this.properties.align = 'center';
    }
    this.createObject3D = function() {
      var text = this.properties.text || this.name;
      var geometry = this.createTextGeometry(text);

      geometry.computeBoundingBox();

      var geosize = new THREE.Vector3().subVectors(geometry.boundingBox.max, geometry.boundingBox.min);
      var geoscale = 1 / geosize.x;
      geometry.applyMatrix(new THREE.Matrix4().makeScale(geoscale, geoscale, geoscale));

      this.material = new THREE.MeshPhongMaterial({color: this.properties.color, emissive: this.properties.emissive, shading: THREE.SmoothShading, depthTest: this.properties.depthTest});

      if (this.properties.opacity < 1.0) {
        this.material.opacity = this.properties.opacity;
        this.material.transparent = true;
      }
      var mesh = new THREE.Mesh(geometry, this.material);
      
      return mesh;
    }
  }, elation.engine.things.label);
});
