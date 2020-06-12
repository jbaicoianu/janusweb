elation.require(['engine.things.generic', 'utils.template', 'janusweb.parts'], function() {
  elation.component.add('engine.things.janusbase', function() {
    this.defaultcolor = new THREE.Color(0xffffff);
    this.colorIsDefault = true;

    this.postinit = function() {
      elation.engine.things.janusbase.extendclass.postinit.call(this);
      this.frameupdates = {};
      this.jschildren = [];
      this.assets = {};

      this.jsparts = new elation.janusweb.parts(this);

      this.defineProperties({
        room:     { type: 'object' },
        janus:    { type: 'object' },
        parent:   { type: 'object' },
        js_id:    { type: 'string' },
        color:    { type: 'color', default: this.defaultcolor, set: this.updateColor, comment: 'Object color' },
        opacity:  { type: 'float', default: 1.0, set: this.updateOpacity, min: 0, max: 1, comment: 'Object translucency, from 0..1' },
        alphatest:  { type: 'float', default: 0.05, set: this.updateAlphaTest, min: 0, max: 1 },
        fwd:      { type: 'vector3', default: new THREE.Vector3(0,0,1), set: this.pushFrameUpdate, comment: 'Forward vector (zdir == fwd)' },
        xdir:     { type: 'vector3', default: new THREE.Vector3(1,0,0), set: this.pushFrameUpdate, comment: 'Left vector' },
        ydir:     { type: 'vector3', default: new THREE.Vector3(0,1,0), set: this.pushFrameUpdate, comment: 'Up vector' },
        zdir:     { type: 'vector3', default: new THREE.Vector3(0,0,1), set: this.pushFrameUpdate, comment: 'Forward vector (zdir == fwd)' },
        rotation: { type: 'euler', default: new THREE.Euler(0,0,0), set: this.pushFrameUpdate, comment: 'Object Euler rotation, in degrees' },
        rotation_order: { type: 'string', default: 'XYZ', set: this.pushFrameUpdate },
        lighting: { type: 'boolean', default: true, comment: 'Object reacts to scene lighting' },
        sync:     { type: 'boolean', default: false, comment: 'Sync object changes over network' },
        autosync: { type: 'boolean', default: false, comment: 'Automatically sync object changes over network every frame' },
        locked:   { type: 'boolean', default: false, comment: 'Prevent users from editing this object and its descendents' },
        rotate_axis: { type: 'string', default: '0 1 0', set: this.updateRotationSpeed, comment: 'Axis to rotate object on (see rotate_deg_per_sec)' },
        rotate_deg_per_sec: { type: 'float', default: 0, set: this.updateRotationSpeed, comment: 'Speed to rotate at (see rotate_axis)' },
        object: { type: 'object' },
        layers: { type: 'string', set: this.setLayers },
        renderorder: { type: 'integer', default: 0 },
        onclick: { type: 'object' },
        anim_id: { type: 'string', set: this.updateAnimation },
        anim_transition_time: { type: 'float', default: .2 },
        collision_id: { type: 'string', set: this.updateCollider },
        collision_pos: { type: 'vector3', default: new THREE.Vector3(0,0,0), set: this.updateCollider },
        collision_scale: { type: 'vector3', set: this.updateCollider },
        collision_static: { type: 'boolean', default: true, set: this.updateCollider },
        collision_trigger: { type: 'boolean', default: false, set: this.updateCollider },
        collision_radius: { type: 'float', set: this.updateCollider },
        classList: { type: 'object', default: [] },
        className: { type: 'string', default: '', set: this.setClassName },
        tag: { type: 'string', default: '' },
        billboard: { type: 'string', default: '' },
        hasposition: { type: 'boolean', default: true },
        gazetime: { type: 'float' },
        ongazeenter: { type: 'callback' },
        ongazeleave: { type: 'callback' },
        ongazeprogress: { type: 'callback' },
        ongazeactivate: { type: 'callback' },
      });
      this.lastframevalues = {
        position: new THREE.Vector3(0,0,0),
        scale: new THREE.Vector3(1,1,1),
        color: new THREE.Color(),
        xdir: new THREE.Vector3(1,0,0),
        ydir: new THREE.Vector3(0,1,0),
        zdir: new THREE.Vector3(0,0,1),
        fwd: new THREE.Vector3(0,0,1),
        rotation: new THREE.Euler()
      };

      this.eventlistenerproxies = {};
      //if (this.col) this.color = this.col;

      // FIXME - saving references to bound functions, for future use.  This should happen deeper in the component framework
      this.handleFrameUpdates = elation.bind(this, this.handleFrameUpdates);
      this.created = false;
      elation.events.add(this, 'thing_change', (ev) => this.dispatchEvent({type: 'objectchange'}));
    }
    this.createObject3D = function() {
      if (this.object && this.object instanceof THREE.Object3D) {
        this.properties.position.copy(this.object.position);
        this.properties.orientation.copy(this.object.quaternion);
        return this.object;
      }
      if (this.renderorder) this.object.renderOrder = this.renderorder;
      return new THREE.Object3D();
    }
    this.createChildren = function() {
      if (typeof this.create == 'function') {
        this.create();
      }
      if (this.layers) {
        this.setLayers(this.layers);
      }
      this.created = true;
      this.dispatchEvent({type: 'create', bubbles: true});
    }
    this.updateColor = function() {
      if (this.properties.color === this.defaultcolor) {
        if (this.color.r != 1 || this.color.g != 1 || this.color.b != 1) {
          this.properties.color = this.properties.color.clone();
          this.defaultcolor.setRGB(1,1,1);
          this.colorIsDefault = false;
          delete this._proxies['color'];
        }
      } else {
        this.colorIsDefault = false;
        delete this._proxies['color'];
      }
    }
    this.updateOpacity = function() {
      this.setOpacity(this.opacity);
    },
    this.updateAlphaTest = function() {
      this.setAlphaTest(this.alphatest);
    }
    this.updateCollider = function() {
      this.removeCollider();
      if (!(this.collidable || this.pickable) || !this.objects['dynamics']) return;
      var collision_id = this.collision_id || this.collider_id;
      var collision_scale = this.scale.clone();
      if (this.collision_scale) {
        collision_scale.multiply(this.collision_scale);
      }
      if (this.collision_radius !== null) {
        collision_id = 'sphere';
        collision_scale.multiplyScalar(this.collision_radius);
      }
      if (collision_id) {
        if ((!this.collision_static || this.collision_static == 'false') && this.room.gravity) { // FIXME - should never receive 'false' as a string here
          this.objects.dynamics.mass = this.mass = 1;
          this.objects.dynamics.addForce('static', new THREE.Vector3(0, this.room.gravity, 0));
        }

        if (collision_id == 'sphere') {
          this.setCollider('sphere', {radius: Math.max(collision_scale.x, collision_scale.y, collision_scale.z) / 2, offset: this.collision_pos});
        } else if (collision_id == 'cube') {
          var halfsize = collision_scale.clone().multiplyScalar(.5);
          this.setCollider('box', {min: halfsize.clone().negate().add(this.collision_pos), max: halfsize.add(this.collision_pos)});
        } else if (collision_id == 'plane') {
          var halfsize = collision_scale.clone().multiplyScalar(.5).add(this.collision_pos);
          halfsize.z = .1;
          this.setCollider('box', {min: halfsize.clone().negate(), max: halfsize});
        } else if (collision_id == 'cylinder') {
          this.setCollider('cylinder', {height: 1, radius: .5, offset: new THREE.Vector3(0, 0.5, 0)});
        } else {
          var colliderasset = this.getAsset('model', collision_id);
          if (colliderasset) {
            var processMeshCollider = elation.bind(this, function(collider) {
            this.extractColliders(collider, true);
              //collider.userData.thing = this;

              //collider.bindPosition(this.position);
              //collider.bindQuaternion(this.orientation);
              //collider.bindScale(this.properties.scale);

              let collidercolor = 0x009900;
              if (this.mass === 0) {
                collidercolor = 0x990000;
              }
              if (this.collision_trigger) collidercolor = 0x990099;
              let remove = [];
              collider.traverse(n => {
                // Ignore collider if it's too high-poly
                if (n instanceof THREE.Mesh && !((n.geometry instanceof THREE.BufferGeometry && n.geometry.attributes.position.count <= 16384) ||
                      (n.geometry instanceof THREE.Geometry && n.geometry.vertices.length <= 16384))) {
                  console.warn('Collider mesh rejected, too many polys!', collision_id, this, n, collider);
                  elation.events.fire({type: 'thing_collider_rejected', element: this, data: {root: collider, mesh: n}});
                  remove.push(n);
                } else {
                  if (n.material) {
                    n.material = new THREE.MeshPhongMaterial({
                      color: collidercolor,
                      opacity: .2,
                      transparent: true,
                      emissive: 0x444400,
                      alphaTest: .01,
                      depthTest: false,
                      depthWrite: false
                    });
                  }
                  n.userData.thing = this;
                }
              });
              if (remove.length > 0) {
                remove.forEach(n => n.parent.remove(n));
              }
              this.setCollider('mesh', {mesh: collider, scale: this.properties.scale});
            });
            var collider = colliderasset.getInstance();
            this.collidermesh = collider;
            if (collider.userData.loaded) {
              //this.colliders.add(collider);
              processMeshCollider(collider);
            } else {
              elation.events.add(collider, 'asset_load', elation.bind(this, function(ev) {
                processMeshCollider(collider);
              }) );
            }
          }
        }
        this.colliders.updateMatrixWorld();
      }
    }
    this.removeCollider = function() {
      if (this.colliders) {
        for (var i = 0; i < this.colliders.children.length; i++) {
          var collider = this.colliders.children[i];
          collider.parent.remove(collider);
        }
      }
    }
    this.createForces = function() {
      elation.events.add(this.objects.dynamics, 'physics_collide', elation.bind(this, this.handleCollision));
      this.updateRotationSpeed();
    }
    this.updateRotationSpeed = function() {
      var rotate_axis = this.properties.rotate_axis,
          rotate_speed = this.properties.rotate_deg_per_sec || 0;
      if (this.objects.dynamics && rotate_axis) {
        var speed = (rotate_speed * Math.PI/180);
        var axisparts = rotate_axis.split(' ');
        var axis = new THREE.Vector3().set(axisparts[0], axisparts[1], axisparts[2]);
        axis.multiplyScalar(speed);
        this.objects.dynamics.setAngularVelocity(axis);
      }
    }
    this.setProperties = function(props) {
      var n = this.janus.parser.parseNode(props);
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
      let proxy = this.getProxyObject(),

          propdefs = this._thingdef.properties,
          proxydefs = proxy._proxydefs;
      let attrs = {};

      for (let k in proxydefs) {
        let proxydef = proxydefs[k],
            propdef = elation.utils.arrayget(propdefs, proxydef[1]);
        if ( k != 'tagName' && k != 'classList' && proxydef[0] == 'property' && propdef) {
          let val = elation.utils.arrayget(this.properties, proxydef[1]);
          let defaultval = propdef.default;
          if (val instanceof THREE.Vector2) {
            if (defaultval instanceof THREE.Vector2) defaultval = defaultval.toArray();
            if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1]))) {
              attrs[k] = val.toArray().map(n => Math.round(n * 10000) / 10000).join(' ');
            }
          } else if (val instanceof THREE.Vector3) {
            if (defaultval instanceof THREE.Vector3) defaultval = defaultval.toArray();
            if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1] && val.z == defaultval[2]))) {
              attrs[k] = val.toArray().map(n => Math.round(n * 10000) / 10000).join(' ');
            }
          } else if (val instanceof THREE.Color) {
            if (defaultval instanceof THREE.Color) defaultval = defaultval.toArray();
            if (!('default' in propdef) || ('default' in propdef && !(val.r == defaultval[0] && val.g == defaultval[1] && val.b == defaultval[2]))) {
              attrs[k] = val.toArray().map(n => Math.round(n * 10000) / 10000).join(' ');
            }
          } else if (val instanceof THREE.Euler) {
            if (defaultval instanceof THREE.Euler) defaultval = defaultval.toArray();
            if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1] && val.z == defaultval[2]))) {
              attrs[k] = val.toArray().slice(0, 3).map(n => Math.round((n * THREE.Math.RAD2DEG) * 10000) / 10000).join(' ');
            }
          } else if (val instanceof THREE.Quaternion) {
            if (defaultval instanceof THREE.Quaternion) defaultval = defaultval.toArray();
            if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1] && val.z == defaultval[2] && val.w == defaultval[3]))) {
              attrs[k] = val.toArray().map(n => Math.round(n * 10000) / 10000).join(' ');
            }
          } else if (val !== propdef.default && val !== null && val !== '') {
            attrs[k] = val;
          }
        }
      }
      let xml = '<' + this.tag.toLowerCase();
      for (let k in attrs) {
        xml += ' ' + k + '="' + attrs[k] + '"';
      }
      let children = [];
      for (let k in this.children) {
        if (this.children[k].persist) {
          children.push(k);
        }
      }
      if (children.length > 0) {
        xml += '>\n';
        for (let i = 0; i < children.length; i++) {
          let k = children[i];
          xml += '  ' + this.children[k].summarizeXML().replace(/\n/g, '\n  ').replace(/\s*$/, '\n');
        }
        xml += '</' + this.tag.toLowerCase() + '>\n';
      } else {
        xml += ' />\n';
      }
      return xml;
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = new elation.proxy(this, {
          parent:   ['accessor', 'parent.getProxyObject'],
          children: ['accessor', 'getChildProxies'],
          parts:    ['property', 'jsparts'],
          js_id:    ['property', 'js_id'],
          pos:      ['property', 'position'],
          rotation: ['property', 'rotation'],
          scale:    ['property', 'scale'],
          //rotation_order: ['property', 'rotation_order'],
          col:      ['property', 'color'],

          vel:      ['property', 'velocity'],
          accel:    ['property', 'acceleration'],
          mass:     ['property', 'mass'],
          restitution:['property', 'restitution'],
          opacity:  ['property', 'opacity'],
          alphatest:  ['property', 'alphatest'],
          sync:     ['property', 'sync'],
          autosync: ['property', 'autosync'],
          locked:   ['property', 'locked'],
          visible:  ['property', 'visible'],
          //tagName:  ['property', 'tag'],
          billboard: ['property', 'billboard'],
          className:  ['property', 'className'],
          classList:  ['property', 'classList'],
          gazetime:  ['property', 'gazetime'],
          layers:  ['property', 'layers'],
          renderorder:  ['property', 'renderorder'],

          pickable:  [ 'property', 'pickable'],
          collidable:  [ 'property', 'collidable'],
          collision_id:  [ 'property', 'collision_id'],
          collision_pos: [ 'property', 'collision_pos' ],
          collision_scale:  [ 'property', 'collision_scale'],
          collision_static:  [ 'property', 'collision_static'],
          collision_trigger:  [ 'property', 'collision_trigger'],
          collision_radius:  [ 'property', 'collision_radius'],

          rotate_deg_per_sec:  [ 'property', 'rotate_deg_per_sec'],
          rotate_axis:  [ 'property', 'rotate_axis'],

          fwd:      ['property', 'zdir'],
          xdir:     ['property', 'xdir'],
          ydir:     ['property', 'ydir'],
          zdir:     ['property', 'zdir'],

          onupdate:     ['callback', 'update'],
          onchange:     ['callback', 'change'],
          oncollision:  ['callback', 'collision'],
          onmouseover:  ['callback', 'mouseover'],
          onmouseout:   ['callback', 'mouseout'],
          onmousemove:  ['callback', 'mousemove'],
          onmousedown:  ['callback', 'mousedown'],
          onmouseup:    ['callback', 'mouseup'],
          onclick:      ['callback', 'click'],
          ontouchstart: ['callback', 'touchstart'],
          ontouchmove:  ['callback', 'touchmove'],
          ontouchend:   ['callback', 'touchend'],
          ondragover:   ['callback', 'dragover'],
          ondrag:       ['callback', 'drag'],
          ondragenter:  ['callback', 'dragenter'],
          ondragleave:  ['callback', 'dragleave'],
          ondragstart:  ['callback', 'dragstart'],
          ondragend:    ['callback', 'dragend'],
          ondrop:       ['callback', 'drop'],
          ongazeenter:  ['callback', 'gazeenter'],
          ongazeleave:  ['callback', 'gazeleave'],
          ongazemove:   ['callback', 'gazemove'],
          ongazeactivate: ['callback', 'gazeactivate'],
          ongazeprogress: ['callback', 'gazeprogress'],

          createObject:        ['function', 'createObject'],
          appendChild:         ['function', 'appendChild'],
          removeChild:         ['function', 'removeChild'],
          addEventListener:    ['function', 'addEventListenerProxy'],
          dispatchEvent:       ['function', 'dispatchEvent'],
          removeEventListener: ['function', 'removeEventListenerProxy'],
          localToWorld:        ['function', 'localToWorld'],
          worldToLocal:        ['function', 'worldToLocal'],
          distanceTo:          ['function', 'distanceTo'],
          addForce:            ['function', 'addForce'],
          removeForce:         ['function', 'removeForce'],
          die:                 ['function', 'die'],
          refresh:             [ 'function', 'refresh'],
          executeCallback:     ['function', 'executeCallback'],
          isEqual:             ['function', 'isEqual'],
          addClass:            ['function', 'addClass'],
          removeClass:         ['function', 'removeClass'],
          hasClass:            ['function', 'hasClass'],
          raycast:             ['function', 'raycast'],
          getElementsByTagName:['function', 'getElementsByTagName'],
        });

        if (classdef) {
          var propertydefs = {},
              proxydefs = {};

          var classdefs = [classdef.class];
          if (classdef.extendclass) {
            //var proxyobj = elation.engine.things[classdef.extendclass].base.prototype.getProxyObject.call(this, elation.engine.things[classdef.extendclass].classdef);
            var customelement = this.room.getCustomElement(classdef.extendclass);
            //var extendclass = elation.engine.things[classdef.extendclass];
            if (customelement) {
              classdefs.unshift(customelement.class);
            }
          }
          for (var i = 0; i < classdefs.length; i++) {
            var tclassdef = classdefs[i];
            for (var k in tclassdef) {
              var v = tclassdef[k];
              var proxytype = 'property';
              if (typeof v == 'function') {
                proxytype = 'function';
                this._proxyobject[k] = elation.bind(this._proxyobject, v);
              //} else if (v === true || v === false) {
              //  propertydefs[k] = {type: 'boolean', default: v };
              } else if (v instanceof THREE.Vector3) {
                propertydefs[k] = {type: 'vector3', default: v };
              } else if (v instanceof THREE.Color) {
                propertydefs[k] = {type: 'color', default: v };
              } else if (v instanceof THREE.Euler) {
                propertydefs[k] = {type: 'euler', default: v };
              } else {
                propertydefs[k] = {type: 'object', default: v };
              }
              proxydefs[k] = [proxytype, k];
            }
          }
          this.defineProperties(propertydefs);
          this._proxyobject._proxydefs = proxydefs;
        }

        var proxyevents = [
          'update', 'collision',
          'mouseover', 'mouseout', 'mousemove', 'mousedown', 'mouseup', 'click',
          'touchstart', 'touchmove', 'touchend',
          'dragover', 'drag', 'dragenter', 'dragleave', 'dragstart', 'dragend', 'drop',
          'gazeenter', 'gazeleave', 'gazemove', 'gazeactivate', 'gazeprogress',
        ];
        for (var i = 0; i < proxyevents.length; i++) {
          var evname = proxyevents[i];
          if (this['on' + evname]) {
            //elation.events.add(this, evname, elation.bind(this, this.executeCallback, this['on' + evname]));
            this._proxyobject['on' + evname] = this['on' + evname];
          }
        }
      }
      return this._proxyobject;
    }
    this.getChildProxies = function() {
      var childproxies = [];
      for (var k in this.children) {
        if (this.children[k].janus) {
          childproxies.push(this.children[k]._proxyobject);
        }
      }
      return childproxies;
    }
    this.getAsset = function(type, id, autocreate) {
      var parent = this.parent || this.room;

      var asset;
      if (this.assetpack) {
        asset = this.assetpack.get(type, id);
      }
      if (!asset && parent && typeof parent.getAsset == 'function') {
        asset = parent.getAsset(type, id);
      }
      if (!asset && parent !== janus._target) {
        // Asset not found in object hierarchy, check the built-in assets
        asset = janus.getAsset(type, id);
      }
      if (!asset && autocreate) {
        // Asset definition wasn't found, so we'll assume it's a URL and define a new asset
        let assetargs = {id: id, src: id};
        if (typeof autocreate == 'object') {
          for (let k in autocreate) {
            assetargs[k] = autocreate[k];
          }
        }
        this.room.loadNewAsset(type, assetargs, false);
        asset = this.room.getAsset(type, id);
      }

      // Store a reference so we know which assets are in use by which objects
      if (this.assets) {
        if (!this.assets[type]) {
          this.assets[type] = {};
        }
        this.assets[type][id] = asset;
      }

      return asset;
    }
    this.getActiveAssets = function(assetlist) {
      if (assetlist) {
        for (var type in this.assets) {
          if (!assetlist[type]) assetlist[type] = {};
          for (var url in this.assets[type]) {
            assetlist[type][url] = this.assets[type][url];
          }
        }
      }
      return this.assets;
    }
    this.start = function() {
      if (!this.started) {
        elation.events.add(this.room, 'janusweb_script_frame_end', this.handleFrameUpdates);
        this.started = true;
      }
      for (var k in this.children) {
        if (this.children[k].start) {
          this.children[k].start();
        }
      }
    }    
    this.stop = function() {
      for (var k in this.children) {
        if (this.children[k].stop) {
          this.children[k].stop();
        }
      }
      if (this.started) {
        elation.events.remove(this.room, 'janusweb_script_frame_end', this.handleFrameUpdates);
        this.started = false;
      }
    }    
    this.pushFrameUpdate = function(key, value) {
      this.frameupdates[key] = true;
    }
    this.handleFrameUpdates = (function() {
      let playerpos = new THREE.Vector3(),
          objpos = new THREE.Vector3(),
          dir = new THREE.Vector3(),
          up = new THREE.Vector3();
      return function(ev) {
        let parent = this.parent;
        let billboard = this.properties.billboard;
        if (billboard && parent) {
          //player.camera.localToWorld(playerpos.set(0,0,0));
          //this.localToWorld(objpos.set(0,0,0));
          /*
          player.camera.getWorldPosition(playerpos);
          this.getWorldPosition(objpos);
          dir.subVectors(playerpos, objpos);

          let billboard = this.properties.billboard;
          if (billboard == 'x') {
            up.set(1,0,0);
            dir.x = 0;
          } else if (billboard == 'y') {
            up.set(0,1,0);
            dir.y = 0;
          } else if (billboard == 'z') {
            up.set(0,0,1);
            dir.z = 0;
          } else if (billboard == 'xyz') {
            player.camera.localToWorld(up.set(0,1,0)).sub(playerpos).normalize();
          }
          dir.normalize();
          this.zdir.copy(this.parent.worldToLocal(dir).sub(this.parent.worldToLocal(objpos.set(0,0,0))).normalize());
          this.ydir.copy(up);
          */
          // TODO - Simple trig makes this much faster, but to get the same functionality as before we'll need to implement each dimension
          //        For now, we only support billboarding with the Y axis locked (eg, doom sprites)
          parent.worldToLocal(player.camera.getWorldPosition(playerpos)).sub(this.position);
          dir.copy(playerpos).normalize();
          if (billboard == 'y') {
            this.rotation.set(0, Math.atan2(dir.x, dir.z) * THREE.Math.RAD2DEG, 0);
            this.frameupdates['rotation'] = true;
          }
        }

        if (this.hasScriptChangedDirvecs()) {
          this.updateOrientationFromDirvecs();
          this.updateEulerFromOrientation();
        } else if (this.hasScriptChangedEuler()) {
          this.updateOrientationFromEuler();
          this.updateDirvecsFromOrientation();
        } else if (this.hasPhysicsChangedOrientation()) {
          this.updateEulerFromOrientation();
          this.updateDirvecsFromOrientation();
        }

        this.resetFrameUpdates();
        this.dispatchEvent({type: 'update', data: ev.data, bubbles: false});
        var proxy = this.getProxyObject();
        if (typeof proxy.update == 'function' && this.created) {
          proxy.update(ev.data);
        }
      }
    })();
    this.updateOrientationFromDirvecs = (function() {
      var tmpmat = new THREE.Matrix4(),
          xdir = new THREE.Vector3(),
          ydir = new THREE.Vector3(),
          zdir = new THREE.Vector3(),
          fwd = new THREE.Vector3();
      return function() {

        // Determine ydir and xdir given the specified zdir.  Based on the following code from the native client:
        //    SetYDir((dy - dz * QVector3D::dotProduct(dy, dz)).normalized());
        //    SetXDir(QVector3D::crossProduct(dy, dz));

        if (!this.lastframevalues.fwd.equals(this.properties.fwd)) {
          this.properties.zdir.copy(this.properties.fwd);
          fwd.copy(this.properties.fwd);
        } else {
          fwd.copy(this.properties.zdir);
        }
        ydir.copy(this.properties.ydir).normalize().sub(zdir.copy(fwd).multiplyScalar(this.properties.ydir.dot(fwd))).normalize();
        xdir.crossVectors(ydir, fwd).normalize();


        tmpmat.makeBasis(xdir, ydir, fwd);
        this.properties.orientation.setFromRotationMatrix(tmpmat);

        // Copy back the orthonormalized values
        this.properties.xdir.copy(xdir);
        this.properties.ydir.copy(ydir);
        this.properties.zdir.copy(zdir);
      }
    })();
    this.updateOrientationFromEuler = (function() {
      var tmpeuler = new THREE.Euler();
      return function() {
        var rot = this.properties.rotation,
            scale = Math.PI/180;
        tmpeuler.set(rot.x * scale, rot.y * scale, rot.z * scale);
        this.properties.orientation.setFromEuler(tmpeuler);
      };
    })();
    this.updateEulerFromOrientation = function() {
      this.properties.rotation.setFromQuaternion(this.properties.orientation);
    }
    this.updateDirvecsFromOrientation = (function() {
      var tmpmat = new THREE.Matrix4();
      return function() {
        tmpmat.makeRotationFromQuaternion(this.properties.orientation);
        tmpmat.extractBasis(this.properties.xdir, this.properties.ydir, this.properties.zdir);
      }
    })();
    this.hasScriptChangedDirvecs = function() {
      return (!this.lastframevalues.xdir.equals(this.properties.xdir) ||
              !this.lastframevalues.ydir.equals(this.properties.ydir) ||
              !this.lastframevalues.zdir.equals(this.properties.zdir) ||
              !this.lastframevalues.fwd.equals(this.properties.fwd));
    }
    this.hasScriptChangedEuler = function() {
      var changes = this.frameupdates;
      return (changes['rotation'] || changes['rotation_dir'] || !this.lastframevalues.rotation.equals(this.properties.rotation));
    }
    this.hasPhysicsChangedOrientation = (function() {
      // Scratch variable
      var euler = new THREE.Euler();
      return function() {
        euler.setFromQuaternion(this.properties.orientation);
        return !euler.equals(this.properties.rotation);
      }
    })();
    this.resetFrameUpdates = function() {
      this.frameupdates['position'] = false;
      this.frameupdates['scale'] = false;
      this.frameupdates['color'] = false;
      this.frameupdates['xdir'] = false;
      this.frameupdates['ydir'] = false;
      this.frameupdates['zdir'] = false;
      this.frameupdates['rotation'] = false;
      this.frameupdates['rotation_dir'] = false;

      for (var k in this.lastframevalues) {
        this.lastframevalues[k].copy(this.properties[k]);
      }
    }

    this.createObject = function(type, args, skipstart) {
      return room.createObject(type, args, this, !this.started);
    }
    this.appendChild = function(obj) {
      var proxyobj = obj
      if (elation.utils.isString(obj)) {
        proxyobj = this.room.jsobjects[obj];
      }
      if (proxyobj) {
        if (proxyobj.parent && typeof proxyobj.parent.removeChild == 'function') {
          proxyobj.parent.removeChild(proxyobj);
        }
        //var realobj = this.room.getObjectFromProxy(proxyobj);
        var realobj = proxyobj._target;
        if (realobj) {
          this.add(realobj);
          this.updateScriptChildren();
          if (typeof realobj.start == 'function') {
            realobj.start();
          }
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
          realobj.stop();
          this.remove(realobj);
          this.updateScriptChildren();
          if (room.objects[obj.js_id]) {
            delete room.objects[obj.js_id];
          }
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

          if (this.collision_trigger || proxy.collision_trigger) {
            this.dispatchEvent({type: 'trigger', data: { collision: ev.data, other: proxy }});
            ev.preventDefault();
            ev.stopPropagation();
          } else if (this.collidable) {
            this.dispatchEvent({type: 'collision', data: { collision: ev.data, other: proxy }});
          } else {
            ev.preventDefault();
          }
        } else {
          console.error('Collided with unknown object', this, other);
        }
      }
    }
    this.setOpacity = function(opacity) {
      if (this.objects['3d'] && this.currentopacity != opacity) {
        this.currentopacity = opacity;
        this.traverseObjects(function(n) {
          if (n.material) {
            var m = (elation.utils.isArray(n.material) ? n.material : [n.material]);
            for (var i = 0; i < m.length; i++) {
              m[i].opacity = opacity;
              m[i].transparent = (opacity < 1);
              if (m[i].transparent) {
                m[i].alphaTest = this.alphatest;
              }
            }
          }
        });
      }
      this.refresh();
    }
    this.setAlphaTest = function(alphatest) {
      if (this.objects['3d'] && this.currentalphatest != alphatest) {
        this.currentalphatest = alphatest;
        this.traverseObjects(function(n) {
          if (n.material) {
            var m = (elation.utils.isArray(n.material) ? n.material : [n.material]);
            for (var i = 0; i < m.length; i++) {
              //if (m[i].transparent) {
                m[i].alphaTest =alphatest;
              //}
            }
          }
        });
      }
    }
    this.updateAnimation = function() {
      // Triggered whenever this.anim_id changes
      this.setAnimation(this.anim_id);
    }
    this.setAnimation = function(anim_id) {
      if (!this.activeanimation || anim_id != this.anim_id) {
        if (!this.animationmixer) return;
        if (this.activeanimation) {
          //console.log('pause active animation', this.activeanimation);
          // TODO - interpolating between actions would make transitions smoother
          this.activeanimation.stop();
        }
        if (this.animationactions && this.animationactions[anim_id]) {
          var action = this.animationactions[anim_id];
          //console.log('found action!', anim_id, action);
          action.play();
          this.activeanimation = action;
        }
        this.anim_id = anim_id;
      }
    }
    this.dispatchEvent = function(event, target) {
      if (!event.element) event.element = target || this;
      var handlerfn = 'on' + event.type;
      if (this[handlerfn]) {
        this.executeCallback(this[handlerfn], event);
      }
      // Bubble event up to parents, unless the event was thrown with bubbling disabled or an event handler called stopPropagation()
      let firedev = elation.events.fire(event);
      let returnValue = true;
      firedev.forEach(e => returnValue &= e.returnValue);
      if (event.bubbles !== false && returnValue && this.parent && this.parent.dispatchEvent) {
        this.parent.dispatchEvent(event, event.target);
      }
    }
    this.addEventListenerProxy = function(name, handler, bubble) {
      var eventobj = {
        target: handler,
        fn: function(ev) {
          var proxyev = elation.events.clone(ev, {
            target: ev.target.getProxyObject(),
          });
          // Bind stopPropagation and preventDefault functions to the real event
          proxyev.stopPropagation = elation.bind(ev, ev.stopPropagation),
          proxyev.preventDefault = elation.bind(ev, ev.preventDefault),
          handler(proxyev);
        }
      };
      if (!this.eventlistenerproxies[name]) this.eventlistenerproxies[name] = [];
      this.eventlistenerproxies[name].push(eventobj);

      elation.events.add(this, name, eventobj.fn, bubble);
    }
    this.removeEventListenerProxy = function(name, handler, bubble) {
      if (this.eventlistenerproxies[name]) {
        for (var i = 0; i < this.eventlistenerproxies[name].length; i++) {
          var evproxy = this.eventlistenerproxies[name][i];
          if (evproxy.target === handler) {
            elation.events.remove(this, name, evproxy.fn, bubble);
          }
        }
      }
    }
    this.executeCallback = function(callback, args) {
      if (callback instanceof Function) {
        callback(args);
      } else if (elation.utils.isString(callback)) {
        (function(fn) {
          var event = args;
          return eval(callback);
        }).call(this.getProxyObject(), callback);

      }
    }
    this.isEqual = function(obj) {
      var realobj = obj.target || obj;
      return this === realobj;
    }
    this.isType = function(type) {
      return this.tag == type.toUpperCase();
    }
    this.addClass = function(classname) {
      if (!this.hasClass(classname)) {
        this.classList.push(classname);
      }
      this.updateClassName();
    }
    this.removeClass = function(classname) {
      var idx = this.classList.indexOf(classname);
      if (idx != -1) {
        this.classList.splice(idx, 1);
      }
      this.updateClassName();
    }
    this.hasClass = function(classname) {
      return this.classList.indexOf(classname) != -1;
    }
    this.updateClassName = function() {
      this.className = this.classList.join(' ');
    }
    this.setClassName = function() {
      this.classList = this.className.split(' ');
    }
    this.raycast = (function() {
      var _pos = new THREE.Vector3(),
          _dir = new THREE.Vector3(0,0,-1);
      return function(dir, offset, classname) {
        if (!this.room) return [];
        if (dir) {
          _dir.copy(dir);
        } else {
          _dir.set(0,0,-1);
        }
        _pos.set(0,0,0);
        if (offset) {
          _pos.add(offset);
        }
        this.localToWorld(_pos);
        this.objects.dynamics.localToWorldDir(_dir);
        return this.room.raycast(_dir, _pos, classname);
      };
    })();
    this.getElementsByTagName = function(tagname, elements) {
      var tag = tagname.toUpperCase();
      if (!elements) elements = [];
      var children = this.getChildProxies();
      for (var i = 0; i < children.length; i++) {
        var el = children[i];
        if (el.tag == tag) {
          elements.push(el);
        }
        el.getElementsByTagName(tagname, elements);
      };
      return elements;
    }
    this.getParentByTagName = function(tagname) {
      let obj = this.parent;
      let tag = tagname.toUpperCase();
      while (obj) {
        if (obj.tag == tag) {
          return obj;
        }
        obj = obj.parent;
      }
      return false;
    }
    this.getParentByClassName = function(classname) {
      let obj = this.parent;
      while (obj) {
        if (obj.hasClass && obj.hasClass(classname)) {
          return obj;
        }
        obj = obj.parent;
      }
      return false;
    }
    this.setLayers = function(layers) {
      // TODO - this system is experimental, and probably isn't quite ready for use
      //        It should be extended to have named layers, rather than expecting the
      //        dev to manage numeric layer IDs and know which ones are reserved
      if (!layers) layers = this.layers;
      if (!this.objects['3d']) return;
      let layernums = layers.split(' ');
      this.objects['3d'].layers.mask = 0;
      for (let i = 0; i < layernums.length; i++) {
        this.objects['3d'].layers.enable(layernums[i]);
      }
    }
    this.clone = function() {
      // Create a new copy of this object
      function arrayEquals(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
      let props = {},
          skipprops = ['classList', 'color', 'fwd', 'janus', 'orientation', 'parent', 'room', 'tag', 'xdir', 'ydir', 'zdir'],
          remap = {
            janusid: 'id',
            position: 'pos',
          };
      for (let k in this._thingdef.properties) {
        if (skipprops.indexOf(k) != -1) continue;

        let prop = this._thingdef.properties[k];
        let realkey = (remap[k] ? remap[k] : k);
        switch (prop.type) {
          case 'vector2':
          case 'vector3':
          case 'vector4':
          case 'euler':
          case 'quaternion':
            if (this[k]) {
              let arr = this[k].toArray();
              if (!arrayEquals(arr, prop.default)) {
                props[realkey] = arr;
              }
            } else {
console.log('its null', k, this[k], prop);
            }
            break;
          default:
            if (this[k] !== prop.default && this[k] !== null && this[k] !== undefined) {
              props[realkey] = this[k];
            }
        }
        // Special handling for 'rotation' and 'color'
        if (realkey == 'rotation') {
          props['rotation'][0] *= THREE.Math.RAD2DEG;
          props['rotation'][1] *= THREE.Math.RAD2DEG;
          props['rotation'][2] *= THREE.Math.RAD2DEG;
        } else if (realkey == 'color') {
          if (!this.colorIsDefault) {
            props['col'] = this.col.toArray();
          }
        }
        //if (this[k] !== prop.default && this[k] !== null && this[k] !== undefined) {
      }
console.log('clone', props);
      let parent = this.parent || room;
      if (parent) {
        return parent.createObject(this.tag, props);
      }
/*
      {
        pos: this.pos.clone(),
        rotation: this.rotation.clone(),
        scale: this.scale.clone(),
        color: this.color.clone(),
        lighting: this.lighting,
        id: this.id,
        js_id: this.js_id + '_copy',
        collision_id: this.collision_id,
      });
*/
    }
    this.addControlContext = function(name, defs) {
      let legacydefs = {};
      let threshold_activate = .95,
          threshold_deactivate = .05;
      // TODO - instead of this compatibility layer, we should just support this object-style syntax and new events in the engine control system directly
      for (let k in defs) {
        let def = defs[k];
        legacydefs[k] = [def.defaultbindings, (ev) => {
          let absvalue = Math.abs(ev.value);
          if (absvalue > threshold_activate && def.onactivate) {
            def.onactivate(ev);
          } else if (absvalue < threshold_deactivate && def.ondeactivate) {
            def.ondeactivate(ev);
          }
        }];
      }
      this.engine.systems.controls.addContext(name, legacydefs);
    }
    this.activateControlContext = function(name) {
      this.engine.systems.controls.activateContext(name, this);
    }
    this.deactivateControlContext = function(name) {
      this.engine.systems.controls.deactivateContext(name);
    }
    this.traverseObjects = function(callback, root) {
      if (!root) root = this.objects['3d'];
      callback(root);
      if (root.children) {
        for (let i = 0; i < root.children.length; i++) {
          let child = root.children[i];
          if (!child.userData.thing || child.userData.thing === this) {
            this.traverseObjects(callback, child);
          }
        }
      }
    }
  }, elation.engine.things.generic);
});
