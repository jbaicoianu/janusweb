elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusparagraph', function() {
    this.postinit = function() {
      elation.engine.things.janusparagraph.extendclass.postinit.call(this);
console.log('new paragraph', this);
    }
    this.createObject3D = function() {
      return new THREE.Mesh(new THREE.CubeGeometry(1,1,1), new THREE.MeshPhongMaterial({color: 0x000ff0}));
    }
  }, elation.engine.things.janusbase);
});
