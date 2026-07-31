janus.registerElement('xrmenu', {
  buttonwidth: .1,
  buttonheight: .1,
  buttonmargin: 1.2,

  create() {
/*
    this.backing = this.createObject('object', {
      id: 'plane',
      col: '#111',
      scale: V(0, 0, 1),
      pos: V(0, 0, 0),
      renderorder: 9,
    });
*/
    console.log("creating xrmenu")

    this.worldpos = V();
    this.worlddir = V();
    this.playervec = V();

    this.panels = {};

    let xrmenu = janus.ui.apps.default.apps.xrmenu;
    if (!xrmenu) return;
    let asseturl = xrmenu.resolveFullURL('./xrmenu-assets.json');
    fetch(asseturl).then(res => res.json()).then(assetlist => {
      this.assetpack = elation.engine.assets.loadJSON(assetlist, xrmenu.resolveFullURL('./'));

/*
  * Navigation
    * Home
    * Respawn
    * Exit VR
    * Refresh
  * Sound
    * Output
      * Output Select
      * Volume Levels
        * Environment
        * Media
        * Voices
    * Input
      * Input Select
      * Volume Levels
  * Settings
*/

      this.buttons = {
        home: this.createObject('xrmenu-button', {
          pos: V(.08, 0, 0),
          label: 'Home',
          image_id: 'xrmenu-button-home',
          //onactivate: (ev) => janus.navigateHome(),
        }),
        back: this.createObject('xrmenu-button', {
          pos: V(.20, 0, 0),
          label: 'Back',
          image_id: 'xrmenu-button-back',
          //onactivate: (ev) => janus.navigateBack(),
        }),
        reset: this.createObject('xrmenu-button', {
          pos: V(.32, 0, 0),
          label: 'Reset',
          image_id: 'xrmenu-button-reset',
          //onactivate: (ev) => player.reset_position(),
        }),
        reload: this.createObject('xrmenu-button', {
          pos: V(.44, 0, 0),
          label: 'Reload',
          image_id: 'xrmenu-button-reload',
          //onactivate: (ev) => location.reload(),
        }),
        exitvr: this.createObject('xrmenu-button', {
          pos: V(.56, 0, 0),
          label: 'Exit VR',
          //image_id: 'xrmenu-button-exitvr',
          //onactivate: (ev) => this.engine.client.stopXR(),
        }),
        sound: this.createObject('xrmenu-button', {
          pos: V(.56, 0, 0),
          label: 'Exit VR',
          image_id: 'xrmenu-button-sound',
          //onactivate: (ev) => this.engine.client.stopXR(),
        }),
        teleport: this.createObject('xrmenu-button', {
          pos: V(.68, 0, 0),
          label: 'Teleport',
          image_id: 'xrmenu-button-teleport',
          toggle: true,
          enabled: room.teleport,
          //onactivate: (ev) => this.engine.client.stopXR(),
        }),
      };
      this.buttons.home.addEventListener('activate', ev => janus.navigateHome());
      this.buttons.back.addEventListener('activate', ev => janus.navigateBack());
      this.buttons.reset.addEventListener('activate', ev => player.reset_position());
      this.buttons.reload.addEventListener('activate', ev => location.reload());
      this.buttons.exitvr.addEventListener('activate', ev => this.engine.client.stopXR());
      this.buttons.sound.addEventListener('activate', ev => this.toggleSound());
      this.buttons.teleport.addEventListener('activate', ev => this.toggleTeleport());
      this.reflow();
    });
  },
  reflow() {
    let buttonnames = Object.keys(this.buttons);
    let width = this.buttonwidth * buttonnames.length * this.buttonmargin,
        height = this.buttonheight * this.buttonmargin;
    //this.backing.scale.x = width;
    //this.backing.scale.y = height;

    for (let i = 0; i < buttonnames.length; i++) {
      let button = this.buttons[buttonnames[i]];
      button.pos.x = (-width / 2) + (this.buttonwidth * this.buttonmargin * (i + .5)) ;
    }
  },
  toggleSound(){
    if (!this.panels['sound']) {
      this.panels['sound'] = this.buttons.sound.createObject('xrmenu-popup', {
        content: 'janus-voip-picker'
      });
    } else {
      if (this.panels['sound'].parent === this.buttons.sound) {
        this.buttons.sound.removeChild(this.panels['sound']);
      } else {
        this.buttons.sound.appendChild(this.panels['sound']);
      }
    }
  },
  toggleTeleport(){
    room.teleport = !room.teleport
    this.buttons.teleport.state(room.teleport)
  },
/*
  update() {
    let worldpos = this.localToWorld(this.worldpos.set(0,0,0));
    let worlddir = this.localToWorld(this.worlddir.set(0,0,1)).sub(worldpos).normalize();
    let playervec = player.head.localToWorld(this.playervec.set(0,0,0)).sub(worldpos).normalize();
    let dot = playervec.dot(worlddir);
    let opacity = Math.max(0, dot);
    for (let k in this.buttons) {
      if (this.buttons[k].button) {
        this.buttons[k].button.opacity = opacity;
      }
    }
    //this.backing.opacity = opacity;
  },
*/
});
janus.registerElement('xrmenu-button', {
  onactivate: null,
  image_id: '',
  toggle: false,
  enabled: true,

  create() {
    this.button = this.createObject('object', {
      id: 'plane',
      scale: V(.1, .1, .02),
      col: '#fff',
      pos: V(0, 0, this.enabled ? 0.01 : 0 ),
      collision_id: 'cube',
      image_id: this.image_id,
      renderorder: 10,
      emissive: this.enabled ? (this.toggle ? '#FFF' : '#595')
                             : '#555',
    });
    this.button.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.button.addEventListener('mouseout', ev => this.handleMouseOut(ev));
    this.button.addEventListener('mousedown', ev => this.handleMouseDown(ev));
    this.button.addEventListener('mouseup', ev => this.handleMouseUp(ev));
    this.button.addEventListener('click', ev => this.handleClick(ev));
  },
  handleMouseOver(ev) {
    if( this.toggle ) return
    this.button.emissive = '#595';
  },
  handleMouseOut(ev) {
    if( this.toggle ) return
    this.button.emissive = '#555';
  },
  handleMouseDown(ev) {
    this.button.pos.z = 0;
  },
  handleMouseUp(ev) {
    this.button.pos.z = .01;
  },
  state(enabled){
    this.button.emissive = (this.enabled = enabled) ? '#FFF' : '#555'
    this.button.pos.z = enabled ? .01 : 0
  },
  handleClick(ev) {
    this.dispatchEvent({type: 'activate'});
  },
});
janus.registerElement('xrmenu-popup', {
  content: 'ui-content',
  contentattrs: null,
  element: null,
  width: 512,
  height: 512,
  depth_test: true,
  renderorder: 0,

  create() {

    let attrs = { deferred: false };
    if (this.contentattrs) {
      for (let k in this.contentattrs) attrs[k] = this.contentattrs[k];
    }
    let element = elation.elements.create(this.content, attrs);

    this.usenativecanvas = (typeof element.getCanvasBackend == 'function' && element.getCanvasBackend() == 'element');
    if (!this.usenativecanvas) {
      // svg backend: stage the element in a hidden shadow container with the
      // page stylesheets cloned in, so foreignObject serialization can see
      // real layout
      let container = document.createElement('div');
      this.shadowdom = container.attachShadow({mode: 'open'});

      setTimeout(() => {
        this.initShadowStylesheets();
      }, 0);
      let a = document.createElement('html');
      let b = document.createElement('body');
      b.className = 'dark janusweb';
      a.appendChild(b);
      this.shadowdom.appendChild(a);
      b.appendChild(element);
      document.body.appendChild(container);

      elation.events.add(element, 'styleupdate', ev => {
        this.initShadowStylesheets();
      });

      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.zIndex = -1000;
      container.style.width = this.width + 'px';
      container.style.height = this.height + 'px';
      container.style.overflow = 'hidden';
      container.style.opacity = 0;
      container.style.pointerEvents = 'none';

      this.elementcontainer = container;
    }
    // element backend: toCanvas() stages the element inside its own
    // layoutsubtree canvas - elementcontainer is assigned in
    // initElementCanvas once the canvas exists

    this.initElementCanvas();

    this.plane = this.createObject('object', {
      id: 'plane',
      collision_id: (this.pickable === false && this.collidable === false) ? '' : 'cube',
      collision_scale: V(1, 1, .0001),
      pickable: this.pickable !== false,
      collidable: this.collidable !== false,
      lighting: false,
      //image_id: 'xrmenu-element-canvas',
      scale: V(1, this.height / this.width, 1),
      depth_test: this.depth_test,
      renderorder: this.renderorder,
    });
    this.element = element;
    // Native input mode delivers REAL events straight to the content, so
    // focus can arrive without handleMouse ever running - park the player
    // from the focus event itself (idempotent with the synthetic path).
    element.addEventListener('focusin', ev => this.manageFocus(ev.target));
    this.plane.addEventListener('mousemove', ev => this.handleMouse(ev));
    this.plane.addEventListener('mousedown', ev => this.handleMouse(ev));
    this.plane.addEventListener('wheel', ev => this.handleMouse(ev));
    this.plane.addEventListener('mouseup', ev => this.handleMouse(ev));
    this.plane.addEventListener('click', ev => this.handleMouse(ev));
    this.plane.addEventListener('mouseover', ev => this.handleMouseOver(ev));
    this.plane.addEventListener('mouseout', ev => this.handleMouseOut(ev));
  },
  initElementCanvas() {
    let element = this.element;

    // element backend connects the element itself (toCanvas reparents it
    // into the staging canvas), so only the svg path needs to wait for the
    // shadow container hookup
    if (!(element && element.toCanvas && (this.usenativecanvas || element.isConnected))) {
      setTimeout(() => this.initElementCanvas(), 100);
      return;
    }

    let canvas = element.toCanvas(this.width, this.height, 1);
    if (this.usenativecanvas) {
      // the staging canvas plays the container role: same hover lifecycle
      // (z-index + pointer-events) as the shadow container on the svg path.
      // Its bitmap is kept cleared by the pipeline, so raising it never
      // shows anything.
      this.elementcontainer = element.stagingcanvas;
    }
/*
document.body.appendChild(canvas);
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = 1000;
canvas.style.border = '1px solid red';
*/
    this.loadNewAsset('image', {
      id: 'xrmenu-element-canvas',
      canvas: canvas,
      transparent: true,
    });
    this.plane.image_id = 'xrmenu-element-canvas';
    this.canvas = canvas;
    elation.events.add(canvas, 'asset_update', ev => this.refresh());

    element.updateStylesheets(elation.engine.assets.corsproxy).then(d => {
      element.updateCanvas();
      this.refresh();
    });

  },
  initShadowStylesheets() {
    let promises = [];
    for (let i = 0; i < document.styleSheets.length; i++) {
      //promises.push(new Promise(accept => {
        if (document.styleSheets[i].href ) {
          // external stylesheet
          let styleel = document.createElement('link');
          styleel.rel = 'stylesheet';
          styleel.href = elation.engine.assets.getProxiedURL(document.styleSheets[i].href);
          this.shadowdom.appendChild(styleel);
        } else if (document.styleSheets[i].cssRules.length > 0) {
          // inline <style>  definition
          let txt = '';
          let sheet = document.styleSheets[i];
          for (let i = 0; i < sheet.cssRules.length; i++) {
            txt += sheet.cssRules[i].cssText + '\n';
          }
          let styleel = document.createElement('style');
          styleel.appendChild(document.createTextNode(txt));
          this.shadowdom.appendChild(styleel);
        }
      //}));
    }
/*
    Promise.all(promises).then(() => {
console.log('stylesheets loaded!');
setTimeout(() => {
      this.element.updateCanvas().then(() => this.refresh());
}, 400);
    });
*/
  },
  handleMouse(ev) {
    if (this.element && this.canvas) {
      let mousexy = [ev.data.uv.x * this.canvas.width, (1 - ev.data.uv.y) * this.canvas.height];
      let EventClass = (ev.type == 'wheel' ? WheelEvent : MouseEvent);
      // The picking system clones the source event's details (button,
      // modifiers, wheel deltas) onto the event it fires - carry them into
      // the synthetic event so widgets like CodeMirror see real input.
      // composed: true lets the events cross the staging container's
      // shadow boundary, which document-level drag handlers rely on.
      let src = ev;
      let init = {
        bubbles: true,
        cancelable: true,
        composed: true,
        screenX: mousexy[0],
        screenY: mousexy[1],
        clientX: mousexy[0],
        clientY: mousexy[1],
        button: src.button || 0,
        buttons: src.buttons || 0,
        shiftKey: !!src.shiftKey,
        ctrlKey: !!src.ctrlKey,
        altKey: !!src.altKey,
        metaKey: !!src.metaKey,
        view: window,
      };
      if (ev.type == 'wheel') {
        init.deltaX = src.deltaX || 0;
        init.deltaY = src.deltaY || 0;
        init.deltaZ = src.deltaZ || 0;
        init.deltaMode = 0;  // deltas are normalized to pixels below
        let scale = (src.deltaMode == 1 ? 20 : (src.deltaMode == 2 ? this.canvas.height : 1));
        init.deltaX *= scale;
        init.deltaY *= scale;
      }
      let fakeev = new EventClass(ev.type, init);
      // svg backend stages in a shadow root; element backend's staging
      // canvas children are plain document elements
      let root = this.shadowdom || document;
      let target = root.elementFromPoint(mousexy[0], mousexy[1]) || this.element;
      if (this.usenativecanvas && target && !this.element.contains(target) && target !== this.element) {
        // hit something that isn't ours (another overlay at this z) - fall
        // back to our element so events never leak to unrelated UI
        target = this.element;
      }

      target.dispatchEvent(fakeev);

      if (ev.type == 'mousedown' || ev.type == 'click') {
        // If the content focused one of its own inputs in response (the way
        // CodeMirror focuses its hidden textarea on mousedown), keep that
        // focus so keyboard input flows to the panel. Deferred a task:
        // widgets defer the focus call themselves (CodeMirror wraps its
        // ensureFocus in a setTimeout on webkit), so checking synchronously
        // sees nothing.
        setTimeout(() => {
          let active = this.getContentActiveElement();
          if (active) this.manageFocus(active);
        }, 0);
      }

      if (ev.type == 'wheel') {
        if (!fakeev.defaultPrevented) {
          this.scrollFromWheel(target, init.deltaX, init.deltaY);
        }
        // consume the wheel so it doesn't also scroll/zoom the page behind us
        if (typeof ev.preventDefault == 'function') ev.preventDefault();
      }

      if (ev.type == 'mousemove') {
        if (target !== this.currenttarget) {
          if (this.currenttarget) {
            let mouseout = new EventClass('mouseout', init);
            this.currenttarget.dispatchEvent(mouseout);
          }
          this.currenttarget = target;
          let mousemove = new EventClass('mousemove', init);
          this.currenttarget.dispatchEvent(mousemove);
          let mouseover = new EventClass('mouseover', init);
          target.dispatchEvent(mouseover);
        }
      }
    }
  },
  scrollFromWheel(target, deltaX, deltaY) {
    // Synthetic events are untrusted, so dispatching a wheel never performs
    // the browser's default scroll - walk up from the target and do it
    // ourselves on the nearest scrollable element.
    let el = target;
    while (el && el != this.elementcontainer && el.nodeType == 1) {
      let canscrolly = deltaY && el.scrollHeight > el.clientHeight + 1,
          canscrollx = deltaX && el.scrollWidth > el.clientWidth + 1;
      if (canscrolly || canscrollx) {
        let style = getComputedStyle(el);
        if ((canscrolly && (style.overflowY == 'auto' || style.overflowY == 'scroll')) ||
            (canscrollx && (style.overflowX == 'auto' || style.overflowX == 'scroll'))) {
          el.scrollTop += deltaY;
          el.scrollLeft += deltaX;
          return;
        }
      }
      el = el.parentNode instanceof ShadowRoot ? null : el.parentNode;
    }
  },
  handleMouseOver(ev) {
    // raise the staging container so elementFromPoint hit-tests our content
    this.hovering = true;
    this.elementcontainer.style.zIndex = 1000;
    this.elementcontainer.style.pointerEvents = 'auto';
    if (!this.elementcontainer.parentNode) {
      document.body.appendChild(this.elementcontainer);
    }
    this.enterNativeInput();
  },
  handleMouseOut(ev) {
    // Sink and disable the container, but NEVER detach it: pulling it out
    // of the DOM destroys layout, which zeroes every scroll position and
    // makes any re-render while detached serialize to a blank panel.
    // pointer-events none keeps the invisible overlay from intercepting
    // real page input while parked.
    this.hovering = false;
    this.exitNativeInput();
    this.elementcontainer.style.zIndex = -1000;
    this.elementcontainer.style.pointerEvents = 'none';
  },
  // ---- native desktop input (element backend only) --------------------
  // While the 3D pointer is on the plane, project the panel's quad into
  // screen space every frame and park the live element's hit target there
  // with a CSS matrix3d (transforms on layoutsubtree children never affect
  // the rendered texture - they only move the hit target). The browser
  // then delivers REAL events: text selection, IME, context menus, native
  // wheel. VR and pointer-locked mouselook keep the synthetic path.
  enterNativeInput() {
    if (!this.usenativecanvas || this.nativemode) return;
    if (document.pointerLockElement) return;
    try {
      let renderer = this.engine.systems.render.renderer;
      if (renderer && renderer.xr && renderer.xr.isPresenting) return;
    } catch (e) {}
    this.nativemode = true;
    this.element.style.transformOrigin = '0 0';
    if (!this.nativeleavehandler) {
      this.nativeleavehandler = ev => this.exitNativeInput();
      this.nativelockhandler = ev => { if (document.pointerLockElement) this.exitNativeInput(); };
      this.nativemouseshim = ev => this.handleNativeMouse(ev);
    }
    this.element.addEventListener('mouseleave', this.nativeleavehandler);
    document.addEventListener('pointerlockchange', this.nativelockhandler);
    // Pointer events need coordinate correction (see handleNativeMouse);
    // wheel, keyboard, IME, and context menus stay fully native.
    for (let type of ['mousedown', 'mouseup', 'mousemove', 'click']) {
      this.element.addEventListener(type, this.nativemouseshim, true);
    }
    let update = () => {
      if (!this.nativemode) return;
      this.updateNativeTransform();
      this.nativeraf = requestAnimationFrame(update);
    };
    update();
  },
  exitNativeInput() {
    if (!this.nativemode) return;
    this.nativemode = false;
    cancelAnimationFrame(this.nativeraf);
    this.element.removeEventListener('mouseleave', this.nativeleavehandler);
    document.removeEventListener('pointerlockchange', this.nativelockhandler);
    for (let type of ['mousedown', 'mouseup', 'mousemove', 'click']) {
      this.element.removeEventListener(type, this.nativemouseshim, true);
    }
    this.element.style.transform = 'none';
    this.nativeH = null;
  },
  handleNativeMouse(ev) {
    // The browser hit-tests correctly through the matrix3d, but widgets
    // that do their own coordinate math (CodeMirror subtracts bounding
    // rects from clientX/Y as if space were untransformed) mis-map the
    // position under perspective. Swallow the trusted event and re-dispatch
    // it at the unprojected panel-local coordinates with the transform
    // momentarily cleared, so every rect a handler measures is in the same
    // untransformed space as the coordinates.
    if (!ev.isTrusted || !this.nativemode || !this.nativeH) return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    let local = this.unprojectPoint(ev.clientX, ev.clientY);
    if (!local) return;
    let init = {
      bubbles: true, cancelable: true, composed: true,
      clientX: local[0], clientY: local[1],
      screenX: local[0], screenY: local[1],
      button: ev.button, buttons: ev.buttons,
      shiftKey: ev.shiftKey, ctrlKey: ev.ctrlKey, altKey: ev.altKey, metaKey: ev.metaKey,
      detail: ev.detail, view: window,
    };
    let transform = this.element.style.transform;
    this.element.style.transform = 'none';
    try {
      ev.target.dispatchEvent(new MouseEvent(ev.type, init));
    } finally {
      this.element.style.transform = transform;
    }
  },
  unprojectPoint(x, y) {
    // inverse of the stored local->screen homography
    let t = this.nativeH;
    if (!t) return null;
    let a = [
      t[4]*t[8]-t[5]*t[7], t[2]*t[7]-t[1]*t[8], t[1]*t[5]-t[2]*t[4],
      t[5]*t[6]-t[3]*t[8], t[0]*t[8]-t[2]*t[6], t[2]*t[3]-t[0]*t[5],
      t[3]*t[7]-t[4]*t[6], t[1]*t[6]-t[0]*t[7], t[0]*t[4]-t[1]*t[3]
    ];
    let w = a[6]*x + a[7]*y + a[8];
    if (!isFinite(w) || Math.abs(w) < 1e-12) return null;
    return [ (a[0]*x + a[1]*y + a[2]) / w, (a[3]*x + a[4]*y + a[5]) / w ];
  },
  updateNativeTransform() {
    let obj3d = this.plane && this.plane.objects ? this.plane.objects['3d'] : null;
    let views = this.engine.systems.render ? this.engine.systems.render.views : null;
    let view = views ? (views.main || views[Object.keys(views)[0]]) : null;
    let camera = view ? view.actualcamera : null;
    let renderer = this.engine.systems.render.renderer;
    if (!obj3d || !camera || !renderer) return;
    let rect = renderer.domElement.getBoundingClientRect();
    obj3d.updateMatrixWorld();
    // plane geometry is a unit quad centered at the object origin; element
    // pixel (0,0) is its top-left corner
    let corners = [ V(-0.5, 0.5, 0), V(0.5, 0.5, 0), V(-0.5, -0.5, 0), V(0.5, -0.5, 0) ];
    let pts = [];
    for (let i = 0; i < 4; i++) {
      let p = corners[i].applyMatrix4(obj3d.matrixWorld).project(camera);
      // behind the camera or absurdly outside the frustum: bail out rather
      // than feed the solver a degenerate quad
      if (!isFinite(p.x) || !isFinite(p.y) || p.z > 1 || Math.abs(p.x) > 20 || Math.abs(p.y) > 20) {
        this.element.style.transform = 'none';
        this.nativeH = null;
        return;
      }
      pts.push([ rect.left + (p.x * 0.5 + 0.5) * rect.width, rect.top + (-p.y * 0.5 + 0.5) * rect.height ]);
    }
    let t = this.projectQuad(this.width, this.height, pts);
    if (t) this.element.style.transform = t;
  },
  projectQuad(w, h, pts) {
    // 2D projective mapping (0,0),(w,0),(0,h),(w,h) -> pts, as a CSS
    // matrix3d (the classic adjugate-basis homography construction)
    let adj = m => [
      m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4],
      m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5],
      m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3]
    ];
    let mulmm = (a, b) => {
      let c = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        c[3*i+j] = a[3*i]*b[j] + a[3*i+1]*b[3+j] + a[3*i+2]*b[6+j];
      }
      return c;
    };
    let mulmv = (m, v) => [
      m[0]*v[0]+m[1]*v[1]+m[2]*v[2],
      m[3]*v[0]+m[4]*v[1]+m[5]*v[2],
      m[6]*v[0]+m[7]*v[1]+m[8]*v[2]
    ];
    let basis = (p1, p2, p3, p4) => {
      let m = [p1[0], p2[0], p3[0], p1[1], p2[1], p3[1], 1, 1, 1];
      let v = mulmv(adj(m), [p4[0], p4[1], 1]);
      return mulmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
    };
    let s = basis([0, 0], [w, 0], [0, h], [w, h]);
    let d = basis(pts[0], pts[1], pts[2], pts[3]);
    let t = mulmm(d, adj(s));
    if (!isFinite(t[8]) || t[8] === 0) return null;
    for (let i = 0; i < 9; i++) t[i] /= t[8];
    this.nativeH = t.slice(0, 9);
    let m3d = [t[0], t[3], 0, t[6],
               t[1], t[4], 0, t[7],
               0, 0, 1, 0,
               t[2], t[5], 0, t[8]];
    return 'matrix3d(' + m3d.map(n => (isFinite(n) ? n.toFixed(8) : 0)).join(',') + ')';
  },
  getContentActiveElement() {
    // svg backend: focus lives inside the shadow root (document.activeElement
    // only reports the host). element backend: plain document focus, filtered
    // to descendants of our content.
    if (this.shadowdom) return this.shadowdom.activeElement;
    let active = document.activeElement;
    if (active && this.element && (active === this.element || this.element.contains(active))) return active;
    return null;
  },
  manageFocus(focusable) {
    // The engine view refocuses itself after processing every click, so
    // take focus back on a fresh task - and park the player while we hold
    // it, or WASD would move the world under the typist (the controls
    // system listens on window; focus alone doesn't shield it).
    clearTimeout(this.focustimer);
    this.focustimer = setTimeout(() => focusable.focus({ preventScroll: true }), 0);
    if (!this.contentfocused) {
      this.contentfocused = true;
      if (typeof player != 'undefined' && player.enabled) {
        this.shouldreenableplayer = true;
        player.disable();
      }
      if (!this.releasefocushandler) {
        // a real mousedown anywhere while the 3D pointer isn't on our plane
        // means the user clicked away - hand everything back
        this.releasefocushandler = ev => {
          if (!this.hovering && this.contentfocused && ev.isTrusted) this.releaseFocus();
        };
      }
      document.addEventListener('mousedown', this.releasefocushandler, true);
    }
  },
  releaseFocus() {
    if (!this.contentfocused) return;
    this.contentfocused = false;
    clearTimeout(this.focustimer);
    document.removeEventListener('mousedown', this.releasefocushandler, true);
    let active = this.getContentActiveElement();
    if (active) active.blur();
    if (this.shouldreenableplayer) {
      this.shouldreenableplayer = false;
      if (typeof player != 'undefined') player.enable();
    }
  },
});
