elation.require([], function() {

  elation.extend('janusweb.parts', class {
    constructor(object) {
      this._object = object;
      this._parts = {};
      this._proxies = {};
      //this.updateParts();
    }
    definePart(name, part) {
      Object.defineProperty(this, name, {
        get: () => this.getPartByName(name),
        enumerable: true,
        configurable: true
      });
    }
    updateParts() {
      this._object.extractEntities();
      var obj = this._object._target || this._object;
      var parts = obj.parts;
      for (var k in parts) {
        this.definePart(k, parts[k]);
      }
    }
    getPartForObject(object) {
      let name = object.name || object.uuid;
      if (!this._proxies[name]) {
        var rootobject = this._object._target || this._object;
//console.log('replace the part', name, part.rotation, part.parent, part);
        this._parts[name] = elation.engine.things.janusobject({
          type: 'janusobject',
          id: rootobject.id + '_parts_' + name,
          name: name,
          contaner: elation.html.create(),
          engine: this._object.engine,
          properties: {
            object: object,
            rotation: [object.rotation.x * THREE.Math.RAD2DEG, object.rotation.y * THREE.Math.RAD2DEG, object.rotation.z * THREE.Math.RAD2DEG], 
            room: rootobject.room
          }
        });
        // TODO - set up object hierarchy here
        this._proxies[name] = this._parts[name].getProxyObject();
        this._proxies[name].start();
      }
      return this._proxies[name];
    }
    getPartByName(name) {
      if (!this._proxies[name]) {
        var obj = this._object._target || this._object;
        var part = obj.parts[name];
        if (part) {
          return this.getPartForObject(part);
        }
      }
      return this._proxies[name];
    }
  })
});

