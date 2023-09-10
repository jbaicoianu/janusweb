elation.elements.define('janus.ui.editor.button', class extends elation.elements.ui.togglebutton {
  create() {
    super.create();
    let editpanel = document.querySelector('ui-panel[name="topright"]');
    if (editpanel) {
      editpanel.hide();
    }
    janus.engine.systems.controls.addContext('editor', {
      'toggle':           [ 'keyboard_f1', (ev) => { if (ev.value) this.toggle(); } ],
    });
    janus.engine.systems.controls.activateContext('editor');
  }
  onactivate() {
    let inventorypanel = document.querySelector('ui-collapsiblepanel[name="right"]');
    if (inventorypanel) {
      let editorpanel = inventorypanel.querySelector('janus-ui-editor-panel');
      if (!editorpanel) {
        editorpanel = elation.elements.create('janus-ui-editor-panel', { append: inventorypanel });
      }
      let inventory = inventorypanel.querySelector('janus-ui-inventory');
      if (!inventory) {
        inventory = elation.elements.create('janus-ui-inventory', { append: inventorypanel });
        elation.events.add(inventory, 'assetselect', (ev) => editorpanel.handleInventorySelect(ev));
      }
    }
    let editpanel = document.querySelector('ui-panel[name="topright"]');
    if (editpanel) {
      editpanel.show();
    }
    player.camera.camera.layers.enable(10);
    janus.engine.systems.render.setdirty();
    setTimeout(() => {
      inventorypanel.expand();
    }, 100);
  }
  ondeactivate() {
    let inventorypanel = document.querySelector('ui-collapsiblepanel[name="right"]');
    if (inventorypanel) {
      inventorypanel.collapse();
    }
    let editpanel = document.querySelector('ui-panel[name="topright"]');
    if (editpanel) {
      editpanel.hide();
    }
    player.camera.camera.layers.disable(10);
    janus.engine.systems.render.setdirty();
  }
});
elation.elements.define('janus.ui.editor.panel', class extends elation.elements.base {
  create() {
    //this.innerHTML = elation.template.get('janus.ui.editor.panel');
    let elements = elation.elements.fromTemplate('janus.ui.editor.panel', this);
/*
    elation.events.add(elements.transformtype, 'change', (ev) => this.handleTransformTypeChange(ev));
    elation.events.add(elements.transformspace, 'change', (ev) => this.handleTransformSpaceChange(ev));
    //elements.transformglobal.addEventListener('deactivate', (ev) => this.handleTransformGlobalDeactivate(ev));

    elation.events.add(elements.translatesnap, 'change', (ev) => this.handleTranslateSnapChange(ev));
    elation.events.add(elements.rotatesnap, 'change', (ev) => this.handleRotateSnapChange(ev));
*/

    elation.events.add(elements.debugview, 'click', (ev) => this.handleDebugviewClick(ev));
    elation.events.add(elements.viewsource, 'click', (ev) => this.handleViewSourceClick(ev));
    elation.events.add(elements.export, 'click', (ev) => this.handleExportClick(ev));

    // If we've made any changes and the user tries to leave, prompt them to verify that they want to throw the changes away
    window.addEventListener('beforeunload', (ev) => { if (this.history.length > 0) { ev.returnValue = false; ev.preventDefault(); return "You've made changes to this room, do you really want to leave?"; } });

    this.elements = elements;

    this.roomedit = {
      snap: .01,
      rotationsnap: 5,
      modes: ['pos', 'rotation', 'scale', 'col', 'wireframe', 'lighting', 'fog', 'shadow_cast', 'shadow_receive'],
      movespeed: new THREE.Vector3(),
      modeid: 0,
      object: false,
      transforming: false,
    };
    this.history = [];
    this.editObjectSetSnap(this.roomedit.snap);

    janus.engine.systems.controls.addContext('roomedit', {
      //'accept':           [ 'keyboard_enter', (ev) => { if (ev.value) this.editObjectStop(); } ],
      //'cancel':           [ 'keyboard_esc', (ev) => this.editObjectCancel(ev) ],
      'delete':           [ 'keyboard_delete', (ev) => this.editObjectDelete(ev) ],
      'mode':             [ 'keyboard_nomod_tab', (ev) => this.editObjectToggleMode(ev) ],
      'mode_reverse':     [ 'keyboard_shift_tab', (ev) => this.editObjectToggleModeReverse(ev) ],
      //'toggle_raycast':   [ 'keyboard_shift',  (ev) => this.editObjectToggleRaycast(ev) ],
/*
      'manipulate_left':  [ 'keyboard_j',  (ev) => this.editObjectManipulateLeft(ev) ],
      'manipulate_right': [ 'keyboard_l',  (ev) => this.editObjectManipulateRight(ev) ],
      'manipulate_up':    [ 'keyboard_i',  (ev) => this.editObjectManipulateUp(ev) ],
      'manipulate_down':  [ 'keyboard_k',  (ev) => this.editObjectManipulateDown(ev) ],
      'manipulate_in':    [ 'keyboard_u',  (ev) => this.editObjectManipulateIn(ev) ],
      'manipulate_out':   [ 'keyboard_o',  (ev) => this.editObjectManipulateOut(ev) ],
*/
      'manipulate_toggle':[ 'keyboard_space',  (ev) => this.editObjectManipulateToggle(ev) ],
      //'manipulate_mouse': [ 'mouse_delta',  (ev) => this.editObjectManipulateMouse ],
      'snap_ones':        [ 'keyboard_1',  (ev) => this.editObjectSnapOnes(ev) ],
      'snap_tenths':      [ 'keyboard_2',  (ev) => this.editObjectSnapTenths(ev) ],
      'snap_hundredths':  [ 'keyboard_3',  (ev) => this.editObjectSnapHundredths(ev) ],
      'snap_thousandths': [ 'keyboard_4',  (ev) => this.editObjectSnapThousandths(ev) ],

      'copy':     [ 'keyboard_ctrl_c', (ev) => { if (ev.value == 1) this.editObjectCopy(ev); } ],
      'cut':     [ 'keyboard_ctrl_x', (ev) => { if (ev.value == 1) this.editObjectCut(ev); } ],
    });
    janus.engine.systems.controls.addContext('roomedit_togglemove', {
      //'togglemove':       [ 'keyboard_shift', elation.bind(this, this.editObjectToggleMove)],
      'manipulate_left':  [ 'keyboard_a',  (ev) => this.editObjectManipulateLeft(ev) ],
      'manipulate_right': [ 'keyboard_d',  (ev) => this.editObjectManipulateRight(ev) ],
      'manipulate_up':    [ 'keyboard_w',  (ev) => this.editObjectManipulateUp(ev) ],
      'manipulate_down':  [ 'keyboard_s',  (ev) => this.editObjectManipulateDown(ev) ],
      'manipulate_in':    [ 'keyboard_q',  (ev) => this.editObjectManipulateIn(ev) ],
      'manipulate_out':   [ 'keyboard_e',  (ev) => this.editObjectManipulateOut(ev) ],
    });
    janus.engine.systems.controls.addContext('roomedit_paste', {
      'add':     [ 'keyboard_ctrl_a', (ev) => { if (ev.value == 1) this.showCreateDialog(ev); } ],
      'paste':     [ 'keyboard_ctrl_v', (ev) => { if (ev.value == 1) this.editObjectPaste(ev);} ],
    });
    janus.engine.systems.controls.activateContext('roomedit_paste');

    this.initialized = new Set();

    let inventorypanel = document.querySelector('ui-collapsiblepanel[name="right"]');
    this.scenetree = elation.elements.create('janus-ui-editor-scenetree', { append: inventorypanel });
    elation.events.add(this.scenetree, 'select', (ev) => { this.editObject(ev.data); });
    this.objectinfo = elation.elements.create('janus-ui-editor-objectinfo', { append: inventorypanel });

    if (typeof room != 'undefined') {
      this.initRoomEvents(room);
    }
    elation.events.add(janus._target, 'room_change', (ev) => this.initRoomEvents(room));
    document.addEventListener('paste', (ev) => this.handlePaste(ev));
    room.addEventListener('wheel', (ev) => this.editObjectMousewheel(ev));
    window.addEventListener('keydown', (ev) => this.editObjectKeydown(ev));
    window.addEventListener('keyup', (ev) => this.editObjectKeyup(ev));

  }
  initRoomEvents(room) {
    if (!this.initialized.has(room)) {
      room.addEventListener('click', (ev) => this.handleRoomClick(ev));
      //room.addEventListener('mouseover', (ev) => console.log('mouseover', ev.data));
      //room.addEventListener('mouseout', (ev) => console.log('mouseout', ev.data));
      elation.events.add(room, 'dragenter', (ev) => this.handleDragOver(ev));
      elation.events.add(room, 'dragover', (ev) => this.handleDragOver(ev));
      room.addEventListener('dragenter', (ev) => this.handleDragOver(ev));
      room.addEventListener('dragover', (ev) => this.handleDragOver(ev));
      room.addEventListener('drop', (ev) => this.handleDrop(ev));
      room.addEventListener('thing_add', (ev) => this.handleThingAdd(ev));
      room.addEventListener('thing_remove', (ev) => this.handleThingRemove(ev));
      this.initialized.add(room);
    }

    if (!this.outliner_selected) {
      this.outliner_selected = room.createObject('outliner', {
        col: 'lime',
        opacity: .4,
        outline: 3,
        layers: '10',
      });
      this.outliner_hover = room.createObject('outliner', {
        col: 'gray',
        opacity: .4,
        outline: 1,
        layers: '10',
      });
setTimeout(() => {
      this.outliner_selected.col = 'lime';
      this.outliner_hover.col = 'gray';
this.outliner_selected.setLayers('10');
this.outliner_hover.setLayers('10');
}, 0);
      let editor = this;
      this.outliner_hover.update = function() {
/*
        let rc = player.raycast();
        if (rc.length > 0 && rc[0].object !== room) {
          this.select(rc[0].object);
        } else {
          this.deselect();
        }
*/
      }
    } else if (this.outliner_selected.room !== room) {
      room.appendChild(this.outliner_selected);
    }
  }

  getManipulator() {
    if (typeof room == 'undefined') return;
    if (!this.manipulator) {
      let view = janus.engine.client.view;
      this.manipulator = new THREE.TransformControls(view.actualcamera, view.canvas);

      elation.events.add(this.manipulator, 'mouseDown', (ev) => {
        this.roomedit.transforming = true;
        this.editObjectShowInfo(this.roomedit.object);
        if (this.manipulator.object && this.manipulator.object.userData.thing) {
          //elation.events.fire({type: 'admin_edit_start', element: this, data: this.manipulator.object.userData.thing});
          //player.disable();
        }
      });
      elation.events.add(this.manipulator, 'mouseUp', (ev) => {
        setTimeout(() => {
          this.roomedit.transforming = false;
        }, 0);
      });
      elation.events.add(this.manipulator, 'change', (ev) => {
        let constraint = (ev.target.axis ? ev.target.axis.toLowerCase() : false);
        this.updateEditConstraints(constraint);
        janus.engine.systems.render.setdirty();
      });
      elation.events.add(this.manipulator, 'objectChange', (ev) => {
        this.editObjectShowInfo(this.roomedit.object);
        this.roomedit.object.sync = true;
      });
    }
    if (this.manipulator.parent != room._target.objects['3d']) {
      room._target.objects['3d'].add(this.manipulator);
      this.manipulator.enabled = false;
    }
    return this.manipulator;
  }
  setMode(mode) {
    let manipulator = this.getManipulator();
    switch (mode) {
      case 'pos':
        manipulator.setMode('translate');
        break;
      case 'rotation':
        manipulator.setMode('rotate');
        break;
      case 'scale':
        manipulator.setMode('scale');
        break;
    }
    if (this.objectinfo) {
      this.objectinfo.setMode(mode);
    }
  }
  nextMode() {
    let mode = this.objectinfo.nextMode();
    this.setMode(mode);
  }
  prevMode() {
    let mode = this.objectinfo.prevMode();
    this.setMode(mode);
  }
  setTranslationSnap(snap) {
    let manipulator = this.getManipulator();
    if (snap == 'Off') snap = 0;
    if (manipulator) manipulator.setTranslationSnap(+snap);
/*
    if (this.elements.translatesnap.value != snap) {
      this.elements.translatesnap.value = snap || 'Off';
    }
*/
    this.roomedit.snap = snap;
  }
  setRotationSnap(snap) {
    this.roomedit.rotationsnap = snap;
    let manipulator = this.getManipulator();
    if (snap == 'Off') snap = 0;
    if (manipulator) manipulator.setRotationSnap(+snap * THREE.MathUtils.DEG2RAD);
/*
    if (this.elements.rotatesnap.value != snap) {
      this.elements.rotatesnap.value = snap || 'Off';
    }
*/
  }
  handleTransformTypeChange(ev) {
    let manipulator = this.getManipulator();
    if (manipulator) manipulator.setMode(ev.data);
  }
  handleTransformSpaceChange(ev) {
    let manipulator = this.getManipulator();
    if (manipulator) {
      manipulator.setSpace(ev.data);
    }
  }
  handleTransformGlobalDeactivate(ev) {
    let manipulator = this.getManipulator();
    if (manipulator) manipulator.setSpace('local');
  }
  handleTranslateSnapChange(ev) {
console.log('set translation snap', ev.data, ev);
    this.setTranslationSnap(ev.target.value);
  }
  handleRotateSnapChange(ev) {
/*
    let snap = ev.target.value,
        manipulator = this.getManipulator();
    if (snap == 'Off') snap = 0;
    if (manipulator) manipulator.setRotationSnap(snap * Math.PI / 180);
*/
    this.setRotationSnap(ev.target.value);
  }
  handleDebugviewClick(ev) {
    if (!ev.target.active) {
      janus.engine.client.view.pickingdebug = true;
      janus.engine.systems.world.enableDebug();
    } else {
      janus.engine.client.view.pickingdebug = false;
      janus.engine.systems.world.disableDebug();
    }
    janus.engine.systems.render.setdirty();
  }
  handleViewSourceClick(ev) {
    if (!this.sourcewindow) {
      let win = elation.elements.create('ui-window', { append: document.body, center: true });
      let editor = elation.elements.create('janus-ui-editor-source', { room: room });

      win.setcontent(editor);
      setTimeout(() => { win.center = false; }, 1500);
      this.sourcewindow = win;
    } else {
      this.sourcewindow.show();
    }
  }
  handleExportClick(ev) {
    let exporter = new THREE.GLTFExporter();
    exporter.parse(room._target.objects['3d'], (data) => {
      let filedata = new Blob([data], {type: 'model/gltf-binary'});

      var url = window.URL.createObjectURL(filedata);

      let d = new Date(),
          ts = d.getFullYear() + (d.getMonth() + 1).toString().padStart(2, '0') + d.getDate().toString().padStart(2, '0') + d.getHours().toString().padStart(2, '0') + d.getMinutes().toString().padStart(2, '0') + d.getSeconds().toString().padStart(2, '0');

      var a = document.createElement('A');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.href = url;
      a.download = room.title + ' - ' + ts + '.glb';
      a.click();
      window.URL.revokeObjectURL(url);
    }, { binary: true });
  }
  handleRoomClick(ev) {
    if (ev.button == 2) {
        let proxyobj = ev.element.getProxyObject();
        if (this.roomedit.object) {
          this.editObjectRevert();
        } else if ((!room.localasset || !room.localasset.isEqual(proxyobj)) && !this.objectIsLocked(proxyobj)) {
          this.roomedit.raycast = ev.ctrlKey;
          this.editObject(proxyobj);
        }
    } else if (ev.button == 0 && !this.roomedit.transforming) {
      if (this.roomedit.object) {
        if (!this.roomedit.raycast) {
          // raycasting means this is an initial object placement, we don't need to log a change
          // FIXME - this is no longer the case, you can activate raycast mode by holding ctrl while clicking an object
          this.history.push({type: 'changed', object: this.roomedit.object, state: null});
        }
        this.editObjectStop();
      }
    }
  }
  objectIsLocked(object) {
    let locked = object.locked;
    if (object.parent) {
      locked = locked || this.objectIsLocked(object.parent);
    }
    return locked;
  }
  editObject(object, isnew) {
    if (this.roomedit.object) this.editObjectStop()
    this.roomedit.object = object;
    this.roomedit.parentObject = null;
    this.roomedit.objectBoundingBox = false;
    this.roomedit.modeid = 0;
    this.roomedit.objectIsNew = isnew;
    this.roomedit.moving = true;
    this.roomedit.movespeed.set(0, 0, 0);

    object.sync = true;
    if (!object.js_id) {
      object.js_id = player.userid + '-' + window.uniqueId();
    }

    this.roomedit.objectBoundingBox = object.getBoundingBox(true);
    object.addEventListener('load', (ev) => {
      this.roomedit.objectBoundingBox = object.getBoundingBox(true);
      this.editObjectUpdate();
      //this.editObjectShowWireframe();
      this.editObjectShowOutline();
      console.log('update bbox', this.roomedit.objectBoundingBox);
    });

    //object.pickable = false;
    //console.log('set object unpickable', object);

    room.addEventListener('mousemove', (ev) => this.editObjectMousemove(ev));
    elation.events.add(this, 'mousedown', this.editObjectClick);
    //elation.events.add(document, 'pointerlockchange', (ev) => this.editObjectHandlePointerlock(ev));

    // Back up properties so we can revert if necessary
    this.roomedit.startattrs = {};
    for (var i = 0; i < this.roomedit.modes.length; i++) {
      var mode = this.roomedit.modes[i];
      if (object[mode]) {
        var val = object[mode];
        if (val instanceof THREE.Vector3 ||
            val instanceof THREE.Color ||
            val instanceof THREE.Euler) {
          val = val.toArray().join(' ');
        }
        this.roomedit.startattrs[mode] = val;
      }
    }

    // activate context
    janus.engine.systems.controls.activateContext('roomedit', this);

    //this.editObjectShowWireframe();
    this.editObjectShowOutline();
    this.editObjectShowInfo(object);
    let manipulator = this.getManipulator();
    manipulator.attach(object.objects['3d']);
    manipulator.enabled = true;
    this.setMode('pos');
  }

  editObjectShowInfo(object) {
    //let content = elation.template.get('janus.ui.editor.object.info', {object: object, editmode: this.roomedit.modes[this.roomedit.modeid]});
    let inventorypanel = document.querySelector('ui-collapsiblepanel[name="right"]');
    this.objectinfo.updateObject(object);

    if (this.objectinfo.hidden) {
      this.objectinfo.show();
    }
    inventorypanel.refresh();
  }

  editObjectShowOutline() {
    if (this.roomedit.object === room) {
      this.outliner_selected.deselect();
    } else {
      this.outliner_selected.select(this.roomedit.object);
    }
  }
  editObjectRemoveOutline() {
    if (this.outliner_selected) {
      this.outliner_selected.deselect();
    }
  }
  editObjectShowWireframe() {
    if (this.roomedit.wireframe) {
      this.editObjectRemoveWireframe();
    }
    var object = this.roomedit.object;
    var obj3d = object._target.objects['3d'];

    var material = new THREE.MeshPhongMaterial({
      wireframe: true,
      color: 0xff0000,
      emissive: 0x330000,
      wireframeLinewidth: 2,
      depthTest: false,
      transparent: true,
      opacity: .1,
      blending: THREE.AdditiveBlending
    });
    var root = false;
    if (obj3d instanceof THREE.Mesh) {
      root = new THREE.Mesh(obj3d.geometry, material);
      root.scale.copy(obj3d.scale);
    } else {
      var objchild = obj3d;//.children[obj3d.children.length-1] || obj3d;
      //root = objchild.clone();
/*
      root = new THREE.Object3D();
      let parent = root;
      obj3d.traverse(function(n) {
        if (n instanceof THREE.Mesh) {
          n.material = material;
        } else {
               
        }
      });
*/
      root = this.editObjectCloneWireframe(obj3d, null, material, this.roomedit.object._target);
      if (root) {
        root.matrix.identity();
      }
    }
    this.roomedit.wireframe = root;
    if (root) {
      this.roomedit.object._target.objects['3d'].add(root);
      root.updateMatrixWorld();
    }
  }
  editObjectCloneWireframe(obj, parent, material, constrain) {
    let newobj = null;
    if (obj instanceof THREE.Mesh) {
      newobj = new THREE.Mesh(obj.geometry, material);
      newobj.matrixAutoUpdate = false;
      newobj.matrix.copy(obj.matrix);
      //newobj.matrixWorld.copy(obj.matrix);
    }

    if (obj.children.length > 0) {
      if (newobj === null) {
        newobj = new THREE.Object3D();
        newobj.matrixAutoUpdate = false;
        newobj.matrix.copy(obj.matrix);
        //newobj.matrixWorld.copy(obj.matrix);
      }
      for (let i = 0; i < obj.children.length; i++) {
        let objthing = obj.children[i].userData.thing;
        if (!objthing || !constrain || objthing === constrain) {
          this.editObjectCloneWireframe(obj.children[i], newobj, material, constrain);
        }
      }
    }
    if (newobj && parent) {
      parent.add(newobj);
    }
    return newobj;
  }
  editObjectRemoveWireframe() {
    if (this.roomedit.wireframe && this.roomedit.wireframe.parent) {
      this.roomedit.wireframe.parent.remove(this.roomedit.wireframe);
    }
  }
  editObjectShowParentWireframe() {
    if (this.roomedit.parentObject) {
      let bbox = this.roomedit.parentObject.getBoundingBox(true);
      if (!this.roomedit.parentwireframe) {
        let root = this.roomedit.parentObject.createObject('object', { });
        let hiddenfaces = root.createObject('object', {
          id: 'cube',
          wireframe: true,
          col: V(0,0,1,.2),
          depth_write: false,
          depth_test: false,
          pos: V()
        });
        root.createObject('object', {
          id: 'cube',
          wireframe: true,
          col: 'blue',
          opacity: 1,
          depth_write: false,
          depth_test: true
        });
        this.roomedit.parentwireframe = root;
      }
      let wireframe = this.roomedit.parentwireframe;
      wireframe.scale.subVectors(bbox.max, bbox.min);
      wireframe.pos.addVectors(bbox.max, bbox.min).divideScalar(2);
      if (wireframe.parent != this.roomedit.parentObject) {
        this.roomedit.parentObject.appendChild(wireframe);
      }
    }
  }
  editObjectRemoveParentWireframe() {
    if (this.roomedit.parentwireframe && this.roomedit.parentwireframe.parent) {
        //this.roomedit.parentwireframe.parent.removeChild(this.roomedit.parentwireframe);
    }
  }
  editObjectStop(destroy) {
    if (this.roomedit.object) {
      if (destroy) {
        this.roomedit.object.die();
      } else {
        this.roomedit.object.sync = true;
        if (this.roomedit.collision_id) {
          // restore collider
          this.roomedit.object.collision_id = this.roomedit.collision_id;
          this.roomedit.collision_id = false;
        } else if (false) {
          this.roomedit.object.collision_id = 'cube';
          this.roomedit.object.collision_trigger = true;
          this.roomedit.object.collision_scale = this.roomedit.objectBoundingBox.max.clone().sub(this.roomedit.objectBoundingBox.min);
          this.roomedit.object.collision_pos = this.roomedit.objectBoundingBox.max.clone().add(this.roomedit.objectBoundingBox.min).multiplyScalar(.5);
          //this.roomedit.object.collision_id = this.roomedit.object.id;
        }

        if (this.roomedit.parentObject) {
          let parentpos = this.roomedit.parentObject.worldToLocal(this.roomedit.object.getWorldPosition());
          this.roomedit.parentObject.add(this.roomedit.object);
          this.roomedit.object.pos = parentpos;
        }
        this.roomedit.object.dispatchEvent({type: 'edit', bubbles: true});
      }
    }
    //this.roomedit.object.pickable = true;
    this.roomedit.object.sync = true;
    this.roomedit.object = false;
    this.roomedit.raycast = false;
    this.roomedit.parentObject = null;
    //this.editObjectRemoveWireframe();
    this.editObjectRemoveOutline();
    this.editObjectRemoveParentWireframe();
    let manipulator = this.getManipulator();
    manipulator.detach();
    manipulator.enabled = false;
    if (this.objectinfo) {
      //this.objectinfo.hide();
    }

    elation.events.remove(room, 'mousemove', this.editObjectMousemove);
    //elation.events.remove(this, 'wheel', this.editObjectMousewheel);
    elation.events.remove(this, 'mousedown', this.editObjectClick);
    elation.events.remove(document, 'pointerlockchange', this.editObjectHandlePointerlock);

    // deactivate context
    janus.engine.systems.controls.deactivateContext('roomedit', this);
    if (!this.roomedit.moving) {
      this.roomedit.moving = true;
      janus.engine.systems.controls.deactivateContext('roomedit_togglemove', this);
    }
  }
  editObjectRevert() {
    var object = this.roomedit.object;
    if (object) {
      for (var k in this.roomedit.startattrs) {
        var value = this.roomedit.startattrs[k];
        object[k] = value;
      }
      this.editObjectStop();
    }
  }
  editObjectMousemove(ev) {
    if (this.roomedit.object) {
      var obj = this.roomedit.object;
      if (this.roomedit.moving && this.roomedit.raycast && ev.element.getProxyObject() !== obj) {
        let raycast = player.raycast(V(0, 0, -1));
        if (raycast) {
          let hit;
          for (let i = 0; i < raycast.length; i++) {
            if (raycast[i].object !== obj) {
              hit = raycast[i];
              break;
            }
          }
    
          if (hit) {
            this.roomedit.objectPosition = hit.point;
          }
        } else {
          this.roomedit.objectPosition = ev.data.point;
        }
        let manipulator = this.getManipulator();
        manipulator.enabled = false;
        this.editObjectUpdate();
      }
      if (ev.shiftKey) {
        this.roomedit.parentObject = ev.data.thing;
      } else {
        this.roomedit.parentObject = null;
      }
    }
  }
  editObjectUpdate() {
    var obj = this.roomedit.object;
    var bbox = this.roomedit.objectBoundingBox;

    var point = this.roomedit.objectPosition || this.roomedit.object.position;

    if (!bbox || isNaN(bbox.min.x) || isNaN(bbox.max.x)) {
      bbox = this.roomedit.objectBoundingBox = obj.getBoundingBox(true);
    }
    var headpos = player.head.localToWorld(V(0,0,0));
    var cursorpos = obj.parent.worldToLocal(translate(point, V(0, -bbox.min.y, 0)), true);
    cursorpos = this.editObjectSnapVector(cursorpos, this.roomedit.snap);
    var dir = V(cursorpos).sub(headpos);
    var distance = dir.length();
    dir.multiplyScalar(1/distance);
    if (distance > 2500) distance = 10; // probably the skybox
    //distance = Math.min(distance, 20);
    var newpos = V(headpos).add(V(dir).multiplyScalar(distance));

    obj.pos = newpos;//obj.parent.worldToLocal(newpos);
    obj.sync = true;

    if (this.roomedit.parentObject) {
      this.editObjectShowParentWireframe();
    } else if (this.roomedit.parentwireframe) {
      this.editObjectRemoveParentWireframe();
    }

  }
  editObjectMousewheel(ev) {
    //this.roomedit.distancescale *= (ev.deltaY > 0 ? .9 : 1.1);
    let obj = this.roomedit.object,
        mode = this.editObjectGetMode(),
        editor = this.objectinfo.getModeEditor();
    if (obj) {
      let attrtype = editor._elation.classdef.value.type,
          defs = obj._proxyobject._proxydefs;
      let attrname = defs[editor.propertyname][1];
      if (attrtype == 'vector3') {
        let move = this.roomedit.snap * (ev.deltaY < 0 ? 1 : -1);
        if (ev.altKey) {
          obj[attrname].x += move;
        }
        if (ev.ctrlKey) {
          obj[attrname].y += move;
        }
        if (ev.shiftKey) {
          obj[attrname].z += move;
        }
        if (!ev.ctrlKey && !ev.altKey && !ev.shiftKey) {
          // Default to translating on the Y axis (FIXME - is this really the best default?)
          obj[attrname].y += move;
        }
        this.editObjectSnapVector(obj[attrname], this.roomedit.snap);
      } else if (attrtype == 'euler') {
        let rot = new THREE.Euler();
        let move = (ev.deltaY > 0 ? -1 : 1) * this.roomedit.rotationsnap * THREE.MathUtils.DEG2RAD;
        if (ev.ctrlKey) {
          rot.x += move;
        }
        if (ev.altKey) {
          rot.y += move;
        }
        if (ev.shiftKey) {
          rot.z += move;
        }
        if (!ev.ctrlKey && !ev.altKey && !ev.shiftKey) {
          // Default to rotating around Y axis
          rot.y += move;
        }
        let quat = new THREE.Quaternion().setFromEuler(obj[attrname].radians);
        let quat2 = new THREE.Quaternion().setFromEuler(rot);
        quat.multiply(quat2);
        obj[attrname].radians.setFromQuaternion(quat);
        //this.editObjectSnapVector(obj[attrname], this.roomedit.rotationsnap * THREE.MathUtils.DEG2RAD);
      } else if (attrtype == 'color') {
        let move = 4/255 * (ev.deltaY < 0 ? 1 : -1);

        let col = obj[mode].clone();
        if (ev.altKey) {
          col.r += move;
        }
        if (ev.ctrlKey) {
          col.g += move;
        }
        if (ev.shiftKey) {
          col.b += move;
        }
        if (!ev.ctrlKey && !ev.altKey && !ev.shiftKey) {
          // Default to translating on the Y axis (FIXME - is this really the best default?)
          col.r += move;
          col.g += move;
          col.b += move;
        }
        col.r = THREE.MathUtils.clamp(col.r, 0, 1);
        col.g = THREE.MathUtils.clamp(col.g, 0, 1);
        col.b = THREE.MathUtils.clamp(col.b, 0, 1);
        console.log('opacity after', obj.opacity);
        obj[mode] = col;
obj.opacity = obj.opacity;
        //this.editObjectSnapVector(obj[attrname], this.roomedit.snap);
      } else if (attrtype == 'float') {
        let attrdef = obj._thingdef.properties[attrname];
        let amount = (ev.deltaY < 0 ? 1 : -1);
        let min = -Infinity,
            max = Infinity;
        let divisor = 10;

        if (ev.shiftKey) {
          divisor *= 2;
        }
        if (ev.ctrlKey) {
          divisor *= 10;
        }

        if ('min' in attrdef && 'max' in attrdef) {
          min = attrdef.min;
          max = attrdef.max;
          amount *= (max - min) / divisor;
        } else {
          amount /= divisor;
        }
        obj[attrname] = THREE.MathUtils.clamp(obj[attrname] + amount, min, max);

      } else if (attrtype == 'boolean' || attrtype == 'bool') {
        if (ev.deltaY < 1) {
          obj[attrname] = true;
        } else {
          obj[attrname] = false;
        }
      }
      obj.sync = true;
      obj.refresh();
      this.editObjectShowInfo(obj);
      ev.preventDefault();
    }
  }
  editObjectKeydown(ev) {
    this.updateEditConstraints(ev);
  }
  editObjectKeyup(ev) {
    this.updateEditConstraints(ev);
  }
  editObjectClick(ev) {
    if (this.roomedit.object) {
      if (ev.button == 0) {
        //this.editObjectStop();
      } else if (ev.button == 2) {
        if (ev.shiftKey) {
          console.log('select additional object', ev.data.thing);
        } else {
          //this.editObjectRevert();
        }
      }
    }
  }
  editObjectGetMode() {
    //return this.roomedit.modes[this.roomedit.modeid];
    return this.objectinfo.mode;
  }
  editObjectGetAttributeType(mode) {
      let obj = this.roomedit.object;
      let proxydef = obj._proxydefs[mode];
      let attrdef = obj._thingdef.properties[proxydef[1]];
    return attrdef.type;
  }
  editObjectToggleMode(ev) {
    var roomedit = ev.target.roomedit;
    if (!roomedit.object) return;
    if (ev.value) {
/*
      var modes = roomedit.modes,
          modeid = (roomedit.modeid + 1) % modes.length;

      roomedit.modeid = modeid;
      ev.target.editObjectShowInfo(roomedit.object);

      ev.target.setMode(modes[modeid]);
*/
      ev.target.nextMode();
      ev.target.editObjectShowInfo(roomedit.object);
    }
  }
  editObjectToggleModeReverse(ev) {
    var roomedit = ev.target.roomedit;
    if (!roomedit.object) return;
    if (ev.value) {
/*
      var modes = roomedit.modes,
          modeid = (modes.length + roomedit.modeid - 1) % modes.length;

      roomedit.modeid = modeid;
      ev.target.editObjectShowInfo(roomedit.object);

      ev.target.setMode(modes[modeid]);
*/
      ev.target.prevMode();
      ev.target.editObjectShowInfo(roomedit.object);
    }
  }
  editObjectManipulate(vec) {
    var mode = this.editObjectGetMode();
    var obj = this.roomedit.object;
    var space = 'world'; // 'world', 'local', 'player'
    var player = janus.player;

    if (!obj) return;
    switch (mode) {
      case 'pos':
        if (space == 'world') {
          var newpos = translate(obj.pos, scalarMultiply(vec, this.roomedit.snap));
          obj.pos = this.editObjectSnapVector(newpos, this.roomedit.snap);
        } else if (space == 'player') {
          var dir = player.head.localToWorld(vec).sub(player.head.localToWorld(V(0)));
          var newpos = translate(obj.pos, scalarMultiply(dir, this.roomedit.snap));
          obj.pos = this.editObjectSnapVector(newpos, this.roomedit.snap);
        } else if (space == 'local') {
          var dir = obj.localToWorld(vec).sub(obj.localToWorld(V(0)));
          obj.pos = translate(obj.pos, scalarMultiply(dir, this.roomedit.snap));
        }
        break;
      case 'rotation':
/*
        var amount = Math.PI/2 * this.roomedit.snap;
        var euler = new THREE.Euler().setFromQuaternion(obj._target.orientation);
        //vec.multiplyScalar(amount);
        euler.x += vec.x;
        euler.y += vec.y;
        euler.z += vec.z;
        //var quat = new THREE.Quaternion().setFromEuler(euler);
        //obj._target.properties.orientation.copy(quat);
        let rot = obj.rotation;
        var amount = 90;
        if (this.roomedit.snap == .1) amount = 45;
        else if (this.roomedit.snap == .01) amount = 15;
        else if (this.roomedit.snap == .001) amount = 5;
        obj.properties.rotation.set(rot.x * 180 / Math.PI + vec.x * amount, rot.y * 180 / Math.PI + vec.y * amount, rot.z * 180 / Math.PI + vec.z * amount);
obj.updateOrientationFromEuler();
obj.updateDirvecsFromOrientation();
        //this.roomedit.object.pos = vec;
*/
        var amount = 90;
        if (this.roomedit.snap == .1) amount = 45;
        else if (this.roomedit.snap == .01) amount = 15;
        else if (this.roomedit.snap == .001) amount = 5;

        let rot = new THREE.Euler().setFromVector3(vec.clone().multiplyScalar(amount * THREE.MathUtils.DEG2RAD));
        let quat = new THREE.Quaternion();
        quat.setFromEuler(rot);
        //obj.rotation = V(rot.x * THREE.MathUtils.RAD2DEG, rot.y * THREE.MathUtils.RAD2DEG, rot.z * THREE.MathUtils.RAD2DEG);
        obj.orientation.multiply(quat);
console.log('rotate it', vec.clone().multiplyScalar(amount), amount, rot, quat);

        break;
      case 'scale':
        if (space == 'world') {
          obj.scale.add(vec.multiplyScalar(this.roomedit.snap));
        } else if (space == 'player') {
          var dir = player.head.localToWorld(vec, true).sub(player.head.localToWorld(V(0)));
          var newscale = translate(obj.scale, dir.multiplyScalar(this.roomedit.snap));
          obj.scale = this.editObjectSnapVector(newscale, this.roomedit.snap);
        } else if (space == 'local') {
          var newscale = translate(obj.scale, vec.multiplyScalar(this.roomedit.snap));
          obj.scale = this.editObjectSnapVector(newscale, this.roomedit.snap);
        }
        break;
      case 'col':
        let snap = 10 / 255;
        obj.col = V(THREE.MathUtils.clamp(obj.col.r + vec.x * snap, 0, 1),
                    THREE.MathUtils.clamp(obj.col.g + vec.y * snap, 0, 1),
                    THREE.MathUtils.clamp(obj.col.b + vec.z * snap, 0, 1));

console.log('change color', obj.col, vec);
        break;
    }
    obj.sync = true;
    this.editObjectShowInfo(obj);
  }
  editObjectSnapVector(vector, snap) {
    vector.x = Math.round(vector.x / snap) * snap;
    vector.y = Math.round(vector.y / snap) * snap;
    vector.z = Math.round(vector.z / snap) * snap;
    return vector;
  }
  editObjectSetSnap(amount) {
    this.roomedit.snap = amount;
    this.setTranslationSnap(amount);

    if (amount == 1) this.setRotationSnap(45);
    else if (amount == .1) this.setRotationSnap(15);
    else if (amount == .01) this.setRotationSnap(5);
    else if (amount == .001) this.setRotationSnap(1.25);
    console.log('set snap to', amount);
  }

  // FIXME - the following functions aren't bound to "this", because the control system isn't properly managing context
  editObjectManipulateLeft(ev) {
    if (ev.value) {
      //ev.target.editObjectManipulate(V(-1, 0, 0));
      ev.target.roomedit.movespeed.x = -1;
      ev.target.roomedit.raycast = false;
      ev.target.roomedit.keyrepeatdelay = 300;
    } else if (ev.target.roomedit.movespeed.x == -1) {
      ev.target.roomedit.movespeed.x = 0;
    }
    ev.target.editObjectManipulateTimer();
  }
  editObjectManipulateRight(ev) {
    if (ev.value) {
      //ev.target.editObjectManipulate(V(1,0,0));
      ev.target.roomedit.movespeed.x = 1;
      ev.target.roomedit.raycast = false;
      ev.target.roomedit.keyrepeatdelay = 300;
    } else if (ev.target.roomedit.movespeed.x == 1) {
      ev.target.roomedit.movespeed.x = 0;
    }
    ev.target.editObjectManipulateTimer();
  }
  editObjectManipulateUp(ev) {
    if (ev.value) {
      //ev.target.editObjectManipulate(V(0,1,0));
      ev.target.roomedit.movespeed.y = 1;
      ev.target.roomedit.raycast = false;
      ev.target.roomedit.keyrepeatdelay = 300;
    } else if (ev.target.roomedit.movespeed.y == 1) {
      ev.target.roomedit.movespeed.y = 0;
    }
    ev.target.editObjectManipulateTimer();
  }
  editObjectManipulateDown(ev) {
    if (ev.value) {
      //ev.target.editObjectManipulate(V(0,-1,0));
      ev.target.roomedit.movespeed.y = -1;
      ev.target.roomedit.raycast = false;
      ev.target.roomedit.keyrepeatdelay = 300;
    } else if (ev.target.roomedit.movespeed.y == -1) {
      ev.target.roomedit.movespeed.y = 0;
    }
    ev.target.editObjectManipulateTimer();
  }
  editObjectManipulateIn(ev) {
    if (ev.value) {
      //ev.target.editObjectManipulate(V(0,0,1));
      ev.target.roomedit.movespeed.z = -1;
      ev.target.roomedit.raycast = false;
      ev.target.roomedit.keyrepeatdelay = 300;
    } else if (ev.target.roomedit.movespeed.z == -1) {
      ev.target.roomedit.movespeed.z = 0;
    }
    ev.target.editObjectManipulateTimer();
  }
  editObjectManipulateOut(ev) {
    if (ev.value) {
      //ev.target.editObjectManipulate(V(0,0,-1));
      ev.target.roomedit.movespeed.z = 1;
      ev.target.roomedit.raycast = false;
      ev.target.roomedit.keyrepeatdelay = 300;
    } else if (ev.target.roomedit.movespeed.z == 1) {
      ev.target.roomedit.movespeed.z = 0;
    }
    ev.target.editObjectManipulateTimer();
  }
  editObjectManipulateToggle(ev) {
    if (ev.value) {
      if (this.roomedit.object) {
        let mode = this.editObjectGetMode();
        let attrtype = this.editObjectGetAttributeType(mode);
        switch (attrtype) {
        case 'vector3':
        case 'euler':
          if (this.roomedit.moving) {
            this.roomedit.moving = false;
            janus.engine.systems.controls.activateContext('roomedit_togglemove', this);
          } else {
            this.roomedit.moving = true;
            janus.engine.systems.controls.deactivateContext('roomedit_togglemove', this);
          }
          break;
        case 'bool':
        case 'boolean':
          this.roomedit.object[mode] = !this.roomedit.object[mode];
          this.roomedit.object.sync = true;
          break;
        case 'string':
          let editor = this.objectinfo.getModeEditor();
        }
      }
    }
  }
  editObjectManipulateTimer() {
    if (this.roomedit.movespeed.x || this.roomedit.movespeed.y || this.roomedit.movespeed.z) {
      this.editObjectManipulate(V(this.roomedit.movespeed));
      if (this.roomedit.object && !this.roomedit.movetimer) {
        this.roomedit.movetimer = setTimeout(() => {
          this.roomedit.movetimer = false;
          this.roomedit.keyrepeatdelay = 75;
          this.editObjectManipulateTimer();
        }, this.roomedit.keyrepeatdelay);
      }
    }
  }
  editObjectManipulateMouse(ev) {
    ev.target.editObjectManipulate(V(ev.value[0], -ev.value[1], 0));
  }
  editObjectToggleRaycast(ev) {
    ev.target.roomedit.raycast = ev.value;
  }
  editObjectSnapOnes(ev) {
    if (ev.value) ev.target.editObjectSetSnap(1);
  }
  editObjectSnapTenths(ev) {
    if (ev.value) ev.target.editObjectSetSnap(.1);
  }
  editObjectSnapHundredths(ev) {
    if (ev.value) ev.target.editObjectSetSnap(.01);
  }
  editObjectSnapThousandths(ev) {
    if (ev.value) ev.target.editObjectSetSnap(.001);
  }
  editObjectDelete(ev) {
    if (ev.value) {
      //ev.target.removeObject(ev.target.roomedit.object);
      room.deletions.push(ev.target.roomedit.object);
      this.history.push({type: 'addobjects', object: ev.target.roomedit.object});
      ev.target.editObjectStop(true);
    }
  }
  editObjectCancel(ev) {
    if (ev.value) {
      if (ev.target.roomedit.objectIsNew) {
        ev.target.editObjectStop(true);
      } else {
        ev.target.editObjectRevert();
      }
    }
  }
  editObjectToggleMove(ev) {
    var roomedit = ev.target.roomedit;
    if (ev.value == 1) {
      roomedit.moving = true;
      this.engine.systems.controls.activateContext('roomedit', this);
    } else if (ev.value == 0) {
      roomedit.moving = false;
      this.engine.systems.controls.deactivateContext('roomedit', this);
    }
  }
  editObjectHandlePointerlock(ev) {
    if (!document.pointerLockElement) {
      this.editObjectRevert();
    }
  }
  editObjectCopy(ev) {
    let obj = this.roomedit.object;
    console.log('copy the object', obj);
    if (obj) {
      this.roomedit.pastebuffer = obj;

/*
      let data = new DataTransfer();
      data.items.add('text/plain', 'blublub');
      //data.items.add('x-janus/x-' + obj.tag, 'cool huh');
      navigator.clipboard.write(data).then(() => {
        console.log('success!');
      }, (e) => {
        console.log('FAILED!', e);
      });
*/
    }
  }
  editObjectCut(ev) {
    let obj = this.roomedit.object;
    if (obj) {
      this.editObjectCopy(ev);
      this.editObjectRevert();
      obj.parent.removeChild(obj);
    }
  }
  editObjectPaste(ev) {
    if (this.roomedit.pastebuffer) {
      let oldobj = this.roomedit.pastebuffer;
      if (this.roomedit.object) {
        this.editObjectStop();
      }
      let raycast = player.raycast(V(0, 0, -1));
      if (raycast) {
        this.roomedit.objectPosition = raycast[0].point;
      }
      let newobj = oldobj.clone();
      this.roomedit.raycast = true;
      setTimeout(() => {
        this.editObject(newobj);
        this.editObjectUpdate();
        let manipulator = this.getManipulator();
        manipulator.enabled = false;
      }, 0);
      //oldobj.parent.add(oldobj.clone());
    }
  }
  handleDragOver(ev) {
    //ev.dataTransfer.dropEffect = "link"
    ev.preventDefault();
  }
  handleDrop(ev) {
    ev.preventDefault();
    var files = ev.dataTransfer.files,
        items = ev.dataTransfer.items;
    this.roomedit.raycast = true;
    var objects = [];
    if (files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        objects[i] = this.loadObjectFromFile(file);
      }
      this.editObject(objects[0], true);
    } else if (items.length > 0) {
      var types = {};
      var numitems = items.length;
      for (var i = 0; i < numitems; i++) {
        var type = items[i].type;
        types[type] = items[i];
      }
      if (types['text/x-jml']) {
        types['text/x-jml'].getAsString((jml) => { this.loadObjectFromJML(jml) });
      } else if (types['text/uri-list']) {
        types['text/uri-list'].getAsString((urilist) => { let newobjects = this.loadObjectFromURIList(urilist); objects.push.apply(newobjects);  }) ;
      } else if (types['text/x-moz-url']) {
        types['text/x-moz-url'].getAsString((urilist) => { let newobjects = this.loadObjectFromURIList(urilist); objects.push.apply(newobjects); } );
      }
    }
    this.history.push({type: 'addobjects', objects: objects});
    /*
    if (janus.engine.systems.admin.hidden) {
      janus.engine.systems.controls.requestPointerLock();
    }
    */
  }
  handleThingAdd(ev) {
console.log('[editor] scene added a thing', ev);
    setTimeout(() => {
      this.scenetree.refreshList();
    }, 0);
  }
  handleThingRemove(ev) {
    setTimeout(() => {
      this.scenetree.refreshList();
    }, 0);
  }
  loadObjectFromURIList(list) {
    var urls = list.split('\n');

    var objects = [];
    for (var i = 0; i < urls.length; i++) {
      let newobject = false;
      var hashidx = urls[i].indexOf('#');
      let url = urls[i];
      let trimmedurl = (hashidx == -1 ? urls[i] : urls[i].substring(0, hashidx)).trim();
      let type = 'Object';
      let objargs = {
        js_id: player.userid + '-' + trimmedurl + '-' + window.uniqueId(),
        //cull_face: 'none',
        sync: true,
        pos: new elation.physics.vector3().copy(player.vectors.cursor_pos),
        persist: true
      };
      if (trimmedurl.length > 0) {
        var schemeidx = trimmedurl.indexOf(':');
        if (schemeidx != -1) {
          // Handle special schemes which are used for internal primitives
          var scheme = trimmedurl.substr(0, schemeidx);
          if (scheme == 'janus') {
            let newobjargs = trimmedurl.substr(schemeidx+1).split('/'),
                objtype = newobjargs.shift();
            for (let j = 0; j < newobjargs.length; j++) {
              let parts = newobjargs[j].split('=');
              objargs[parts[0]] = decodeURIComponent(parts[1]);
            }
            if (objargs.id) {
              objargs.collision_id = objargs.id;
            }
            newobject = room.createObject(objtype, objargs);
            objects.push(newobject);
            if (objects[0]) {
              this.editObject(objects[0], true);
            }
          }
        }
        if (!newobject) {
          this.detectMimeTypeForURL(url).then(mimetype => {
            if (!mimetype) mimetype = 'application/octet-stream';
            if (trimmedurl.match(/\.(png|gif|jpg|jpeg)/i) || mimetype.match(/^image\//)) {
              type = 'image';
            } else if (mimetype.match(/^audio\//)) {
              type = 'sound';
              room.loadNewAsset('sound', {
                id: objargs.js_id,
                src: url
              });
              objargs.sound_id = objargs.js_id;
              objargs.id = objargs.js_id;
              objargs.auto_play = true;
            } else if (mimetype.match(/^video\//)) {
              type = 'video';
              room.loadNewAsset('video', {
                id: objargs.js_id,
                src: url,
                auto_play: true
              });
              objargs.video_id = objargs.js_id;
              objargs.id = objargs.js_id;
              //objargs.auto_play = true;
            } else if (mimetype.match(/^text\/html/)) {
              type = 'object';
              room.loadNewAsset('websurface', {
                id: objargs.js_id,
                src: url
              });
              objargs.websurface_id = objargs.js_id;
              objargs.id = 'plane';
            } else {
              objargs.id = trimmedurl;
            }
            if (typeof EventBridge != 'undefined') {
              // if EventBridge is defined, we're (probably) running inside of High Fidelity, so just spawn this object
              EventBridge.emitWebEvent(JSON.stringify({
                type: 'spawn',
                data: objargs.id
              }));
            } else {
              newobject = room.createObject(type, objargs);
              objects.push(newobject);
            }
            if (objects[0]) {
              this.editObject(objects[0], true);
            }
          });
        }
      }
    }
    return objects;
  }
  detectMimeTypeForURL(url) {
    return new Promise((resolve, reject) => {
      // Fetch the file so we can read the MIME type.  

      // FIXME - Ideally we'd request only the first 1k of data with a Range header, so we don't have to download 
      // the whole thing just to determine type - some types can be streamed more effectively if we let the browser
      // handle them (eg, video).  However, CORS is a nightmare, and most servers don't whitelist Range headers.

      // If mime type detection fails, we could also check for known signatures in the first 1k of data, but we don't do that here yet
if (false) {
      let proxiedurl = url;
      if (elation.engine.assets.corsproxy && !url.match(/^https?:\/\/localhost/) && !url.match(/^data:/) && !url.match(/^janus-vfs:/)) {
        proxiedurl = elation.engine.assets.corsproxy + url;
      }
      fetch(proxiedurl, { headers: { /*'Range': 'bytes=0-1023'}*/ }}).then(res => resolve(res.headers.get('content-type')))
                .catch((e) => {
                  reject();
                });
} else {
      elation.engine.assetdownloader.fetchURL(url).then(ev => {
        let res = ev.target;
        if (res.headers) {
          resolve(res.headers.get('content-type'));
        } else {
          // FIXME - no headers, unknown type
          resolve();
        }
      });
}
    });
  }
  loadObjectFromJML(jml) {
    room.applyEditXML(jml);
  }
  loadObjectFromFile(file) {
    var name = file.name,
        url = URL.createObjectURL(file),
        object;

    var type = 'object',
        args = {
          id: name,
          pos: player.vectors.cursor_pos.clone(),
          sync: true,
          persist: true,
        },
        assetargs = {
          id: name,
          src: url
        };

    var mimeparts = file.type.split('/');
    if (mimeparts[0] == 'image') {
      type = 'image';
      // We're going to send the local file's image data over the network, but we want to cap at a max size to avoid bogging down the network
      let maxsize = 512;
      args.onload = (ev) => {
        if (!args.loaded) {
          args.loaded = true;
          let fullcanvas = ev.element.asset.canvas;
          let rawimage = ev.element.asset.rawimage;
          let aspect = rawimage.width / rawimage.height;

          let canvas = document.createElement('canvas');
          let realsize = [rawimage.width, rawimage.height];
          if (realsize[0] <= maxsize && realsize[1] < maxsize) {
            object.id = object.image_id = rawimage.toDataURL(file.type);
          } else {
            if (realsize[0] > realsize[1]) {
              canvas.width = maxsize;
              canvas.height = maxsize / aspect;
            } else {
              canvas.height = maxsize;
              canvas.width = maxsize * aspect;
            }
            let ctx = canvas.getContext('2d');
            ctx.drawImage(rawimage, 0, 0, rawimage.width, rawimage.height, 0, 0, canvas.width, canvas.height);
            object.id = object.image_id = canvas.toDataURL(file.type);
          }
        }
      };
    } else if (mimeparts[0] == 'video') {
      type = 'video';
      args.video_id = name;
      assetargs.auto_play = true;
    } else if (mimeparts[0] == 'audio') {
      type = 'sound';
      args.sound_id = name;
      args.auto_play = true;
      assetargs.auto_play = true;
    } else {
      type = 'object';
      args.collision_id = name;
    }
    room.loadNewAsset(type, assetargs);
    object = room.createObject(type, args);
    return object;
  }
  handlePaste(ev) {
console.log('pastey!', ev.clipboardData.items[0], ev);
  }
  updateEditConstraints(constraint) {
    if (constraint instanceof Event) {
      let ev = constraint;
      constraint = '';

      let type = 'vector3';

      if (type == 'vector3') {
        if (ev.altKey) {
          constraint += 'x';
        }
        if (ev.ctrlKey) {
          constraint += 'y';
        }
        if (ev.shiftKey) {
          constraint += 'z';
        }
        if (!ev.shiftKey && !ev.ctrlKey && !ev.altKey) {
          constraint = 'y';
        }
      }
    }
    
    if (this.objectinfo) {
      let editor = this.objectinfo.getModeEditor();
      if (editor) {
        editor.constraint = constraint || 'none';
      }
    }
    if (this.manipulator) {
      this.manipulator.axis = (constraint ? constraint.toUpperCase() : null);
    }
  }
  handleInventorySelect(ev) {
    let url = ev.data;
    this.roomedit.raycast = true;
    janus.engine.systems.controls.requestPointerLock();
    this.loadObjectFromURIList(url);
    ev.preventDefault();
  }
  showCreateDialog(ev) {
    console.log('create thing?');
  }
});

elation.elements.define('janus.ui.editor.objectinfo', class extends elation.elements.base {
  create() {
    this.handleThingChange = elation.bind(this, this.handleThingChange);
    this.defineAttributes({
      object: { type: 'object' },
      mode: { type: 'string', default: 'pos' }
    });
    this.propeditors = {
/*
      pos: elation.elements.create('janus.ui.editor.property.vector3', {label: 'Position', propertyname: 'pos'}),
      rotation: elation.elements.create('janus.ui.editor.property.euler', {label: 'Rotation', propertyname: 'rotation'}),
      scale: elation.elements.create('janus.ui.editor.property.vector3', {label: 'Scale', propertyname: 'scale'}),
      col: elation.elements.create('janus.ui.editor.property.color', {label: 'Color', propertyname: 'col'}),
      wireframe: elation.elements.create('janus.ui.editor.property.boolean', {label: 'Wireframe', propertyname: 'wireframe'}),
      lighting: elation.elements.create('janus.ui.editor.property.boolean', {label: 'Lighting', propertyname: 'lighting'}),
      fog: elation.elements.create('janus.ui.editor.property.boolean', {label: 'Fog', propertyname: 'fog'}),
      shadow_cast: elation.elements.create('janus.ui.editor.property.boolean', {label: 'Cast Shadows', propertyname: 'shadow_cast'}),
      shadow_receive: elation.elements.create('janus.ui.editor.property.boolean', {label: 'Receive Shadows', propertyname: 'shadow_receive'}),
*/
    };
    this.header = elation.elements.create('h3', {
      innerHTML: 'Properties',
      append: this
    });
    this.list = elation.elements.create('ui-list', {
      class: 'janus_editor',
      //items: Object.values(this.propeditors),
      append: this,
      //itemcomponent: 'janus.ui.editor.property',
      //itemtemplate: 'janus.ui.editor.property',
    });
    this.setMode('pos');
  }
  setMode(mode) {
    if (this.list) {
      this.list.removeclass('mode_' + this.mode);
    }
    let oldmode = this.mode;
    if (this.propeditors && this.propeditors[oldmode]) {
      this.propeditors[oldmode].removeclass('selected');
    }
    this.mode = mode;
    if (this.list) {
      this.list.addclass('mode_' + mode);
    }
    if (this.propeditors[mode]) {
      this.propeditors[mode].addclass('selected');
      if (this.propeditors[mode].scrollIntoViewIfNeeded) {
        this.propeditors[mode].scrollIntoViewIfNeeded();
      }
    }
  }
  nextMode() {
    let modes = Object.keys(this.propeditors);
    let idx = modes.indexOf(this.mode);
    let newmode = modes[(idx + 1) % modes.length];
    this.setMode(newmode);
    return newmode;
  }
  prevMode() {
    let modes = Object.keys(this.propeditors);
    let idx = modes.indexOf(this.mode);
    let newmode = modes[(modes.length + idx - 1) % modes.length]
    this.setMode(newmode);
    return newmode;
  }
  getModeEditor() {
    if (!this.propeditors) return null;
    return this.propeditors[this.mode];
  }
  updateObject(object) {
    if (this.object !== object) {
      if (this.object) {
        this.object.removeEventListener('objectchange', this.handleThingChange);
      }
      this.object = object;
      //console.log('new object set', object, this.object);

      this.object.addEventListener('objectchange', this.handleThingChange);
      this.updatePropertyList();
    }
    this.updateProperties();
  }
  updatePropertyList() {
    this.propeditors = {};
    let obj = this.object,
        attrs = {},
        defs = obj._proxyobject._proxydefs;
    for (let k in defs) {
      if (defs[k][0] == 'property') {
        let attr = obj._thingdef.properties[defs[k][1]];
        if (attr) {
          let type = attr.type;
          if (type == 'bool') type = 'boolean';
          if (elation.elements.janus.ui.editor.property[type]) {
            let editor = elation.elements.create('janus.ui.editor.property.' + type, {
              label: k,
              propertyname: k,
              //value: this.object[k],
              title: attr.comment || '',
              selectable: true
            });
            //editor.updateValue(this.object[k]);
            this.propeditors[k] = editor;
            elation.events.add(editor, 'editorchange', (ev) => this.handleEditorChange(ev, k, attr));
            elation.events.add(editor, 'select', (ev) => this.handleEditorSelect(ev, k, attr));
          } else {
            console.log('UNKNOWN PROPERTY TYPE', k, attr);
          }
        }
      }
    }
    this.list.clear();
    this.list.innerHTML = ''; // FIXME - shouldn't be needed
    this.list.setItems(Object.values(this.propeditors));
  }
  updateProperties() {
    for (var k in this.propeditors) {
      if (!this.propeditors[k].editing) {
        this.propeditors[k].updateValue(this.object[k]);
      }
    }
  }
  handleThingChange(ev) {
    let obj = ev.target;
    //console.log('thing changed!', ev, obj.changes, obj, this);
    this.updateProperties();
  }
  handleEditorChange(ev, attrname, attrdef) {
    //console.log('the editor changed', ev.target.value, ev, attrname, attrdef);
    this.object[attrname] = ev.target.value;
    this.object.refresh();
  }
  handleEditorSelect(ev, attrname, attrdef) {
    //console.log('selected it', attrname);
    this.setMode(attrname);
  }
});
elation.elements.define('janus.ui.editor.scenetree', class extends elation.elements.base {
  create() {
    this.tree = elation.elements.create('ui.treeview', {
      append: this,
      draggable: true,
      selectable: true
    });
    this.tree.attrs = {
      name: 'js_id',
      label: 'js_id',
      children: 'children',
      visible: 'persist',
    };
    elation.events.add(this.tree, 'ui_treeview_select', (ev) => this.handleTreeviewSelect(ev));
    setTimeout(() => {
      this.refreshList();
    }, 0);
  }
  refreshList() {
    this.tree.setItems({
      room: {
        js_id: room.url,
        children: room.objects,
        persist: true,
        getProxyObject: room.getProxyObject.bind(room),
      }
    });
  }
  handleTreeviewSelect(ev) {
    elation.events.fire({type: 'select', element: this, data: ev.data.value.getProxyObject()});
  }
});
elation.elements.define('janus.ui.editor.source', class extends elation.elements.base {
  async create() {
    await janus.ui.apps.default.apps.editor.loadScriptsAndCSS([
      './codemirror/addon/hint/show-hint.js',
      './codemirror/addon/hint/xml-hint.js',
      './codemirror/addon/hint/javascript-hint.js',
      './codemirror/keymap/vim.js',
    ], [
      './codemirror/addon/hint/show-hint.css',
    ]);
    await room.loadComponentList();
    this.jmlhints = this.buildJMLMap();

    this.tabs = elation.elements.create('ui-tabs', { append: this });
    //let roomtab = elation.elements.create('ui-tab', { append: this.tabs, label: 'Room Markup' });
    let roomedit = elation.elements.create('janus-ui-editor-source-file', { append: this.tabs, label: 'Room Markup', source: room.getRoomSource(), hints: this.jmlhints });

    if (room.roomassets.script) {
      for (let k in room.roomassets.script) {
        let scriptasset = room.roomassets.script[k];
        //let scripttab = elation.elements.create('ui-tab', { append: this.tabs, label: k });
        let scriptedit = elation.elements.create('janus-ui-editor-source-file', { append: this.tabs, label: k, source: scriptasset.code, mode: 'javascript' });
      }
    }
  }
  buildJMLMap() {
    let tagMap = {};
    for (let tag in janus.customElements) tagMap[tag] = janus.customElements[tag];
    for (let tag in room.customElements) tagMap[tag] = room.customElements[tag];
    let allTags = Object.keys(tagMap).sort();

    let hints = {
      "!top": ["janus-viewer"],
      "fireboxroom": {
        children: ['assets', 'room'],
      },
      "janus-viewer": {
        children: ['assets', 'room'],
      },
      'assets': {
        children: ['assetimage', 'assetobject', 'assetfont', 'assetwebsurface', 'assetscript', 'assetsound', 'assetvideo', 'assetshader', 'assetghost'],
      },
      'room': {
        attrs: {},
        children: allTags,
      },
      'assetimage': {
        attrs: this.getAssetAttributes('image'),
      },
      'assetobject': {
        attrs: this.getAssetAttributes('model'),
      },
      'assetfont': {
        attrs: this.getAssetAttributes('font'),
      },
      'assetwebsurface': {
        attrs: {
          id: null,
          src: null,
        },
      },
      'assetscript': {
        attrs: this.getAssetAttributes('script'),
      },
      'assetsound': {
        attrs: this.getAssetAttributes('sound'),
      },
      'assetvideo': {
        attrs: this.getAssetAttributes('video'),
      },
      'assetshader': {
        attrs: this.getAssetAttributes('shader'),
      },
      'assetghost': {
        attrs: {
          id: null,
          src: null,
        },
      }
    };
    hints.Room = hints.room;
    hints.FireBoxRoom = hints.fireboxroom;
    hints.Assets = hints.assets;
    hints.AssetImage = hints.assetimage;
    hints.AssetObject = hints.assetobject;
    hints.AssetFont = hints.assetfont;
    hints.AssetWebsurface = hints.assetwebsurface;
    hints.AssetScript = hints.assetscript;
    hints.AssetSound = hints.assetsound;
    hints.AssetVideo = hints.assetvideo;
    hints.AssetShader = hints.assetshader;
    hints.AssetGhost = hints.assetghost;

    let roomattrs = this.getAttributes({classname: 'janusroom'}, room);
    let roomattrkeys = Object.keys(roomattrs).sort();
    roomattrkeys.forEach(attrname => {
      if (attrname != 'requires') { // We'll handle <room require="..."> as a special case, partly because of the name mismatch and partly so we can autosuggest components from the repository
        let attr = roomattrs[attrname];
        hints['room'].attrs[attrname] = (attr.type == 'boolean' || attr.types == 'bool' ? ['true', 'false'] : null);
      } else {
        hints['room'].attrs.require = Object.keys(room.componentrepository).sort();;
      }
    });

    hints['room'].attrDelims = { require: ' ' };

    for (let i = 0; i < allTags.length; i++) {
      let tag = allTags[i],
          tagdef = tagMap[tag];
      let attrs = this.getAttributes(tagdef);
      
      hints[tag] = {
        attrs: {},
        children: allTags,
      };
      hints[elation.utils.camelize('.' + tag)] = hints[tag]; // capitalize first letter of tag, mapped to the all-lowercase tag definition

      let attrkeys = Object.keys(attrs).sort();
      attrkeys.forEach(attrname => {
        let attr = attrs[attrname];
        hints[tag].attrs[attrname] = (attr.type == 'boolean' || attr.types == 'bool' ? ['true', 'false'] : null);
      });
    }

    // Autocomplete asset ids of various types
    hints.object.attrs.id =
      hints.object.attrs.collision_id =
      hints.particle.attrs.emitter_id =
         cm => this.getAssetSuggestions('model');

    hints.object.attrs.image_id =
      hints.object.attrs.normalmap_id =
      hints.object.attrs.roughness_id =
      hints.object.attrs.metalness_id =
      hints.object.attrs.displacementmap_id =
      hints.object.attrs.emissive_id =
      hints.object.attrs.alphamap_id =
      hints.object.attrs.envmap_id =
      hints.object.attrs.lmap_id =
      hints.object.attrs.lmap_id =
      hints.image.attrs.id =
      hints.image3d.attrs.id =
      hints.particle.attrs.image_id =
      hints.link.attrs.thumb_id =
      hints.room.attrs.skybox_up_id =
      hints.room.attrs.skybox_down_id =
      hints.room.attrs.skybox_left_id =
      hints.room.attrs.skybox_right_id =
      hints.room.attrs.skybox_front_id =
      hints.room.attrs.skybox_back_id =
      hints.room.attrs.skybox_equi =
        cm => this.getAssetSuggestions('image');

    hints.object.attrs.video_id =
      hints.video.attrs.video_id =
        cm => this.getAssetSuggestions('video');

    hints.object.attrs.shader_id =
      hints.link.attrs.shader_id =
        cm => this.getAssetSuggestions('shader');

    hints.text.attrs.font = cm => this.getAssetSuggestions('font');
    hints.sound.attrs.id = cm => this.getAssetSuggestions('sound');

    hints.object.attrs.cull_face =
      hints.paragraph.attrs.cull_face =
        ['back', 'front', 'none'];

    hints.object.blend_src =
      hints.object.blend_dest =
        ['zero', 'one', 'src_color', 'dst_color', 'src_alpha', 'dst_alpha', 'one_minus_src_color', 'one_minus_src_alpha', 'one_minus_dst_color', 'one_minus_dst_alpha'];

    hints.room.attrs.fog_mode = ['linear', 'exp', 'exp2'];
    hints.room.attrs.tonemapping_type = Object.keys(room.toneMappingTypes);

    return hints;
  }
  getAssetSuggestions(assettype) {
    let hints = [];
    if (janus.assetpack.assetmap[assettype]) Array.prototype.push.apply(hints, Object.keys(janus.assetpack.assetmap[assettype]));
    if (room.assetpack && room.assetpack.assetmap[assettype]) Array.prototype.push.apply(hints, Object.keys(room.assetpack.assetmap[assettype]));

    return hints.sort();
  }
  getAttributes(objdef, bindobj) {
    console.log('parse the object', objdef);
    let elationThing = elation.engine.things[objdef.classname];
    let allProperties = this.parseThingProperties(elationThing, null, bindobj);

    if (!(objdef.class instanceof Function)) {
      for (let attrname in objdef.class) {
        let attr = objdef.class[attrname];
        let attrtype = (attr === true || attr === false ? 'boolean' : 'whatever');
        allProperties.properties[attrname] = { type: attrtype };
        allProperties.proxies[attrname] = ['property', attrname];
      }
    }

    let attrs = {};
    if (allProperties) {
      for (let k in allProperties.proxies) {
        let p = allProperties.proxies[k];
        if (p[0] == 'property' && allProperties.properties[p[1]]) {
          let attr = allProperties.properties[p[1]];
          if (attr.type != 'object') { // Skip object types, since they're generally only used internally
            attrs[k] = attr;
          }
        } else if (p[0] == 'callback') {
          attrs[k] = { type: 'callback' };
        }
      }
    }
    return attrs;
  }
  getAssetAttributes(assetname) {
    let attrs = {},
        props = this.parseAssetProperties(assetname);
    let propkeys = Object.keys(props).sort();
    for (let i = 0; i < propkeys.length; i++) {
      attrs[propkeys[i]] = (props[propkeys[i]].type == 'boolean' ? ['true', 'false'] : null);
    }
    return attrs;
  }
  parseAssetProperties(assetname) {
    let props = {};
    if (elation.engine.assets[assetname]) {
      let prot = elation.engine.assets[assetname].prototype;
      let exclude = ['assettype', 'assetpack', 'instances', 'baseurl', 'preview', 'loaded', 'size', 'proxy', 'sourceurl', 'author', 'license', 'description', 'frames', 'canvas', 'rawimage', 'texture', 'video'];
      for (let k in prot) {
        if (typeof prot[k] != 'function' && exclude.indexOf(k) == -1) {
          let attrtype = (prot[k] === true || prot[k] === false ? 'boolean' : 'whatever');
          let propname = (k == 'name' ? 'id' : k);
          props[propname] = { type: attrtype };
        }
      }
    }
    return props;
  }
  parseThingProperties(thing, props, bindobj) {
    if (!props) props = {
      properties: {},
      proxies: {}
    };

    if (thing.extendclassdef) {
      let parentThing = thing.extendclassdef;
      this.parseThingProperties(parentThing, props);
    }

    let mProps = thing.classdef.toString().match(/defineProperties\(({.*?})\)/ms);
    let mProxies = thing.classdef.toString().match(/(new elation\.proxy\(this, |_proxydefs = )({.*?})[;|\)]/ms);
    (elation.bind(bindobj || this, function() {
      if (mProps) {
        let propmap;
        eval('propmap = ' + mProps[1]);
        for (let k in propmap) props.properties[k] = propmap[k];
      }
      if (mProxies) {
        let proxymap;
        eval('proxymap = ' + mProxies[2]);
        for (let k in proxymap) props.proxies[k] = proxymap[k];
      }
    }))();
    return props;
  }
});
elation.elements.define('janus.ui.editor.source.file', class extends elation.elements.ui.tab {
  init() {
    super.init();
    this.defineAttributes({
      source: { type: 'string' },
      filename: { type: 'string', default: 'New File' },
      mode: { type: 'string', default: 'xml' },
      hints: { type: 'object' },
    });
  }
  create() {
    this.filename = this.label;

    this.initCodemirror();
    elation.events.add(this.parentNode, 'tabselect', ev => { this.codemirror.refresh(); setTimeout(() => { this.codemirror.focus(); }, 0); });
  }
  async initCodemirror() {
    if (!CodeMirror.modes[this.mode]) {
      await janus.ui.apps.default.apps.editor.loadScriptsAndCSS([`./codemirror/mode/${this.mode}/${this.mode}.js`]);
    }

    this.codemirror = CodeMirror(this, {
      value: this.source,
      mode: this.mode,
      lineNumbers: true,
      extraKeys: {
        'Ctrl-S': () => this.handleSave(),
        'Ctrl-Space':(cm) => {  CodeMirror.showHint(cm, CodeMirror.hint[this.mode]); }, 
        'Ctrl-Alt-V':(cm) => {
          if (cm.state.keyMaps.indexOf(CodeMirror.keyMap.vim) != -1) {
            // FIXME - removing the keymap doesn't actually work, the bindings stay active
            cm.removeKeyMap(CodeMirror.keyMap.vim);
          } else {
            cm.addKeyMap(CodeMirror.keyMap.vim);
          }
          cm.refresh();
        }, 
      },
      hintOptions: {
        autohint: true,
        schemaInfo: this.hints,
        matchInMiddle: true,
      },
    });
console.log('editor hints', this.hints);
    this.codemirror.on('change', (ev) => this.handleEditContentChange(ev));
    this.codemirror.on('change', (ev) => this.handleEditContentChange(ev));

    let skipKeyCodes = [
      8, // backspace
      9, // tab
      13, // enter
      16, // shift
      17, // ctrl
      18, // alt
      27, // esc
      //32, // space
      33, // pgup
      34, // pgdn
      35, // home
      36, // end
      37, // left
      38, // up
      39, // right
      40, // down
      46, // delete

      48, 49, 50, 51, 52, 53, 54, 55, 56, 57, // 0-9
      186, // ;
      189, // -
      219, // {
      221, // }
    ];
    if (this.mode == 'javascript') {
      skipKeyCodes.push(32); // space
      skipKeyCodes.push(187); // =
    } else if (this.mode == 'xml') {
      skipKeyCodes.push(190); // . and  >
    }
    this.codemirror.on("keyup", function (cm, event) {
      if ((!cm.state.completionActive && /*Enables keyboard navigation in autocomplete list*/
          !event.ctrlKey && !event.altKey &&
          skipKeyCodes.indexOf(event.keyCode) == -1)) {        /*Enter - do not open autocomplete list just after item has been selected in it*/ 
        CodeMirror.commands.autocomplete(cm, null, {completeSingle: false});
      }
    });
  }
  handleSave() {
    this.source = this.codemirror.getValue();
    this.label = this.filename;
  }
  handleEditContentChange(ev) {
    //console.log('it changed', ev);
    let newsource = this.codemirror.getValue();
    this.dirty = (newsource != this.source);
    if (this.dirty) {
      this.label = '*' + this.filename;
    } else {
      this.label = this.filename;
    }
    if (this.updatetimer) {
      clearTimeout(this.updatetimer);
    }
    this.updatetimer = setTimeout(() => {
      room.updateSource(newsource);
      this.updatetimer = false;
    }, 500);
  }
});

class ColorTransform extends THREE.Object3D {
  
  attach(object) {
  }
};
