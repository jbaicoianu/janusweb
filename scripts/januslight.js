elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.januslight', function() {
    this.postinit = function() {
      elation.engine.things.januslight.extendclass.postinit.call(this);
      this.defineProperties({
        light_range: { type: 'float', default: 10, set: this.updateLight },
        light_intensity: { type: 'float', default: 100, set: this.updateLight },
        light_cone_angle: { type: 'float', default: 0, set: this.updateLight },
        light_cone_exponent: { type: 'float', default: 1, set: this.updateLight },
        light_shadow: { type: 'boolean', default: false, set: this.updateLight },
      });
    }
    this.createObject3D = function() {
      var obj = new THREE.Object3D();
      if (this.light_cone_angle == 0) {
        this.light = new THREE.PointLight(this.properties.color, 1, this.light_range);
        this.light.position.set(0,0,0);
        obj.add(this.light);
      } else if (this.light_cone_angle > 0) {
        var angle = Math.acos(this.light_cone_angle);
        this.light = new THREE.SpotLight(this.properties.color, 1, this.light_range, angle);
        //this.light.position.set(0,0,0);
        obj.add(this.light);
      } 
      this.updateLight();
      return obj;
    }
    this.createChildren = function() {
      // TODO - should be an easy way of toggling helpers
      /*
      var scene = this.objects['3d'];
      while (scene.parent) {
        scene = scene.parent;
      }
      
      if (this.light_cone_angle == 0) {
        var helper = new THREE.PointLightHelper(this.light);
        scene.add(helper);
      } else {
        var helper = new THREE.SpotLightHelper(this.light);
        scene.add(helper);
      }
      */
    }
    this.physics_update = function() {
      this.localToWorld(this.light.target.position.set(0,0,-1));
      this.light.target.updateMatrixWorld();
    }
    this.updateLight = function() {
      if (this.light) {
        this.light.intensity = this.light_intensity / 100;
        var avgscale = (this.scale.x + this.scale.y + this.scale.z) / 3;
        this.light.color.copy(this.color);
        //this.light.color.multiplyScalar(this.light_intensity * avgscale * avgscale);
        this.light.range = this.light_range * avgscale;
        if (this.light_shadow) {
          this.initShadowmap();
        }
      }
    }
    this.initShadowmap = function() {
      this.light.castShadow = true;
      this.light.shadow.camera.near = 40;
      this.light.shadow.camera.far = 120;
      this.light.shadow.camera.fov = 50;
    }
    this.getProxyObject = function(classdef) {
      var proxy = elation.engine.things.janusobject.extendclass.getProxyObject.call(this, classdef);
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
