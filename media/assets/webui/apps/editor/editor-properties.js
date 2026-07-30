elation.elements.registerType('vector3', {
  read(value) {
    if (value instanceof THREE.Vector3) {
      return value;
    } else if (elation.utils.isString(value) && value != 'null') {
      let vec3 = new THREE.Vector3();
      let arr = value.split(' ');
      vec3.fromArray(arr);
      return vec3;
    }
  },
  write(value) {
    if (value) {
      return value.toArray().join(' ');
    }
    return null;
  }
});
elation.elements.registerType('vector2', {
  read(value) {
    if (value instanceof THREE.Vector2) {
      return value;
    } else if (elation.utils.isString(value) && value != 'null') {
      let vec2 = new THREE.Vector2();
      let arr = value.split(' ');
      vec2.fromArray(arr);
      return vec2;
    }
  },
  write(value) {
    if (value) {
      return value.toArray().join(' ');
    }
    return null;
  }
});
elation.elements.registerType('euler', {
  read(value) {
    if (value instanceof THREE.Euler) {
      return value;
    } else if (elation.utils.isString(value)) {
      let euler = new THREE.Euler();
      let arr = value.split(' ');
      euler.fromArray(arr);
      return euler;
    }
  },
  write(value) {
    return value.toArray().join(' ');
  }
});
elation.elements.registerType('color', {
  read(value) {
    if (value instanceof THREE.Color) {
      return value;
    } else if (elation.utils.isString(value)) {
      let color = new THREE.Color();
      let arr = value.split(' ');
      color.fromArray(arr);
      return color;
    }
  },
  write(value) {
    return (value ? value.toArray().join(' ') : 'null');
  }
});
elation.elements.define('janus-ui-editor-property', class extends elation.elements.ui.item {
  create() {
    super.create();
    this.defineAttributes({
      editing: { type: 'boolean', default: false },
      label: { type: 'string' },
      propertyname: { type: 'string' },
      value: { type: 'object' },
    });

    if (this.label) {
      let labelobj = elation.elements.create('ui-text', {
        text: this.label,
        append: this
      });
      // Clicking the label activates the editor's control, like a standard <label>.
      elation.events.add(labelobj, 'click', (ev) => this.activateControl(ev));
    }
  }
  mousedown(ev) {
    // Always (re)fire selection on click, even when this property is already the
    // selected one — the base ui.item suppresses re-selection, which made
    // re-clicking a property (to re-assert its edit mode) a no-op.
    if (this.selectable) {
      this.select(ev);
      ev.stopPropagation();
    }
  }
  activateControl(ev) {
    // Mirror a native <label>: clicking the label activates the editor's control
    // (the first non-label child; the label is a ui-text we create). Prefer the
    // element's own focus() — ui-input.focus() focuses its field, ui-toggle.focus()
    // flips it — and fall back to forwarding the click for controls without focus().
    let control = null;
    for (let i = 0; i < this.children.length; i++) {
      let child = this.children[i];
      if (child.tagName && child.tagName.toLowerCase() != 'ui-text') { control = child; break; }
    }
    if (!control) return;
    if (typeof control.focus == 'function') {
      control.focus();
    } else {
      control.dispatchEvent(new MouseEvent(ev.type, {
        bubbles: true, cancelable: true, view: window,
        clientX: ev.clientX, clientY: ev.clientY, button: ev.button
      }));
    }
  }
  updateValue(value) {
    this.value = value;
  }
  render() {
  }
  focus() {
    this.editing = true;
  }
  resetChangeTimer() {
    if (this.changetimer) {
      clearTimeout(this.changetimer);
    }
    this.changetimer = setTimeout(() => {
      elation.events.fire({type: 'editorchange', element: this, data: this.value});
    }, 350);
  }
  handleInputFocus(ev) {
    this.editing = true;
    console.log('editing', this);
  }
  handleInputBlur(ev) {
    this.editing = false;
    console.log('stop editing', this);
  }
});

