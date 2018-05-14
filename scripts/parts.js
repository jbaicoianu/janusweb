elation.require([], function() {

  elation.extend('janusweb.parts', class {
    constructor(object) {
      this._object = object;
      this._parts = {};
      this._proxies = {};
      console.log('new shit', object);
      //this.updateParts();
    }
    definePart(name, part) {
      console.log('had a part', name, part);
      Object.defineProperty(this, name, {
        get: () => this.getPart(name),
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
    getPart(name) {
      if (!this._proxies[name]) {
        var obj = this._object._target || this._object;
        var part = obj.parts[name];
        this._parts[name] = elation.engine.things.janusbase({
          type: 'janusbase',
          name: name,
          contaner: elation.html.create(),
          engine: this._object.engine,
          properties: {
            object: part
          }
        });
        // TODO - set up object hierarchy here
        this._proxies[name] = this._parts[name].getProxyObject();
        this._proxies[name].start();
      }
      return this._proxies[name];
    }
  })
});

