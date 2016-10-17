elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusportal', function() {
    this.postinit = function() {
      this.defineProperties({
        'url': { type: 'string' },
        'title': { type: 'string' },
        'janus': { type: 'object' },
        //'color': { type: 'color', default: new THREE.Color(0xffffff), set: this.updateMaterial },
        'url': { type: 'string', set: this.updateTitle },
        'open': { type: 'boolean', default: false },
        'title': { type: 'string', set: this.updateTitle },
        'seamless': { type: 'boolean', default: false },
        'draw_text': { type: 'boolean', default: true, set: this.updateTitle },
        'draw_glow': { type: 'boolean', default: true, refreshGeometry: true},
        'auto_load': { type: 'boolean', default: false },
        'thumb_id': { type: 'string', set: this.updateMaterial }
      });
      this.addTag('usable');
      elation.engine.things.janusportal.extendclass.postinit.call(this);
      elation.events.add(this, 'thing_use_focus', elation.bind(this, this.useFocus));
      elation.events.add(this, 'thing_use_blur', elation.bind(this, this.useBlur));
    }
    this.createObject3D = function() {
      var thickness = 0.05;
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

      var framemat = new THREE.MeshPhongMaterial({color: 0x0000cc, emissive: 0x222222});
      var frame = new THREE.Mesh(framegeo, framemat);
      this.frame = frame;
      mesh.add(frame);
      this.material = mat;
      this.geometry = box;

      return mesh;
    }
    this.createChildren = function() {
/*
      if (this.auto_load) {
        this.openPortal();
      }
*/
    }
    this.updateTitle = function() {
      if (this.draw_text) {
        var title = this.title || this.url;
        if (title && title.length > 0) {
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
      this.openPortal();
    }
    this.activate = function() {
      if (this.frame) {
        this.frame.material.emissive.setHex(0x662222);
        setTimeout(elation.bind(this, function() { this.frame.material.emissive.setHex(0x222222); }), 250);
      }
      if (this.seamless) {
        if (!this.open) {
          this.openPortal();
        } else {
          this.closePortal();
        }
      } else {
        this.properties.janus.setActiveRoom(this.properties.url, [0,0,0]);
      }
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
    this.openPortal = function() {
      if (!this.portalroom) {
        this.portalroom = this.janus.load(this.properties.url, false);
        console.log('load that room', this.portalroom);
        var rt = new THREE.WebGLRenderTarget(1024, 1024, {format: THREE.RGBAFormat });
        var scene = new THREE.Scene();
        scene.add(this.portalroom.objects['3d']);
        var userdata = this.engine.client.player.camera.camera.userData;
        this.engine.client.player.camera.camera.userData = {};
        var cam = new THREE.PerspectiveCamera();//.copy(this.engine.client.player.camera.camera);
        this.engine.client.player.camera.camera.userData = userdata;
//cam.position.set(0,1.6,-3);
scene.add(cam);
    
        var renderer = this.engine.systems.render.renderer;
        console.log('dude yeah', rt, scene, cam, renderer);
renderer.autoClear = false;

        this.material.map = rt.texture;
        this.portalrender = {
          scene: scene,
          camera: cam,
          rendertarget: rt
        };

        this.janus.subscribe(this.url);
        this.updatePortal();
        elation.events.add(this.engine.systems.render.views.main, 'render_view_prerender', elation.bind(this, this.updatePortal));
      }
      this.open = true;
      this.portalstate = 'open';
      elation.events.fire({element: this, type: 'janusweb_portal_open'});
    }
    this.updatePortal = function() {
      if (this.open) {
        var renderer = this.engine.systems.render.renderer;

        var player = this.engine.client.player;
        var cam = this.engine.systems.render.views.main.actualcamera;
        var portalcam = this.portalrender.camera;
        var playerpos = player.parent.localToWorld(player.properties.position.clone());
        var portalpos = this.parent.localToWorld(this.properties.position.clone());
        var startpos = new THREE.Vector3().fromArray(this.portalroom.playerstartposition);

        var currentRoomRotation = new THREE.Matrix4().extractRotation(this.objects['3d'].matrixWorld);
        var blah = new THREE.Matrix4().makeRotationFromQuaternion(this.portalroom.playerstartorientation);
        var el = blah.elements;
        var otherRoomRotation = new THREE.Matrix4().set(
           el[0],  el[1],  el[2], el[3],
           el[4],  el[5],  el[6], el[7],
           el[8],  el[9],  el[10], el[11],
          el[12], el[13], el[14], el[15]
        );

        var el = otherRoomRotation.elements;
/*
        el[0] *= -1;
        el[2] *= -1;
        el[4] *= -1;
        el[6] *= -1;
        el[9] *= -1;
        el[10] *= -1;
*/

        var rotate = new THREE.Matrix4().multiplyMatrices(currentRoomRotation, otherRoomRotation.transpose());
var mat = new THREE.Matrix4().extractRotation(cam.matrixWorld);
//rotate.multiply(mat);
        //var diff = playerpos.clone().sub(portalpos);
        var diff = portalpos.clone().sub(playerpos);
        //var diff = portalpos.clone();
        //diff.z *= -1;
        var translate = new THREE.Matrix4().setPosition(startpos.add(new THREE.Vector3(0,1.6,0)));

        //portalcam.near = diff.length();
        //portalcam.updateProjectionMatrix();

        //this.portalrender.camera.position.copy(this.engine.client.player.properties.position);
        //this.portalrender.camera.position.copy(diff);
        //this.portalrender.camera.position.fromArray(this.portalroom.playerstartposition);
        //this.portalrender.camera.position.copy(diff).add(new THREE.Vector3(0,1.6,0));
        //this.portalrender.camera.position.copy(diff);
        var eyepos = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);

        this.portalrender.camera.matrixAutoUpdate = false;
/*
        //this.portalrender.camera.matrix.copy(player.camera.objects['3d'].matrixWorld);
        //this.portalrender.camera.matrix.setPosition(diff);

*/
        var matrix = this.portalrender.camera.matrix;
        matrix.copy(translate);
        matrix.multiply(rotate);
        translate.setPosition(startpos);
        matrix.multiply(translate);

        //this.portalrender.camera.lookAt(startpos);
        var zdir = diff.normalize();
        var xdir = new THREE.Vector3().crossVectors(zdir, new THREE.Vector3(0,1,0));
        var ydir = new THREE.Vector3().crossVectors(xdir, zdir);
        matrix.makeBasis(xdir, ydir, zdir);
        var tmpmat = new THREE.Matrix4().makeBasis(xdir.negate(), ydir, zdir.negate());
        matrix.copy(tmpmat);
        matrix.multiply(translate);


        //var cam = player.camera.camera;
        //cam.updateProjectionMatrix();
/*
        var v2 = this.geometry.vertices[1].clone(); // top right back
        var v4 = this.geometry.vertices[3].clone(); // bottom right back
        var v1 = this.geometry.vertices[4].clone(); // top left back
        var v3 = this.geometry.vertices[6].clone(); // bottom left back
*/
        var v1 = this.geometry.vertices[5].clone(); // top left front
        var v2 = this.geometry.vertices[0].clone(); // top right front
        var v3 = this.geometry.vertices[7].clone(); // bottom left front
        var v4 = this.geometry.vertices[2].clone(); // bottom right front
        v1.applyMatrix4(this.objects['3d'].matrixWorld);
        v2.applyMatrix4(this.objects['3d'].matrixWorld);
        v3.applyMatrix4(this.objects['3d'].matrixWorld);
        v4.applyMatrix4(this.objects['3d'].matrixWorld);

        var axis1 = new THREE.Vector3().subVectors(v1, eyepos).normalize(),
            axis2 = new THREE.Vector3().subVectors(v3, eyepos).normalize();
        var fov = Math.acos(axis1.dot(axis2)) * 180/Math.PI;
        var aspect = v1.distanceTo(v2) / v1.distanceTo(v3);
//console.log('fov is ', fov, axis1, axis2, eyepos);

        v1.project(cam);
        v2.project(cam);
        v3.project(cam);
        v4.project(cam);

        var bbox = new THREE.Box3();
        bbox.expandByPoint(v1);
        bbox.expandByPoint(v2);
        bbox.expandByPoint(v3);
        bbox.expandByPoint(v4);
//console.log(bbox.min, bbox.max);

/*
        var p1 = new Plane(),
            p2 = new Plane(),
            p3 = new Plane(),
            p4 = new Plane(),
            p5 = new Plane(),
            p6 = new Plane();

        var fov = 
*/

        //this.portalrender.camera.projectionMatrix.makeFrustum(-0.05, 0.05, -0.05, 0.05, 0.1, 500);

/*
        this.portalrender.camera.fov = fov;
        this.portalrender.camera.aspect = aspect;
        this.portalrender.camera.updateProjectionMatrix();
*/



        renderer.render(this.portalrender.scene, this.portalrender.camera, this.portalrender.rendertarget, true);
        renderer.setRenderTarget(null);
      }
this.material.needsUpdate = true;
    }
    this.closePortal = function() {
      this.portalstate = 'closed';
      this.open = false;
      elation.events.fire({element: this, type: 'janusweb_portal_close'});
    }
  }, elation.engine.things.janusbase);
});
