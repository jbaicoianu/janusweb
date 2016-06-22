elation.require(['engine.things.generic', 'utils.template'], function() {
  elation.template.add('janusweb.edit.object', 
      '<Object id=^{id}^ js_id=^{js_id}^ locked=^false^ pos=^{pos.x} {pos.y} {pos.z}^ vel=^{vel.x} {vel.y} {vel.z}^ accel=^{accel.x} {accel.y} {accel.z}^ xdir=^{xdir}^ ydir=^{ydir}^ zdir=^{zdir}^ scale=^{scale.x} {scale.y} {scale.z}^ col=^{col}^ lighting=^{lighting}^ visible=^{visible}^ />');

  elation.component.add('engine.things.janusbase', function() {
    this.postinit = function() {
      elation.engine.things.janusbase.extendclass.postinit.call(this);
      this.defineProperties({
        js_id: { type: 'string' },
        room: { type: 'object' },
      });
    }
    this.setProperties = function(props) {
      var n = this.properties.room.parseNode(props);
      var rebuild = false;

      if (n.pos) this.properties.position.fromArray(n.pos);
      if (n.scale) this.properties.scale.fromArray(n.scale);
      if (n.orientation) this.properties.orientation.copy(n.orientation);
  
      if (n.id && n.id != this.properties.render.model) {
        this.properties.render.model = n.id;
        rebuild = true;
      }
      var curcol = this.properties.col;
      if (n.col && (n.col[0] != curcol[0] || n.col[1] != curcol[1] || n.col[2] != curcol[2])) {
        this.properties.col = n.col;
        rebuild = true;
      }
      if (rebuild) {
        this.set('visible', true, true);
      }
      if (n.accel) this.properties.acceleration.fromArray(n.accel.split(' ').map(parseFloat));
      if (n.vel) this.objects.dynamics.setVelocity(this.properties.velocity.fromArray(n.vel.split(' ').map(parseFloat)));
      this.refresh();
    } 
    this.summarizeXML = function() {
      //'<Object id=^{id}^ js_id=^{js_id}^ locked=^false^ pos=^{pos.x} {pos.y} {pos.z}^ vel=^{vel.x} {vel.y} {vel.z}^ accel=^{accel.x} {accel.y} {accel.z}^ xdir=^{xdir}^ ydir=^{ydir}^ zdir=^{zdir}^ scale=^{scale.x} {scale.y} {scale.z}^ col=^{color}^ lighting=^{lighting}^ visible=^{visible}^ />');

      var matrix = new THREE.Matrix4().makeRotationFromQuaternion(this.properties.orientation);
      var xdir = new THREE.Vector3(),
          ydir = new THREE.Vector3(),
          zdir = new THREE.Vector3();
      matrix.extractBasis(xdir, ydir, zdir);

      var objdef = {
        id: this.properties.render.model,
        js_id: this.properties.js_id,
        pos: this.properties.position,
        vel: this.properties.velocity,
        accel: this.properties.acceleration,
        scale: this.properties.scale,
        xdir: xdir.toArray().join(' '),
        ydir: ydir.toArray().join(' '),
        zdir: zdir.toArray().join(' '),
        col: this.properties.col,
        lighting: this.properties.lighting,
        visible: this.properties.visible,
      };

      var xml = elation.template.get('janusweb.edit.object', objdef);
      return xml;
    }
    this.getProxyObject = function() {
      return new elation.proxy(this, {
        id: ['property', 'properties.id'],
        js_id: ['property', 'properties.js_id'],
        pos: ['property', 'properties.position'],
        vel: ['property', 'properties.velocity'],
        scale: ['property', 'properties.scale'],
        col: ['property', 'properties.col'],
      });
    }
    this.start = function() {
    }    
    this.stop = function() {
    }    
  }, elation.engine.things.generic);
});
