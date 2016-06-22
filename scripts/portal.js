elation.require(['engine.things.portal'], function() {
  elation.component.add('engine.things.janusportal', function() {
    this.postinit = function() {
      this.defineProperties({
        'janus': { type: 'object' },
        'thumbnail': { type: 'texture' }
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
      var matargs = { color: 0xdddddd };
      if (this.properties.thumbnail) matargs.map = this.properties.thumbnail;
      var mat = new THREE.MeshBasicMaterial(matargs);
      var mesh = new THREE.Mesh(box, mat);

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
      this.material = mat;
      mesh.add(frame);
      return mesh;
    }
    this.createChildren = function() {
      this.updateColliderFromGeometry();
      if (this.properties.render.collada || this.properties.render.meshname) {
        this.child = this.spawn('generic', this.id + '_model', {
          'render.collada': this.properties.render.collada, 
          'render.meshname': this.properties.render.meshname, 
          'position': this.properties.childposition,
          'orientation': this.properties.childorientation.clone(),
          'scale': this.properties.childscale.clone(),
          persist: false,
        });
        elation.events.add(this.child, 'mouseover,mouseout,click', this);
      }
      if (this.properties.title) {
        this.flatlabel = this.spawn('label2d', this.id + '_label', { 
          text: this.properties.title, 
          position: [0, .75, .15],
          persist: false,
          color: 0x0000ee,
          emissive: 0x222266,
          scale: [1/this.properties.scale.x, 1/this.properties.scale.y, 1/this.properties.scale.z],
          thickness: 0.5,
/*
          'bevel.enabled': true,
          'bevel.thickness': 0.025,
          'bevel.size': 0.025,
*/
          collidable: false
        });
        //elation.events.add(this.label, 'mouseover,mousemove,mouseout,click', this);
      }
    }
    this.hover = function() {
      if (this.child) {
        this.child.objects.dynamics.setAngularVelocity(new THREE.Vector3(0,Math.PI/4,0));
        this.child.refresh();
      }
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
      this.frame.material.emissive.setHex(0x662222);
      this.properties.janus.setActiveRoom(this.properties.url, [0,0,0]);
      setTimeout(elation.bind(this, function() { this.frame.material.emissive.setHex(0x222222); }), 250);
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
      console.log('focus:', this.properties.gamename);
      this.hover();
    }
    this.useBlur = function(ev) {
      console.log('blur:', this.properties.gamename);
      this.unhover();
    }
  }, elation.engine.things.janusbase);
});
