elation.require(['engine.things.label'], function() {
  elation.component.add('engine.things.janustext', function() {
    this.postinit = function() {
      elation.engine.things.janustext.extendclass.postinit.call(this);
      this.frameupdates = [];
      this.textcache = this.engine.getScratchObject('textcache');
      this.defineProperties({
        'text':            { type: 'string', default: '', refreshGeometry: true },
        'font':            { type: 'string', default: 'helvetiker', refreshGeometry: true },
        'font_size':       { type: 'float', default: 1.0, refreshGeometry: true },
        'font_scale':      { type: 'bool', default: true, refreshGeometry: true },
        'align':           { type: 'string', default: 'center', refreshGeometry: true },
        'verticalalign':   { type: 'string', default: 'bottom', refreshGeometry: true },
        'zalign':          { type: 'string', default: 'back', refreshGeometry: true },
        'emissive':        { type: 'color', default: 0x000000 },
        'opacity':         { type: 'float', default: 1.0 },
        'depthTest':       { type: 'bool', default: true },
        'thickness':       { type: 'float', refreshGeometry: true },
        'segments':        { type: 'int', default: 6, refreshGeometry: true },
        'bevel':           { type: 'bool', default: false, refreshGeometry: true },
        'bevel_thickness': { type: 'float', default: 0, refreshGeometry: true },
        'bevel_size':      { type: 'float', default: 0, refreshGeometry: true },
        'bevel_segments':  { type: 'int', default: 3, refreshGeometry: true },
        'bevel_offset':    { type: 'float', default: 0, refreshGeometry: true },
        'visible':         { type: 'boolean', default: true, set: this.toggleVisibility },
        'roughness':       { type: 'float', default: null, min: 0, max: 1, set: this.updateMaterial, comment: 'Material roughness value' },
        'metalness':       { type: 'float', default: null, set: this.updateMaterial, comment: 'Material metalness value' },
        'envmap_id':       { type: 'string', set: this.updateMaterial, comment: 'Environment map texture ID (overrides skybox reflections)' },
      });
      this.emptygeometry = new THREE.BufferGeometry();
      elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.handleFrameUpdates));
    }
    this.createObject3D = function() {
      this.objects['3d'] = new THREE.Object3D();
      if (!this.fontasset) {
        this.fontasset = this.getAsset('font', this.properties.font);
        if (!this.fontasset) this.fontasset = this.getAsset('font', 'helvetiker');

        if (this.fontasset.loaded) {
          this.createTextMesh();
        } else {
          elation.events.add(this.fontasset, 'asset_load', (ev) => this.createTextMesh());
        }
      } else {
        this.createTextMesh();
      }
      elation.events.add(this.room, 'room_load_complete', ev => this.updateMaterial());
      return this.objects['3d'];
    }
    this.createTextMesh = function() {
      var text = this.properties.text || '';//this.name;
      var cachename = this.getCacheName(text);
      var geometry = this.textcache[cachename];
      if (!geometry) {
        geometry = this.createTextGeometry(text);

        if (this.font_scale) {
          geometry.computeBoundingBox();
          var geosize = new THREE.Vector3().subVectors(geometry.boundingBox.max, geometry.boundingBox.min);
          var geoscale = 1 / Math.max(1e-6, text.length * this.font_size);
          geometry.applyMatrix4(new THREE.Matrix4().makeScale(geoscale, geoscale, geoscale));
        }

        if (this.material && this.properties.opacity < 1.0) {
          this.material.opacity = this.properties.opacity;
          this.material.transparent = true;
        }

        if (geometry !== this.emptygeometry) {
          this.textcache[cachename] = geometry;
        }
      }
      let mesh = this.mesh;
      if (mesh) {
        mesh.geometry = geometry;
      } else {
        this.material = this.createTextMaterial(text);
        mesh = new THREE.Mesh(geometry, this.material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.mesh = mesh;
      }
      this.objects['3d'].add(mesh);
      this.refresh();
    }
    this.createTextMaterial = function() {
      var matargs = {
        color: this.properties.color || new THREE.Color(0xffffff), 
        opacity: this.properties.opacity,
        transparent: this.properties.opacity < 1,
        emissive: this.properties.emissive, 
        flatShading: false,
        depthTest: this.properties.depthTest,
        reflectivity: .5
      };
      if (this.room.pbr) {
        matargs.roughness = this.roughness;
        matargs.metalness = this.metalness;
        matargs.envMap = this.getEnvmap();
      }
      var material = (this.room.pbr ? new THREE.MeshPhysicalMaterial(matargs) : new THREE.MeshPhongMaterial(matargs));

      if (this.properties.opacity < 1.0) {
        material.opacity = this.properties.opacity;
        material.transparent = true;
      }
      this.material = material;
      return material;
    }
    this.updateMaterial = function() {
      if (this.material) {
        this.material.color = this.color;
        if (this.room.pbr) {
          this.material.roughness = this.roughness;
          this.material.metalness = this.metalness;
          this.material.envMap = this.getEnvmap();
        }
        this.material.needsUpdate = true;
      }
    }
    this.createTextGeometry = function(text) {
      // Early out for invisible geometry
      if (!this.visible) {
        return this.emptygeometry;
      }

      var cachename = this.getCacheName(text);
      if (this.textcache[cachename]) {
        return this.textcache[cachename];
      }

      let font = this.fontasset.getInstance();

      var geometry = new THREE.TextGeometry( text, {
        size: this.font_size,
        height: this.properties.thickness || this.font_size / 8,
        curveSegments: this.segments,

        font: font,
        weight: "normal",
        style: "normal",

        bevelEnabled: this.bevel,
        bevelThickness: this.bevel_thickness,
        bevelSize: this.bevel_size,
        bevelSegments: this.bevel_segments,
        bevelOffset: this.bevel_offset,
      });                                                
      geometry.computeBoundingBox();
      var bbox = geometry.boundingBox;
      var diff = new THREE.Vector3().subVectors(bbox.max, bbox.min);
      var geomod = new THREE.Matrix4();
      // horizontal alignment
      if (this.properties.align == 'center') {
        geomod.makeTranslation(-.5 * diff.x, 0, 0);
        geometry.applyMatrix4(geomod);
      } else if (this.properties.align == 'right') {
        geomod.makeTranslation(-1 * diff.x, 0, 0);
        geometry.applyMatrix4(geomod);
      }

      // vertical alignment
      if (this.properties.verticalalign == 'middle') {
        geomod.makeTranslation(0, -.5 * diff.y, 0);
        geometry.applyMatrix4(geomod);
      } else if (this.properties.verticalalign == 'top') {
        geomod.makeTranslation(0, -1 * diff.y, 0);
        geometry.applyMatrix4(geomod);
      }

      // z-alignment
      if (this.properties.zalign == 'middle') {
        geomod.makeTranslation(0, 0, -.5 * diff.z);
        geometry.applyMatrix4(geomod);
      } else if (this.properties.zalign == 'front') {
        geomod.makeTranslation(0, 0, -1 * diff.z);
        geometry.applyMatrix4(geomod);
      }
      geometry.computeBoundingBox();
      this.textcache[cachename] = geometry;
      return geometry;
    }
    this.setText = function(text) {
      this.properties.text = text;
      if (text.indexOf && text.indexOf('\n') != -1) {
        this.setMultilineText(text);
      } else {
        this.objects['3d'].geometry = this.createTextGeometry(text);
      }
      if (!this.material) {
        this.material = this.createTextMaterial(text);
      }
      this.objects['3d'].material = this.material;
      this.refresh();
   }
   this.setMultilineText = function(text) {
      var lines = text.split('\n');
      var geometry = new THREE.BufferGeometry();
      var linematrix = new THREE.Matrix4();
      var lineoffset = 0;
      var lineheight = 0;
      for (var i = 0; i < lines.length; i++) {
        var linegeometry = this.createTextGeometry(lines[i]);
        linematrix.makeTranslation(0, lineoffset, 0);
        geometry.merge(linegeometry, linematrix);
        if (!lineheight) {
          var bboxdiff = new THREE.Vector3().subVectors(linegeometry.boundingBox.max, linegeometry.boundingBox.min);
          lineheight = bboxdiff.y;
        }
        lineoffset -= lineheight * 1.2;
      }
      this.objects['3d'].geometry = geometry;
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janustext.extendclass.getProxyObject.call(this, classdef);

        this._proxyobject._proxydefs = {
          text:  [ 'property', 'text'],
          col:   [ 'property', 'color'],
          emissive:  [ 'property', 'emissive'],
          bevel:  [ 'property', 'bevel'],
          bevel_thickness:  [ 'property', 'bevel_thickness'],
          bevel_size:  [ 'property', 'bevel_size'],
          bevel_segments:  [ 'property', 'bevel_segments'],
          bevel_offset:  [ 'property', 'bevel_offset'],
          roughness:  [ 'property', 'roughness'],
          metalness:  [ 'property', 'metalness'],
          envmap_id:  [ 'property', 'envmap_id'],
          font:       [ 'property', 'font'],
          font_size:  [ 'property', 'font_size'],
          font_scale: [ 'property', 'font_scale'],
          align:       [ 'property', 'align'],
          verticalalign:  [ 'property', 'verticalalign'],
          zalign: [ 'property', 'zalign'],
        };
      }
      return this._proxyobject;
    }
    this.getCacheName = function(text) {
      return [text, this.font, this.font_size, this.align, this.verticalalign, this.zalign, this.thickness, this.segments, this.bevel, this.bevel_thickness, this.bevel_size, this.bevel_segments, this.bevel_offset, (this.font_scale ? 'scaled' : 'unscaled')].join('_');
    }
    this.updateColor = function() {
      if (this.properties.color === this.defaultcolor) {
        if (this.color.r != 1 || this.color.g != 1 || this.color.b != 1) {
          this.properties.color = this.properties.color.clone();
          this.defaultcolor.setRGB(1,1,1);
          this.colorIsDefault = false;
          delete this._proxies['color'];
        }
      }
      this.updateMaterial();
    }
    this.toggleVisibility = function() {
      if (this.visible && this.objects['3d'].geometry === this.emptygeometry) {
        this.objects['3d'].geometry = this.createTextGeometry(this.text);
      }
    }
    this.getEnvmap = function() {
      if (this.envmap_id) {
        if (this.envmap) return this.envmap;
        var envmapasset = this.getAsset('image', this.envmap_id);
        if (envmapasset) {
          this.envmap = envmapasset.getInstance();
          this.envmap.mapping = THREE.EquirectangularReflectionMapping;
          return this.envmap;
        }
      } else {
        var scene = this.engine.systems.world.scene['world-3d'];
        return scene.background;
      }
    }
  }, elation.engine.things.janusbase);
});
