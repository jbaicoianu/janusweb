elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusportal', function() {
    this.postinit = function() {
      this.defineProperties({
        'janus': { type: 'object' },
        //'color': { type: 'color', default: new THREE.Color(0xffffff), set: this.updateMaterial },
        'url': { type: 'string', set: this.updateTitle },
        'title': { type: 'string', set: this.updateTitle },
        'draw_text': { type: 'boolean', default: true, set: this.updateTitle },
        'draw_glow': { type: 'boolean', default: true, refreshGeometry: true},
        'thumb_id': { type: 'string', set: this.updateMaterial }
      });
      this.addTag('usable');
      elation.engine.things.janusportal.extendclass.postinit.call(this);
      elation.events.add(this, 'thing_use_focus', elation.bind(this, this.useFocus));
      elation.events.add(this, 'thing_use_blur', elation.bind(this, this.useBlur));
    }
    this.createObject3D = function() {
      var thickness = 0.1;
      var offset = ((thickness / 2) / this.properties.scale.z) * 2;
      var box = new THREE.BoxGeometry(1,1,thickness);
      box.applyMatrix(new THREE.Matrix4().makeTranslation(0,0.5,offset/2));

      var mat = this.createMaterial();

      var mesh = new THREE.Mesh(box, mat);

      if (this.draw_glow) {
        var framewidth = .05 / this.properties.scale.x, 
            frameheight = .05 / this.properties.scale.y, 
            framedepth = .01 / this.properties.scale.z;
        var framegeo = new THREE.Geometry();
        var framepart = new THREE.BoxGeometry(1,frameheight,framedepth);
        var framemat4 = new THREE.Matrix4();


        framemat4.makeTranslation(0,1 - frameheight/2,framedepth/2 + offset);
        framegeo.merge(framepart, framemat4);
        framemat4.makeTranslation(0,frameheight/2,framedepth/2 + offset);
        framegeo.merge(framepart, framemat4);
        
        framepart = new THREE.BoxGeometry(framewidth,1,framedepth);

        framemat4.makeTranslation(.5 - framewidth/2,.5,framedepth/2 + offset);
        framegeo.merge(framepart, framemat4);
        framemat4.makeTranslation(-.5 + framewidth/2,.5,framedepth/2 + offset);
        framegeo.merge(framepart, framemat4);

        var framemat = new THREE.MeshPhongMaterial({color: 0x0000cc, emissive: 0x222222});
        var frame = new THREE.Mesh(framegeo, framemat);
        this.frame = frame;
        mesh.add(frame);
      }
      this.material = mat;

      this.objects['3d'] = mesh;

      this.updateTitle();

      return mesh;
    }
    this.updateTitle = function() {
      if (this.draw_text) {
        var title = this.title || this.url;
        if (title) {
          if (this.flatlabel) {
            this.flatlabel.setText(title);
            this.flatlabel.scale = [1/this.properties.scale.x, 1/this.properties.scale.y, 1/this.properties.scale.z];
          } else {
            this.flatlabel = this.spawn('label2d', this.id + '_label', { 
              text: title, 
              position: [0, .75, .15],
              persist: false,
              color: 0x0000ee,
              emissive: 0x222266,
              scale: [1/this.scale.x, 1/this.scale.y, 1/this.scale.z],
              thickness: 0.5,
              collidable: false
            });
          }
        }
      } else if (this.flatlabel) {
        this.flatlabel.setText('');
      }
    }
    this.createChildren = function() {
      this.updateColliderFromGeometry();
        //elation.events.add(this.label, 'mouseover,mousemove,mouseout,click', this);
    }
    this.createMaterial = function() {
      var matargs = { color: this.properties.color };
      var mat;
      if (this.thumb_id) {
        var asset = elation.engine.assets.find('image', this.thumb_id, true);
        if (!asset) {
          var asset = elation.engine.assets.get({ assettype:'image', id: this.thumb_id, src: this.thumb_id, baseurl: this.room.baseurl }); 
        }
        if (asset) var thumb = asset.getInstance();
        if (thumb) {
          matargs.map = thumb;
          if (asset.loaded) {
            if (asset.hasalpha) {
              matargs.transparent = true;
              matargs.alphaTest = 0.1;
            }
          } else {
            elation.events.add(thumb, 'asset_load', function() {
              if (mat && asset.hasalpha) {
                mat.transparent = true;
                mat.alphaTest = 0.1;
              }
            });
          }
        }
      }
      mat = new THREE.MeshBasicMaterial(matargs);
      mat.color = this.properties.color;
      return mat;
    }
    this.updateMaterial = function() {
      if (this.objects['3d'] && this.objects['3d'].material) {
        this.material = this.objects['3d'].material = this.createMaterial();
      }
    }
    this.hover = function() {
      if (this.label) {
        this.label.setEmissionColor(0x2222aa);
      }
      if (this.light) {
        if (this.properties.url) {
          this.light.setHex(0xccffcc);
        } else {
          this.light.setHex(0xff0000);
        }
      }
      if (this.frame) {
        this.frame.material.emissive.setHex(0x222266);
        this.frame.material.color.setHex(0x0000ff);
      }
      if (this.material.emissive) {
        this.material.emissive.setHex(0x111111);
      } else {
        this.material.color.setHex(0xffffff);
      }
      var gamepads = this.engine.systems.controls.gamepads;
      if (!this.hoverstate && gamepads && gamepads[0] && gamepads[0].vibrate) {
        gamepads[0].vibrate(90);
      }
      this.hoverstate = true;
      this.refresh();
    }
    this.unhover = function() {
      if (this.child) {
        this.child.objects.dynamics.setAngularVelocity(new THREE.Vector3(0,0,0));
        this.child.refresh();
      }
      if (this.label) {
        this.label.setEmissionColor(0x222266);
      }
      if (this.light) {
        this.light.setHex(0x999999);
      }
      if (this.frame) {
        this.frame.material.emissive.setHex(0x222222);
        this.frame.material.color.setHex(0x0000cc);
      }
      if (this.material.emissive) {
        this.material.emissive.setHex(0x000000);
      } else {
        this.material.color.setHex(0xdddddd);
      }
      var gamepads = this.engine.systems.controls.gamepads;
      if (this.hoverstate && gamepads && gamepads[0] && gamepads[0].vibrate) {
        gamepads[0].vibrate(80);
      }
      this.hoverstate = false;
      this.refresh();
    }
    this.click = function(ev) {
    }
    this.activate = function() {
      if (this.frame) {
        this.frame.material.emissive.setHex(0x662222);
        setTimeout(elation.bind(this, function() { this.frame.material.emissive.setHex(0x222222); }), 250);
      }
      this.properties.janus.setActiveRoom(this.properties.url, [0,0,0]);
      elation.events.fire({element: this, type: 'janusweb_portal_click'});
    }
    this.canUse = function(object) {
      if (object.hasTag('player')) {
          return {
            verb: 'load',
            noun: this.properties.url,
            action: elation.bind(this, this.activate)
          };
      }
    }
    this.useFocus = function(ev) {
      this.hover();
    }
    this.useBlur = function(ev) {
      this.unhover();
    }
    this.getProxyObject = function() {
      var proxy = elation.engine.things.janusobject.extendclass.getProxyObject.call(this);
      proxy._proxydefs = {
        url: ['property', 'url'],
        title: ['property', 'title'],
        thumb_id: ['property', 'thumb_id'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
