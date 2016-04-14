elation.require(['engine.things.portal'], function() {
  elation.component.add('engine.things.janusportal', function() {
    this.postinit = function() {
      this.defineProperties({
        'url': { type: 'string' },
        'title': { type: 'string' },
        'janus': { type: 'object' },
        'thumbnail': { type: 'texture' }
      });
      this.janus = this.properties.janus;
      elation.engine.things.janusportal.extendclass.postinit.call(this);
    }
    this.createObject3D = function() {
      var box = new THREE.BoxGeometry(1,1,.1);
      box.applyMatrix(new THREE.Matrix4().makeTranslation(0,0.5,0.05));
      var matargs = { color: 0xffffff };
      if (this.properties.thumbnail) matargs.map = this.properties.thumbnail;
      var mat = new THREE.MeshBasicMaterial(matargs);
      var mesh = new THREE.Mesh(box, mat);

      var framewidth = .05 / this.properties.scale.x, frameheight = .05 / this.properties.scale.y, framedepth = .05 / this.properties.scale.z;
      var framegeo = new THREE.Geometry();
      var framepart = new THREE.BoxGeometry(1,frameheight,framedepth);
      var framemat4 = new THREE.Matrix4();


      framemat4.makeTranslation(0,1 - frameheight/2,framedepth/2 + .1);
      framegeo.merge(framepart, framemat4);
      framemat4.makeTranslation(0,frameheight/2,framedepth/2 + .1);
      framegeo.merge(framepart, framemat4);
      
      framepart = new THREE.BoxGeometry(framewidth,1,framedepth);

      framemat4.makeTranslation(.5 - framewidth/2,.5,framedepth/2 + .1);
      framegeo.merge(framepart, framemat4);
      framemat4.makeTranslation(-.5 + framewidth/2,.5,framedepth/2 + .1);
      framegeo.merge(framepart, framemat4);

      var framemat = new THREE.MeshPhongMaterial({color: 0x0000cc, emissive: 0x222222});
      var frame = new THREE.Mesh(framegeo, framemat);
      this.frame = frame;
      mesh.add(frame);
      this.material = mat;
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
        this.label = this.spawn('janustext', this.id + '_label', { 
          text: this.properties.title, 
          position: [0, .75, .15],
          persist: false,
          color: 0x0000ee,
          emissive: 0x222266,
          scale: [1/this.properties.scale.x, 1/this.properties.scale.y, 1/this.properties.scale.z],
          collidable: true
        });
        elation.events.add(this.label, 'mouseover,mousemove,mouseout,click', this);
      }

/*
      this.light = this.spawn('light', this.id + '_light', {
        position: [0, 10, 15],
        persist: false,
        intensity: .5,
        color: 0x999999,
        type: 'spot',
        target: this.child,
        angle: Math.PI/8
      });
*/

      // FIXME - dumb hack for demo!
/*
      var collgeo = new THREE.BoxGeometry(4, 8, 4);
      var collmat = new THREE.MeshLambertMaterial({color: 0x990000, transparent: true, opacity: .5});
      var collider = new THREE.Mesh(collgeo, collmat);
      collider.userData.thing = this;
      collider.position.y = 4;
      this.colliders.add(collider);
      collider.updateMatrixWorld();
*/
    }
    this.hover = function() {
      this.hoverstate = true;
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
      this.refresh();
    }
    this.unhover = function() {
      this.hoverstate = false;
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
      this.refresh();
    }
    this.mouseover = function(ev) {
      //this.child.properties.scale.copy(this.properties.childscale).multiplyScalar(1.2);
      if (ev.data.distance < 4) {
        this.hover();
      } else {
        this.unhover();
      }
    }
    this.mousemove = function(ev) {
      if (ev.data.distance < 4) {
        this.hover();
      } else {
        this.unhover();
      }
    }
    this.mouseout = function(ev) {
      //this.child.properties.scale.copy(this.properties.childscale);
      this.unhover();
    }
    this.click = function(ev) {
/*
      if (ev.data.distance < 4 && this.properties.url) {
        this.frame.material.emissive.setHex(0x662222);
        this.properties.janus.setActiveRoom(this.properties.url, [0,0,0]);
        setTimeout(elation.bind(this, function() { this.frame.material.emissive.setHex(0x222222); }), 250);
        elation.events.fire({element: this, type: 'janusweb_portal_click'});
      }
*/
      this.open();
    }
    this.open = function() {
console.log('open room!', this.room);
      if (!this.room) {
        this.room = this.janus.load(this.properties.url);
        console.log('load that room', this.room);
        var rt = new THREE.WebGLRenderTarget(1024, 1024, {format: THREE.RGBAFormat });
        var scene = new THREE.Scene();
        scene.add(this.room.objects['3d']);
console.log(this.engine);
        var userdata = this.engine.client.player.camera.camera.userData;
        this.engine.client.player.camera.camera.userData = {};
        var cam = new THREE.PerspectiveCamera();//.copy(this.engine.client.player.camera.camera);
        this.engine.client.player.camera.camera.userData = userdata;
cam.position.set(0,1.6,-3);
scene.add(cam);
    
        var renderer = this.engine.systems.render.renderer;
        console.log('dude yeah', rt, scene, cam, renderer);
renderer.autoClear = false;

        this.material.map = rt;
        this.portalrender = {
          scene: scene,
          camera: cam,
          rendertarget: rt
        };

        this.updatePortal();
        elation.events.add(this.engine.systems.render.views.main, 'render_view_prerender', elation.bind(this, this.updatePortal));
      }
      this.portalstate = 'open';
    }
    this.updatePortal = function() {
      var renderer = this.engine.systems.render.renderer;

      var player = this.engine.client.player;
      var playerpos = player.parent.localToWorld(player.properties.position.clone());
      var portalpos = this.parent.localToWorld(this.properties.position.clone());
      var startpos = new THREE.Vector3().fromArray(this.room.playerstartposition);

      var diff = playerpos.clone().sub(portalpos).add(startpos);

      //this.portalrender.camera.position.copy(this.engine.client.player.properties.position);
      //this.portalrender.camera.position.copy(diff);
      this.portalrender.camera.updateProjectionMatrix();
      this.portalrender.camera.position.copy(diff);
      //this.portalrender.camera.position.fromArray(this.room.playerstartposition);
      this.portalrender.camera.lookAt(startpos);


      renderer.render(this.portalrender.scene, this.portalrender.camera, this.portalrender.rendertarget, true);
      renderer.setRenderTarget(null);
//this.material.needsUpdate = true;
    }
    this.close = function() {
      this.portalstate = 'closed';
    }
  }, elation.engine.things.portal);
});
