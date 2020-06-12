elation.require(['engine.things.generic'], function() {
  elation.component.add('engine.things.januswebsurface', function() {
    this.postinit = function() {
      elation.engine.things.januswebsurface.extendclass.postinit.call(this);
      this.defineProperties({
        websurface_id: { type: 'string' },
        image_id: { type: 'string' },
        color: { type: 'color', default: 0xffffff },
        hovercolor: { type: 'color', default: 0x009900 },
        activecolor: { type: 'color', default: 0x00ff00 }
      });
      var websurface = this.room.websurfaces[this.properties.websurface_id];
      if (websurface) {
        var url = websurface.src;
        if (url && !url.match(/^(https?:)?\/\//)) {
          url = this.room.baseurl + url;
        }
        // So...it turns out this is a bad time to be doing this sort of 3d iframe hackery in the browser.
        // The internet is slowly transitioning from HTTP to HTTPS, but we're currently only at about 50%
        // encrypted.  Within the Janus community this is even lower, around 10%.  Due to browser security
        // concerns, WebVR content must be run on HTTPS since it's considered a "powerful new feature" and
        // browser developers are using this as a wedge to drive the internet towards greater adoption of
        // HTTPS.  This requirement combines with the "HTTPS sites must not load any unencrypted resources"
        // restriction to mean that we can only show WebSurfaces of HTTPS websites.

        // As a last-ditch effort, we'll try loading the page as HTTPS even if the user specified HTTP,
        // and hope that most sites are running both.

        this.url = url.replace(/^http:/, 'https:');
      }

      // FIXME - binding of member functions should happen at object creation
      this.deactivate = elation.bind(this, this.deactivate);
      this.activate = elation.bind(this, this.activate);

      // Used for debouncing clicks
      this.lastinteraction = performance.now();
      this.cooldown = 200;

      elation.events.add(this, 'mouseover', elation.bind(this, this.hover));
      elation.events.add(this, 'mouseout', elation.bind(this, this.unhover));
      elation.events.add(this, 'click', elation.bind(this, this.click));
    }
    this.createObject3D = function() {
      var plane = new THREE.PlaneBufferGeometry(1,1);

      var mat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        opacity: 0,
        transparent: true,
        blending: THREE.NoBlending,
        side: THREE.DoubleSide
      });

      var selectionmat = new THREE.MeshBasicMaterial({
        color: this.hovercolor,
        blending: THREE.NormalBlending,
        opacity: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnit: 10
      });
      this.material = mat;

      //plane.applyMatrix(new THREE.Matrix4().makeTranslation(.5,-.5,0));
      var obj = new THREE.Mesh(plane, mat);

      var selection = new THREE.Mesh(plane, selectionmat);
      var ratio = this.scale.x / this.scale.y;
      selection.scale.set(1 + this.scale.x / 100,1 + this.scale.y / 100, 1);
      selection.position.z = -.01;
      obj.add(selection);
      selection.visible = false;
      this.selection = selection;
      this.selectionmaterial = selectionmat;

      return obj;
    }
    this.createObjectDOM = function() {
        var websurface = this.room.websurfaces[this.properties.websurface_id];
        if (websurface) {
          var width = websurface.width || 1024,
              height = websurface.height || 768;

          var iframe = elation.html.create('iframe');
          iframe.src = this.url;
          iframe.allow = 'xr-spatial-tracking';
          var div = elation.html.create('div');
          div.className = 'janusweb_websurface ';
          div.appendChild(iframe);
          div.style.width = width + 'px';
          div.style.height = height + 'px';
          iframe.style.width = width + 'px';
          iframe.style.height = height + 'px';

          var obj = new THREE.CSS3DObject(div);
          obj.scale.set(1/width, 1/height, 1);

          this.iframe = iframe;
          this.domobj = obj;
        }
    }
    this.activate = function() {
      if (!this.active) {
        var canvas = this.engine.client.view.rendersystem.renderer.domElement;
        canvas.style.pointerEvents = 'none';
        canvas.style.position = 'absolute';
        this.engine.systems.controls.releasePointerLock();
        this.active = true;
        this.selectionmaterial.color.copy(this.activecolor);
setTimeout(elation.bind(this, function() {
        elation.events.add(window, 'click,dragover,focus', this.deactivate);
}), 10);
        this.lastinteraction = performance.now();
      }
    }
    this.deactivate = function(ev) {
      if (this.active) {
        var canvas = this.engine.client.view.rendersystem.renderer.domElement;
        canvas.style.pointerEvents = 'all';
        canvas.style.position = 'static';
        this.engine.systems.controls.requestPointerLock();
        ev.stopPropagation();
        ev.preventDefault();
        this.selection.visible = false;
        this.active = false;
        elation.events.remove(window, 'click,dragover,focus', this.deactivate);
        this.lastinteraction = performance.now();
      }
    }
    this.click = function(ev) {
      var now = performance.now();
      if (!this.active && ev.button == 0 && now - this.lastinteraction > this.cooldown) {
        this.activate();
        ev.stopPropagation();
        ev.preventDefault();
      }

    }
    this.hover = function() {
      this.selection.visible = true;
      this.selectionmaterial.color.copy(this.active ? this.activecolor : this.hovercolor);
      if (this.selection.material !== this.selectionmaterial) this.selection.material = this.selectionmaterial;
      //this.material.color.setHex(0xff0000);
    }
    this.unhover = function() {
      if (!this.active) {
        this.selection.visible = false;
      }
      this.selectionmaterial.color.copy(this.active ? this.activecolor : this.hovercolor);
      //this.material.color.setHex(0x000000);
    }
    this.start = function() {
      if (!this.started) {
        this.objects['3d'].add(this.domobj);
        this.started = true;
      }
    }
    this.stop = function() {
      if (this.started) {
        this.started = false;
        this.objects['3d'].remove(this.domobj);
      }
    }
  }, elation.engine.things.janusbase);
});

