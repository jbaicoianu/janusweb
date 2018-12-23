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
        'bevel.enabled':   { type: 'bool', default: false, refreshGeometry: true },
        'bevel.thickness': { type: 'float', default: 0, refreshGeometry: true },
        'bevel.size':      { type: 'float', default: 0, refreshGeometry: true },
      });
      this.emptygeometry = new THREE.Geometry();
      elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.handleFrameUpdates));
    }
    this.createObject3D = function() {
      var text = this.properties.text || '';//this.name;
      var cachename = this.getCacheName(text);
      var geometry = this.textcache[cachename];
      if (!geometry) {
        geometry = this.createTextGeometry(text);

        if (this.font_scale) {
          geometry.computeBoundingBox();
          var geosize = new THREE.Vector3().subVectors(geometry.boundingBox.max, geometry.boundingBox.min);
          var geoscale = 1 / Math.max(1e-6, text.length * this.font_size);
          geometry.applyMatrix(new THREE.Matrix4().makeScale(geoscale, geoscale, geoscale));
        }

        if (this.properties.opacity < 1.0) {
          this.material.opacity = this.properties.opacity;
          this.material.transparent = true;
        }

        if (geometry !== this.emptygeomety) {
          this.textcache[cachename] = geometry;
        }
      }
      var mesh;
      if (this.objects['3d']) {
        mesh = this.objects['3d'];
        mesh.geometry = geometry;
      } else {
        this.material = this.createTextMaterial(text);
        mesh = new THREE.Mesh(geometry, this.material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
      
      return mesh;
    }
    this.createTextMaterial = function() {
      var matargs = {
        color: this.properties.color || new THREE.Color(0xffffff), 
        emissive: this.properties.emissive, 
        flatShading: false,
        depthTest: this.properties.depthTest,
        reflectivity: .5
      };
      if (this.room.pbr) {
        matargs.roughness = .5;
      }
      var material = (this.room.pbr ? new THREE.MeshPhysicalMaterial(matargs) : new THREE.MeshPhongMaterial(matargs));

      if (this.properties.opacity < 1.0) {
        material.opacity = this.properties.opacity;
        material.transparent = true;
      }
      return material;
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

      var font = elation.engine.assets.find('font', this.properties.font);
      if (!font) font = elation.engine.assets.find('font', 'helvetiker');

      var geometry = new THREE.TextGeometry( text, {
        size: this.font_size,
        height: this.properties.thickness || this.font_size / 2,
        curveSegments: this.segments,

        font: font,
        weight: "normal",
        style: "normal",

        bevelThickness: this.properties.bevel.thickness,
        bevelSize: this.properties.bevel.size,
        bevelEnabled: this.properties.bevel.enabled
      });                                                
      geometry.computeBoundingBox();
      var bbox = geometry.boundingBox;
      var diff = new THREE.Vector3().subVectors(bbox.max, bbox.min);
      var geomod = new THREE.Matrix4();
      // horizontal alignment
      if (this.properties.align == 'center') {
        geomod.makeTranslation(-.5 * diff.x, 0, 0);
        geometry.applyMatrix(geomod);
      } else if (this.properties.align == 'right') {
        geomod.makeTranslation(-1 * diff.x, 0, 0);
        geometry.applyMatrix(geomod);
      }

      // vertical alignment
      if (this.properties.verticalalign == 'middle') {
        geomod.makeTranslation(0, -.5 * diff.y, 0);
        geometry.applyMatrix(geomod);
      } else if (this.properties.verticalalign == 'top') {
        geomod.makeTranslation(0, -1 * diff.y, 0);
        geometry.applyMatrix(geomod);
      }

      // z-alignment
      if (this.properties.zalign == 'middle') {
        geomod.makeTranslation(0, 0, -.5 * diff.z);
        geometry.applyMatrix(geomod);
      } else if (this.properties.zalign == 'front') {
        geomod.makeTranslation(0, 0, -1 * diff.z);
        geometry.applyMatrix(geomod);
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
      var geometry = new THREE.Geometry();
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
          emissive:  [ 'property', 'emissive'],
        };
      }
      return this._proxyobject;
    }
    this.updateMaterial = function() {
      if (this.material) {
        this.material.color = this.color;
      }
    }
    this.getCacheName = function(text) {
      return text + '_' + this.font + '_' + this.font_size + (this.font_scale ? '_scaled' : '');
    }
    this.updateColor = function() {
      if (this.properties.color === this.defaultcolor) {
        if (this.color.r != 1 || this.color.g != 1 || this.color.b != 1) {
          this.properties.color = this.properties.color.clone();
          this.defaultcolor.setRGB(1,1,1);
          this.colorIsDefault = false;
        }
      }
      this.updateMaterial();
    }
  }, elation.engine.things.janusbase);
});
