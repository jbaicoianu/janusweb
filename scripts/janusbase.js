elation.require(['engine.things.generic', 'utils.template'], function() {
  elation.template.add('janusweb.edit.object', 
      '<Object id=^{id}^ js_id=^{js_id}^ locked=^false^ pos=^{pos.x} {pos.y} {pos.z}^ vel=^{vel.x} {vel.y} {vel.z}^ accel=^{accel.x} {accel.y} {accel.z}^ xdir=^{xdir}^ ydir=^{ydir}^ zdir=^{zdir}^ scale=^{scale.x} {scale.y} {scale.z}^ col=^{col}^ lighting=^{lighting}^ visible=^{visible}^ />');

  elation.component.add('engine.things.janusbase', function() {
    this.postinit = function() {
      elation.engine.things.janusbase.extendclass.postinit.call(this);
      this.frameupdates = [];
      this.defineProperties({
        room:     { type: 'object' },
        janus:    { type: 'object' },
        js_id:    { type: 'string' },
        color:    { type: 'color', default: new THREE.Color(0xffffff), set: this.updateMaterial },
        fwd:      { type: 'vector3', default: new THREE.Vector3(0,0,1), set: this.pushFrameUpdate },
        xdir:     { type: 'vector3', default: new THREE.Vector3(1,0,0), set: this.pushFrameUpdate },
        ydir:     { type: 'vector3', default: new THREE.Vector3(0,1,0), set: this.pushFrameUpdate },
        zdir:     { type: 'vector3', default: new THREE.Vector3(0,0,1), set: this.pushFrameUpdate },
        lighting: { type: 'boolean', default: true },
        sync:     { type: 'boolean', default: false },
        rotate_axis: { type: 'string', default: '0 1 0' },
        rotate_deg_per_sec: { type: 'string' },
      });
      //if (this.col) this.color = this.col;
      this.jschildren = [];
      elation.events.add(this.room, 'janusweb_script_frame_end', elation.bind(this, this.handleFrameUpdates));
    }
    this.createForces = function() {
      elation.events.add(this.objects.dynamics, 'physics_collide', elation.bind(this, this.handleCollision));

      var rotate_axis = this.properties.rotate_axis,
          rotate_speed = this.properties.rotate_deg_per_sec;
      if (rotate_axis && rotate_speed) {
        var speed = (rotate_speed * Math.PI/180);
        var axisparts = rotate_axis.split(' ');
        var axis = new THREE.Vector3().set(axisparts[0], axisparts[1], axisparts[2]);
        axis.multiplyScalar(speed);
        this.objects.dynamics.setAngularVelocity(axis);
      }

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
      var curcol = this.properties.col || [1,1,1];
      if (n.col && (n.col[0] != curcol[0] || n.col[1] != curcol[1] || n.col[2] != curcol[2])) {
        this.properties.col = n.col;
        rebuild = true;
      }
      if (rebuild) {
        //this.set('visible', true, true);
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
        col: this.properties.color,
        lighting: this.properties.lighting,
        visible: this.properties.visible,
      };

      var xml = elation.template.get('janusweb.edit.object', objdef);
      return xml;
    }
    this.getProxyObject = function() {
      if (!this._proxyobject) {
        this._proxyobject = new elation.proxy(this, {
          js_id:    ['property', 'properties.js_id'],
          pos:      ['property', 'position'],
          vel:      ['property', 'velocity'],
          accel:    ['property', 'acceleration'],
          mass:     ['property', 'mass'],
          scale:    ['property', 'scale'],
          col:      ['property', 'color'],
          fwd:      ['property', 'zdir'],
          xdir:     ['property', 'xdir'],
          ydir:     ['property', 'ydir'],
          zdir:     ['property', 'zdir'],
          sync:     ['property', 'sync'],
          children: ['property', 'jschildren'],

          oncollision: ['callback', 'collision'],
          appendChild: ['function', 'appendChild']
        });
      }
      return this._proxyobject;
    }
    this.start = function() {
    }    
    this.stop = function() {
    }    
    this.pushFrameUpdate = function(key, value) {
//console.log('frame update!', key, value);
      this.frameupdates[key] = value;
    }
    this.handleFrameUpdates = function() {
      var updatenames = Object.keys(this.frameupdates);
      if (updatenames.length > 0) {
        var updates = this.frameupdates;
        if ('fwd' in updates) {
          this.properties.zdir.copy(this.fwd);
          updates.zdir = this.properties.zdir;
        }
        var xdir = this.properties.xdir,
            ydir = this.properties.ydir,
            zdir = this.properties.zdir;

        if ( ('xdir' in updates) && 
            !('ydir' in updates) && 
            !('zdir' in updates)) {
          zdir.crossVectors(xdir, ydir);
          this.updateVectors(true);
        } 
        if (!('xdir' in updates) && 
            !('ydir' in updates) && 
             ('zdir' in updates)) {
          xdir.crossVectors(ydir, zdir);
          this.updateVectors(true);
        } 
        if (!('xdir' in updates) && 
             ('ydir' in updates) && 
             ('zdir' in updates)) {
          xdir.crossVectors(zdir, ydir);
          this.updateVectors(true);
        } 
        if ( ('xdir' in updates) && 
            !('ydir' in updates) && 
             ('zdir' in updates)) {
          ydir.crossVectors(xdir, zdir).multiplyScalar(-1);
          this.updateVectors(true);
        } 
        if ( ('xdir' in updates) && 
             ('ydir' in updates) && 
            !('zdir' in updates)) {
          zdir.crossVectors(xdir, ydir);
          this.updateVectors(true);
        } 

        if (!('xdir' in updates) && 
            !('ydir' in updates) && 
            !('zdir' in updates)) {
          // None specified, so update the vectors from the orientation quaternion
          this.updateVectors(false);
        }
        this.frameupdates = {};
      } else {
        this.updateVectors(false);
      }
    }
    this.updateVectors = function(updateOrientation) {
      if (updateOrientation) {
        //var quat = this.room.getOrientation(this.properties.xdir.toArray().join(' '), this.properties.ydir.toArray().join(' '), this.properties.zdir.toArray().join(' '));
        //this.xdir.normalize();
        //this.ydir.normalize();
        //this.zdir.normalize();
        var mat4 = new THREE.Matrix4();
        mat4.makeBasis(this.xdir, this.ydir, this.properties.zdir);
/*
        mat4.set(
          this.xdir.x, this.xdir.y, this.xdir.z, 0,
          this.ydir.x, this.ydir.y, this.ydir.z, 0,
          this.zdir.x, this.zdir.y, this.zdir.z, 0,
          0, 0, 0, 1
        );
*/

        var quat = new THREE.Quaternion();
        var pos = new THREE.Vector3();
        var scale = new THREE.Vector3();
        quat.setFromRotationMatrix(mat4);
        //mat4.decompose(pos, this.orientation, scale);
        //this.orientation.normalize();
//console.log(mat4.elements);
        this.properties.orientation.copy(quat);
//console.log(this.xdir.toArray(), this.ydir.toArray(), this.zdir.toArray(), this.orientation.toArray());
//console.log(this.properties.orientation, this.properties.orientation.toArray());
      } else if (this.objects['3d']) {
        //this.objects['3d'].matrix.extractBasis(this.properties.xdir, this.properties.ydir, this.properties.zdir);
      }
    }
    this.appendChild = function(obj) {
      var proxyobj = obj
      if (elation.utils.isString(obj)) {
        proxyobj = this.room.jsobjects[obj];
      }
      if (proxyobj) {
        //var realobj = this.room.getObjectFromProxy(proxyobj);
        var realobj = proxyobj._target;
        if (realobj) {
          this.add(realobj);
          this.updateScriptChildren();
        }
      }
    }
    this.removeChild = function(obj) {
      var proxyobj = obj
      if (elation.utils.isString(obj)) {
        proxyobj = this.room.jsobjects[obj];
      }
      if (proxyobj) {
        //var realobj = this.room.getObjectFromProxy(proxyobj);
        var realobj = proxyobj._target;
        if (realobj) {
          this.remove(realobj);
          this.updateScriptChildren();
        }
      }
    }
    this.updateScriptChildren = function() {
      this.jschildren = [];
      var keys = Object.keys(this.children);
      for (var i = 0; i < keys.length; i++) {
        this.jschildren.push(this.children[keys[i]].getProxyObject());
      }
    }
    this.handleCollision = function(ev) {
      var obj1 = ev.data.bodies[0],
          obj2 = ev.data.bodies[1];
      //var proxy1 = obj1.getProxy(),
      //    proxy2 = obj2.getProxy();
      var other = (obj1.object == this ? obj2.object : obj1.object);
      if (other) {
        if (other.getProxyObject) {
          var proxy = other.getProxyObject();
          //console.log('I collided', proxy, this);
          elation.events.fire({type: 'collision', element: this, data: proxy});
        } else {
console.error('dunno what this is', other);
        }
      }
    }
  }, elation.engine.things.generic);
});
