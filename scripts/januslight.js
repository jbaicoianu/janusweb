elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.januslight', function() {
    this.postinit = function() {
      elation.engine.things.januslight.extendclass.postinit.call(this);
      this.defineProperties({
        light_range: { type: 'float', default: 10 },
        light_intensity: { type: 'float', default: 100 },
        light_cone_angle: { type: 'float', default: 0 },
        light_cone_exponent: { type: 'float', default: 1 },
      });
    }
    this.createObject3D = function() {
      var obj = new THREE.Object3D();
      if (this.light_cone_angle == 0) {
        this.light = new THREE.PointLight(0xff0000, this.light_intensity / 1);
        this.light.position.set(0,0,0);
        obj.add(this.light);
      } else if (this.light_cone_angle > 0) {
        var angle = Math.acos(this.light_cone_angle);
        this.light = new THREE.SpotLight(this.color, this.light_intensity / 1, this.light_range, angle);
        this.light.position.set(0,0,0);
        obj.add(this.light);
      } 
      return obj;
    }
    this.createChildren = function() {
      if (this.light_cone_angle == 0) {
        var helper = new THREE.PointLightHelper(this.light);
        this.parent.objects['3d'].add(helper);
      } else {
        var helper = new THREE.SpotLightHelper(this.light);
        this.parent.objects['3d'].add(helper);
      }
      
    }
    this.getProxyObject = function() {
      var proxy = elation.engine.things.janusobject.extendclass.getProxyObject.call(this);
      proxy._proxydefs = {
        light_range:         [ 'property', 'light_range'],
        light_intensity:     [ 'property', 'light_intensity'],
        light_cone_angle:    [ 'property', 'light_cone_angle'],
        light_cone_exponent: [ 'property', 'light_cone_exponent'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