elation.elements.define('janus-ui-editor-property-integer', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'integer' },
    });
    this.input = elation.elements.create('ui-input', { name: 'value', label: '', append: this });
    elation.events.add(this.input, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.input, 'blur', (ev) => this.handleInputBlur(ev));
    this.updateValue(this.value);
  }
  render() {
  }
  updateValue(value) {
    this.value = value;
    if (this.elements) {
      if (this.value !== null && typeof this.value != 'undefined' && !isNaN(this.value)) {
        this.input.value = this.value.toString();
      } else {
        this.input.value = '';
      }
    }
  }
});
elation.elements.define('janus-ui-editor-property-float', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'float' },
    });
    this.input = elation.elements.create('ui-input', { name: 'value', label: '', append: this });
    elation.events.add(this.input, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.input, 'blur', (ev) => this.handleInputBlur(ev));
    this.input.addEventListener('input', (ev) => { 
      this.value = this.input.value;
      this.resetChangeTimer();
    });
    this.updateValue(this.value);
  }
  render() {
  }
  updateValue(value) {
    this.value = value;
    if (this.input) {
      if (this.value !== null && typeof this.value != 'undefined' && !isNaN(this.value)) {
        this.input.value = +this.value.toFixed(4);
      } else {
        this.input.value = '';
      }
    }
  }
});
elation.elements.define('janus-ui-editor-property-string', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'string' },
    });
    this.input = elation.elements.create('ui-input', { name: 'value', label: '', append: this });
    this.input.addEventListener('change', (ev) => this.handleInputChange(ev));
    elation.events.add(this.input, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.input, 'blur', (ev) => this.handleInputBlur(ev));

    this.updateValue(this.value);
  }
  render() {
  }
  updateValue(value) {
    this.value = value || '';
    if (this.input) {
      this.input.value = this.value;
    }
  }
  focus() {
    if (!this.input.hasFocus()) {
      this.input.focus();
      this.input.select();
    }
  }
  handleInputChange(ev) {
    this.value = this.input.value;
    //this.resetChangeTimer();
    elation.events.fire({type: 'editorchange', element: this, data: this.value});
  }
});
elation.elements.define('janus-ui-editor-property-vector3', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'vector3' },
      constraint: { type: 'string' },
    });

    this.inputs = [];
    let inputs = 'xyz'.split('');
    let i = 0;
    inputs.forEach(t => {
      let input = elation.elements.create('ui-input', {
        name: t,
        label: t,
        append: this
      });
      elation.events.add(input, 'input', (ev) => { 
        if (this.inputs[0].value != this.value.x) this.value.x = +this.inputs[0].value;
        if (this.inputs[1].value != this.value.y) this.value.y = +this.inputs[1].value;
        if (this.inputs[2].value != this.value.z) this.value.z = +this.inputs[2].value;
        //elation.events.fire({type: 'editorchange', element: this})
        this.resetChangeTimer();
      });
      this.inputs.push(input);
    });
    elation.events.add(this.inputs, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.inputs, 'blur', (ev) => this.handleInputBlur(ev));
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.inputs && this.value instanceof THREE.Vector3) {
      this.inputs[0].value = +this.value.x.toFixed(4);
      this.inputs[1].value = +this.value.y.toFixed(4);
      this.inputs[2].value = +this.value.z.toFixed(4);
    }
  }
  render() {
  }
});
elation.elements.define('janus-ui-editor-property-vector2', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'vector2' },
      constraint: { type: 'string' },
    });

    this.inputs = [];
    let inputs = 'xy'.split('');
    let i = 0;
    inputs.forEach(t => {
      let input = elation.elements.create('ui-input', {
        name: t,
        label: t,
        append: this
      });
      elation.events.add(input, 'input', (ev) => { 
        if (this.inputs[0].value != this.value.x) this.value.x = +this.inputs[0].value;
        if (this.inputs[1].value != this.value.y) this.value.y = +this.inputs[1].value;
        //elation.events.fire({type: 'editorchange', element: this})
        this.resetChangeTimer();
      });
      this.inputs.push(input);
    });
    elation.events.add(this.inputs, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.inputs, 'blur', (ev) => this.handleInputBlur(ev));
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.inputs && this.value instanceof THREE.Vector2) {
      this.inputs[0].value = +this.value.x.toFixed(4);
      this.inputs[1].value = +this.value.y.toFixed(4);
    }
  }
  render() {
  }
});
elation.elements.define('janus-ui-editor-property-euler', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      value: { type: 'euler' },
    });

    this.elements = elation.elements.fromString(`
      <ui-input name="x" label="x"></ui-input>
      <ui-input name="y" label="y"></ui-input>
      <ui-input name="z" label="z"></ui-input>
    `, this);
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.elements) {
      this.elements.x.value = +this.value.x.toFixed(3);
      this.elements.y.value = +this.value.y.toFixed(3);
      this.elements.z.value = +this.value.z.toFixed(3);
    }
  }
});
elation.elements.define('janus-ui-editor-property-color', class extends elation.elements.janus.ui.editor.property {
  create() {
    super.create();
    this.defineAttributes({
      label: { type: 'string' },
      value: { type: 'color' },
    });
/*
    if (this.label) {
      elation.elements.create('ui-text', {
        text: this.label,
        append: this
      });
    }
*/
    this.inputs = [];
    let inputnames = 'rgb'.split('');
    let i = 0;
    inputnames.forEach(t => {
      let input = elation.elements.create('ui-input', {
        name: t,
        label: t,
        append: this
      });
      elation.events.add(input, 'input', (ev) => { 
/*
        if (this.inputs[0].value != this.value.r) this.value.r = this.inputs[0].value / 255;
        if (this.inputs[1].value != this.value.g) this.value.g = this.inputs[1].value / 255;
        if (this.inputs[2].value != this.value.b) this.value.b = this.inputs[2].value / 255;
*/
        if (this.inputs[0].value != this.value.r ||
            this.inputs[1].value != this.value.g ||
            this.inputs[2].value != this.value.b) {
          this.value = new THREE.Color(this.inputs[0].value / 255, this.inputs[1].value / 255, this.inputs[2].value / 255);
          this.colorpicker.value = '#' + this.value.getHexString();
          this.resetChangeTimer();
        }
      });
      this.inputs.push(input);
    });
    elation.events.add(this.inputs, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.inputs, 'blur', (ev) => this.handleInputBlur(ev));

    this.colorpicker = elation.elements.create('input', {
      type: 'color',
      name: 'color',
      append: this
    });
    elation.events.add(this.colorpicker, 'focus', (ev) => this.handleInputFocus(ev));
    elation.events.add(this.colorpicker, 'blur', (ev) => this.handleInputBlur(ev));
    if (this.value) {
      this.updateValue(this.value);
    }
    this.colorpicker.addEventListener('input', (ev) => { 
      this.updateValue(new THREE.Color(this.colorpicker.value));
      //this.resetChangeTimer();
      elation.events.fire({type: 'editorchange', element: this, data: this.value});
    });
  }
  createInputs(type='rgb') {
    super.createInputs(type);
  }
  updateValue(value) {
    this.value = value;
    if (this.colorpicker && value) {
      this.colorpicker.value = '#' + value.getHexString();
      this.inputs[0].value = (value.r * 255) | 0;
      this.inputs[1].value = (value.g * 255) | 0;
      this.inputs[2].value = (value.b * 255) | 0;
    }
  }
});
elation.elements.define('janus-ui-editor-property-boolean', class extends elation.elements.janus.ui.editor.property {
  create() {
    this.defineAttributes({
      label: { type: 'string' },
      propertyname: { type: 'boolean' },
      value: { type: 'boolean' },
    });
    if (this.label) {
      let labelobj = elation.elements.create('ui-text', {
        text: this.label,
        append: this
      });
      elation.events.add(labelobj, 'click', (ev) => this.activateControl(ev));
    }
    this.elements = elation.elements.fromString(`
      <ui-toggle name="toggle"></ui-toggle>
    `, this);
    elation.events.add(this.elements.toggle, 'toggle', (ev) => {
      this.value = ev.target.checked;
      elation.events.fire({type: 'editorchange', element: this, data: this.value})
    });
    if (this.value) {
      this.updateValue(this.value);
    }
  }
  updateValue(value) {
    this.value = value;
    if (this.elements) {
      this.elements.toggle.checked = value;
    }
  }
});

/* ---- floating 3D property UIs ---------------------------------------
   Registry of in-world editors keyed by property TYPE. The editor
   controller consults window.JanusEditorPropertyUIs when the edit mode
   lands on a non-transform property (Tab cycling or a 2D inspector
   click); transform properties keep TransformControls. Rigs follow the
   TransformControls idiom: raw THREE meshes on camera layer 10 (the
   editor overlay layer), our own raycaster, nothing persisted or
   synced. */
window.JanusEditorPropertyUIs = window.JanusEditorPropertyUIs || {};

window.JanusEditorPropertyUIs.color = class JanusColorPicker3D {
  constructor(controller) {
    this.controller = controller;
    this.object = null;
    this.propname = null;
    this.hsv = { h: 0.33, s: 1, v: 1 };
    this.dragging = false;
    this.built = false;
    this.raycaster = new THREE.Raycaster();
    if (this.raycaster.layers && this.raycaster.layers.enableAll) this.raycaster.layers.enableAll();
    this.handleMouseDown = (ev) => this.pointerDown(ev);
    this.handleMouseMove = (ev) => this.pointerMove(ev);
    this.handleMouseUp = (ev) => this.pointerUp(ev);
    this.handleFrame = () => this.updateBillboard();
    this.handleObjectChange = () => { if (!this.dragging) this.readColor(); };
  }

  // color math: HSV (THREE.Color only speaks HSL natively)
  hsv2rgb(h, s, v) {
    let f = (n) => {
      let k = (n + h * 6) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return { r: f(5), g: f(3), b: f(1) };
  }
  rgb2hsv(r, g, b) {
    let max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0;
    if (d > 0) {
      if (max == r) h = ((g - b) / d) % 6;
      else if (max == g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
      if (h < 0) h += 1;
    }
    return { h: h, s: max > 0 ? d / max : 0, v: max };
  }

  build() {
    let rig = this.rig = new THREE.Group();
    let flat = { depthTest: false, depthWrite: false, side: THREE.DoubleSide };

    // hue wheel: annulus painted on a transparent plane (r 0.26-0.36 of a 0.72 plane)
    this.wheelcanvas = document.createElement('canvas');
    this.wheelcanvas.width = this.wheelcanvas.height = 256;
    this.drawWheel();
    this.wheeltex = new THREE.CanvasTexture(this.wheelcanvas);
    this.wheel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.72),
      new THREE.MeshBasicMaterial(Object.assign({ map: this.wheeltex, transparent: true }, flat)));
    this.wheel.renderOrder = 1000;
    rig.add(this.wheel);

    // saturation/value square inside the wheel
    this.svcanvas = document.createElement('canvas');
    this.svcanvas.width = this.svcanvas.height = 256;
    this.svtex = new THREE.CanvasTexture(this.svcanvas);
    this.sv = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.34),
      new THREE.MeshBasicMaterial(Object.assign({ map: this.svtex }, flat)));
    this.sv.position.z = 0.002;
    this.sv.renderOrder = 1001;
    rig.add(this.sv);

    // live swatch under the wheel
    this.swatch = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.07),
      new THREE.MeshBasicMaterial(Object.assign({}, flat)));
    this.swatch.position.set(0, -0.45, 0);
    this.swatch.renderOrder = 1000;
    rig.add(this.swatch);

    // markers: a ring on the wheel for hue, a ring on the square for S/V
    this.huemarker = new THREE.Mesh(
      new THREE.RingGeometry(0.016, 0.026, 16),
      new THREE.MeshBasicMaterial(Object.assign({ color: 0xffffff }, flat)));
    this.huemarker.position.z = 0.004;
    this.huemarker.renderOrder = 1002;
    rig.add(this.huemarker);
    this.svmarker = new THREE.Mesh(
      new THREE.RingGeometry(0.012, 0.02, 16),
      new THREE.MeshBasicMaterial(Object.assign({ color: 0xffffff }, flat)));
    this.svmarker.position.z = 0.004;
    this.svmarker.renderOrder = 1002;
    rig.add(this.svmarker);

    // editor overlay layer: only renders while the editor is active
    rig.traverse((o) => { if (o.layers) o.layers.set(10); });
    this.built = true;
  }
  drawWheel() {
    let ctx = this.wheelcanvas.getContext('2d'),
        s = this.wheelcanvas.width, c = s / 2,
        rOuter = c, rInner = c * (0.26 / 0.36);
    ctx.clearRect(0, 0, s, s);
    // wedges drawn at canvas angle -i so a hit's uv-space atan2 IS the hue
    for (let i = 0; i < 360; i++) {
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(' + i + ',100%,50%)';
      ctx.lineWidth = rOuter - rInner;
      ctx.arc(c, c, (rInner + rOuter) / 2, -(i + 1.4) * Math.PI / 180, -(i - 0.4) * Math.PI / 180);
      ctx.stroke();
    }
  }
  drawSV() {
    let ctx = this.svcanvas.getContext('2d'), s = this.svcanvas.width;
    let rgb = this.hsv2rgb(this.hsv.h, 1, 1);
    let hue = 'rgb(' + ((rgb.r * 255) | 0) + ',' + ((rgb.g * 255) | 0) + ',' + ((rgb.b * 255) | 0) + ')';
    let gx = ctx.createLinearGradient(0, 0, s, 0);
    gx.addColorStop(0, '#ffffff');
    gx.addColorStop(1, hue);
    ctx.fillStyle = gx;
    ctx.fillRect(0, 0, s, s);
    let gy = ctx.createLinearGradient(0, 0, 0, s);
    gy.addColorStop(0, 'rgba(0,0,0,0)');
    gy.addColorStop(1, '#000000');
    ctx.fillStyle = gy;
    ctx.fillRect(0, 0, s, s);
    this.svtex.needsUpdate = true;
  }

  attach(object, propname, propdef) {
    if (!this.built) this.build();
    this.object = object;
    this.propname = propname;
    let parent = room._target.objects['3d'];
    if (this.rig.parent !== parent) parent.add(this.rig);
    this.rig.visible = true;
    this.readColor();
    this.place();
    let view = janus.engine.client.view;
    this.canvas = view.canvas;
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    object.addEventListener('objectchange', this.handleObjectChange);
    elation.events.add(janus.engine, 'engine_frame', this.handleFrame);
    janus.engine.systems.render.setdirty();
  }
  detach() {
    if (!this.built) return;
    this.rig.visible = false;
    this.dragging = false;
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('mouseup', this.handleMouseUp);
    }
    if (this.object) this.object.removeEventListener('objectchange', this.handleObjectChange);
    elation.events.remove(janus.engine, 'engine_frame', this.handleFrame);
    this.object = null;
    this.propname = null;
    janus.engine.systems.render.setdirty();
  }

  place() {
    // float above the object; billboarding keeps it facing the player
    let anchor = new THREE.Vector3(0, 1, 0);
    try { this.object._target.objects['3d'].getWorldPosition(anchor); } catch (e) {}
    let top = anchor.y + 0.8;
    let bbox = this.controller.roomedit.objectBoundingBox;
    if (bbox && bbox.max && isFinite(bbox.max.y)) top = Math.max(top, bbox.max.y + 0.55);
    let target = new THREE.Vector3(anchor.x, top, anchor.z);
    if (this.rig.parent) this.rig.parent.worldToLocal(target);
    this.rig.position.copy(target);
    this.updateBillboard();
  }
  updateBillboard() {
    if (!this.rig || !this.rig.visible) return;
    let cam = janus.engine.client.view.actualcamera;
    if (!cam) return;
    let q = cam.getWorldQuaternion(new THREE.Quaternion());
    if (this.rig.parent) {
      let pq = this.rig.parent.getWorldQuaternion(new THREE.Quaternion());
      q.premultiply(pq.invert());
    }
    this.rig.quaternion.copy(q);
  }

  pointerNDC(ev) {
    if (document.pointerLockElement) return new THREE.Vector2(0, 0);
    let rect = this.canvas.getBoundingClientRect();
    return new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  }
  pickPart(ev) {
    let cam = janus.engine.client.view.actualcamera;
    this.raycaster.setFromCamera(this.pointerNDC(ev), cam);
    let hits = this.raycaster.intersectObjects([this.sv, this.wheel], false);
    for (let i = 0; i < hits.length; i++) {
      let hit = hits[i];
      if (hit.object === this.sv) return 'sv';
      if (hit.object === this.wheel && hit.uv) {
        let px = hit.uv.x - 0.5, py = hit.uv.y - 0.5;
        let rn = Math.sqrt(px * px + py * py) / 0.5;
        if (rn >= 0.66 && rn <= 1.02) return 'wheel';
      }
    }
    return null;
  }
  dragPoint(ev) {
    // intersect the rig's plane so drags keep tracking even off the part
    let cam = janus.engine.client.view.actualcamera;
    this.raycaster.setFromCamera(this.pointerNDC(ev), cam);
    let normal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.rig.getWorldQuaternion(new THREE.Quaternion()));
    let plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, this.rig.getWorldPosition(new THREE.Vector3()));
    let pt = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, pt)) return null;
    return this.rig.worldToLocal(pt);
  }
  applyDrag(ev) {
    let local = this.dragPoint(ev);
    if (!local) return;
    let clamp = (x) => Math.max(0, Math.min(1, x));
    if (this.dragging == 'wheel') {
      let a = Math.atan2(local.y, local.x);
      let h = a / (Math.PI * 2);
      if (h < 0) h += 1;
      this.setHSV(h, this.hsv.s, this.hsv.v);
    } else if (this.dragging == 'sv') {
      this.setHSV(this.hsv.h, clamp(local.x / 0.34 + 0.5), clamp(local.y / 0.34 + 0.5));
    }
  }
  pointerDown(ev) {
    if (!this.rig || !this.rig.visible || ev.button !== 0) return;
    let part = this.pickPart(ev);
    if (!part) return;
    this.dragging = part;
    // same trick TransformControls uses: a click that lands after this drag
    // must not be treated as the edit-confirm click
    this.controller.roomedit.transforming = true;
    this.applyDrag(ev);
    ev.stopPropagation();
    ev.preventDefault();
  }
  pointerMove(ev) {
    if (!this.dragging) return;
    this.applyDrag(ev);
  }
  pointerUp(ev) {
    if (!this.dragging) return;
    this.dragging = false;
    setTimeout(() => { this.controller.roomedit.transforming = false; }, 0);
  }

  setHSV(h, s, v) {
    this.hsv = { h: h, s: s, v: v };
    let rgb = this.hsv2rgb(h, s, v);
    this.object[this.propname] = new THREE.Color(rgb.r, rgb.g, rgb.b);
    this.object.sync = true;
    if (this.object.refresh) this.object.refresh();
    this.updateVisuals();
    janus.engine.systems.render.setdirty();
  }
  readColor() {
    if (!this.object) return;
    let val = this.object[this.propname];
    let color = (val && val.isColor) ? val : new THREE.Color(val != null ? val : '#ffffff');
    let hsv = this.rgb2hsv(color.r, color.g, color.b);
    // keep the hue stable when the color collapses to gray/black/white
    if (hsv.s > 0.001 && hsv.v > 0.001) this.hsv.h = hsv.h;
    this.hsv.s = hsv.s;
    this.hsv.v = hsv.v;
    this.updateVisuals();
  }
  updateVisuals() {
    this.drawSV();
    let rgb = this.hsv2rgb(this.hsv.h, this.hsv.s, this.hsv.v);
    this.swatch.material.color.setRGB(rgb.r, rgb.g, rgb.b);
    let a = this.hsv.h * Math.PI * 2, rmid = 0.31;
    this.huemarker.position.set(Math.cos(a) * rmid, Math.sin(a) * rmid, 0.004);
    this.svmarker.position.set((this.hsv.s - 0.5) * 0.34, (this.hsv.v - 0.5) * 0.34, 0.004);
  }
};
