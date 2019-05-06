elation.elements.define('janus.ui.editor.panel', class extends elation.elements.base {
  create() {
    //this.innerHTML = elation.template.get('janus.ui.editor.panel');
    let elements = elation.elements.fromTemplate('janus.ui.editor.panel', this);
console.log('my elements!', elements);
    elation.events.add(elements.transformtype, 'change', (ev) => this.handleTransformTypeChange(ev));
    elation.events.add(elements.transformspace, 'change', (ev) => this.handleTransformSpaceChange(ev));
    //elements.transformglobal.addEventListener('deactivate', (ev) => this.handleTransformGlobalDeactivate(ev));

    elation.events.add(elements.translatesnap, 'change', (ev) => this.handleTranslateSnapChange(ev));
    elation.events.add(elements.rotatesnap, 'change', (ev) => this.handleRotateSnapChange(ev));

    elation.events.add(elements.physicsdebug, 'click', (ev) => this.handlePhysicsDebugClick(ev));

    this.elements = elements;

    this.roomedit = {
      snap: .01,
      rotationsnap: 5,
      modes: ['pos', 'rotation', 'scale', 'col'],
      movespeed: new THREE.Vector3(),
      modeid: 0,
      object: false,
      transforming: false,
    };
    this.editObjectSetSnap(this.roomedit.snap);

    janus.engine.systems.controls.addContext('roomedit', {
      'accept':           [ 'keyboard_enter', (ev) => { if (ev.value) this.editObjectStop(); } ],
      'cancel':           [ 'keyboard_esc', this.editObjectCancel ],
      'delete':           [ 'keyboard_delete,keyboard_backspace', this.editObjectDelete ],
      'mode':             [ 'keyboard_nomod_tab', this.editObjectToggleMode ],
      'mode_reverse':     [ 'keyboard_shift_tab', this.editObjectToggleModeReverse ],
      //'toggle_raycast':   [ 'keyboard_shift',   this.editObjectToggleRaycast ],
      'manipulate_left':  [ 'keyboard_j',   this.editObjectManipulateLeft ],
      'manipulate_right': [ 'keyboard_l',   this.editObjectManipulateRight ],
      'manipulate_up':    [ 'keyboard_i',   this.editObjectManipulateUp ],
      'manipulate_down':  [ 'keyboard_k',   this.editObjectManipulateDown ],
      'manipulate_in':    [ 'keyboard_u',   this.editObjectManipulateIn ],
      'manipulate_out':   [ 'keyboard_o',   this.editObjectManipulateOut ],
      //'manipulate_mouse': [ 'mouse_delta',   this.editObjectManipulateMouse ],
      'snap_ones':        [ 'keyboard_1',   this.editObjectSnapOnes ],
      'snap_tenths':      [ 'keyboard_2',   this.editObjectSnapTenths ],
      'snap_hundredths':  [ 'keyboard_3',   this.editObjectSnapHundredths ],
      'snap_thousandths': [ 'keyboard_4',   this.editObjectSnapThousandths ],

      'copy':     [ 'keyboard_ctrl_c', (ev) => { if (ev.value == 1) this.editObjectCopy(ev); } ],
      'cut':     [ 'keyboard_ctrl_x', (ev) => { if (ev.value == 1) this.editObjectCut(ev); } ],
    });
    janus.engine.systems.controls.addContext('roomedit_togglemove', {
      'togglemove':       [ 'keyboard_shift', elation.bind(this, this.editObjectToggleMove)],
    });
    janus.engine.systems.controls.addContext('roomedit_paste', {
      'paste':     [ 'keyboard_ctrl_v', (ev) => { if (ev.value == 1) this.editObjectPaste(ev); } ],
    });
    janus.engine.systems.controls.activateContext('roomedit_paste');

    if (typeof room != 'undefined') {
      this.initRoomEvents(room);
    }
    document.addEventListener('paste', (ev) => this.handlePaste(ev));
  }
  initRoomEvents(room) {
    room.addEventListener('click', (ev) => this.handleRoomClick(ev));
    //room.addEventListener('mouseover', (ev) => console.log('mouseover', ev.data));
    //room.addEventListener('mouseout', (ev) => console.log('mouseout', ev.data));
    elation.events.add(room, 'dragenter', (ev) => this.handleDragOver(ev));
    elation.events.add(room, 'dragover', (ev) => this.handleDragOver(ev));
    room.addEventListener('dragenter', (ev) => this.handleDragOver(ev));
    room.addEventListener('dragover', (ev) => this.handleDragOver(ev));
    room.addEventListener('drop', (ev) => this.handleDrop(ev));
  }

  getManipulator() {
    if (typeof room == 'undefined') return;
    if (!this.manipulator) {
      let view = janus.engine.client.view;
      this.manipulator = new THREE.TransformControls(view.actualcamera, view.container);

      elation.events.add(this.manipulator, 'mouseDown', (ev) => {
        this.roomedit.transforming = true;
console.log('mouse down!');
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
        janus.engine.systems.render.setdirty();
      });
      elation.events.add(this.manipulator, 'objectChange', (ev) => {
        this.editObjectShowInfo(this.roomedit.object);
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
  setTranslationSnap(snap) {
    let manipulator = this.getManipulator();
    if (snap == 'Off') snap = 0;
    if (manipulator) manipulator.setTranslationSnap(+snap);
    if (this.elements.translatesnap.value != snap) {
      this.elements.translatesnap.value = snap || 'Off';
    }
    this.roomedit.snap = snap;
  }
  setRotationSnap(snap) {
    this.roomedit.rotationsnap = snap;
    let manipulator = this.getManipulator();
    if (snap == 'Off') snap = 0;
    if (manipulator) manipulator.setRotationSnap(+snap);
console.log('oh snap', snap, this.elements.rotatesnap.value);
    if (this.elements.rotatesnap.value != snap) {
      this.elements.rotatesnap.value = snap || 'Off';
    }
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
  handlePhysicsDebugClick(ev) {
    if (!ev.target.active) {
      janus.engine.client.view.pickingdebug = true;
      janus.engine.systems.world.enableDebug();
    } else {
      janus.engine.client.view.pickingdebug = false;
      janus.engine.systems.world.disableDebug();
    }
    janus.engine.systems.render.setdirty();
  }
  handleRoomClick(ev) {
    if (ev.button == 2) {
        if (this.roomedit.object) {
          this.editObjectRevert();
        } else if ((!room.localasset || !room.localasset.isEqual(ev.element)) && !ev.element.locked && !room.locked) {
          this.roomedit.raycast = false;
          this.editObject(ev.element.getProxyObject());
        }
    } else if (ev.button == 0 && !this.roomedit.transforming) {
      if (this.roomedit.object) {
        this.editObjectStop();
      }
    }
  }
  editObject(object, isnew) {
    this.roomedit.object = object;
    this.roomedit.objectBoundingBox = false;
    this.roomedit.modeid = 0;
    this.roomedit.objectIsNew = isnew;
    this.roomedit.moving = true;
    this.roomedit.movespeed.set(0, 0, 0);

console.log('edit it', object);
    object.sync = true;
    if (!object.js_id) {
      object.js_id = player.userid + '-' + window.uniqueId();
    }

    this.roomedit.objectBoundingBox = object.getBoundingBox(true);
    object.addEventListener('load', (ev) => {
      this.roomedit.objectBoundingBox = object.getBoundingBox(true);
      this.editObjectUpdate();
      this.editObjectShowWireframe();
      console.log('update bbox', this.roomedit.objectBoundingBox);
    });

    this.roomedit.collision_id = object.collision_id;
setTimeout(() => {
    object.collision_id = '';
    object.collision_radius = null;
}, 0);

console.log('bind mouse move', this.editObjectMousemove);
    room.addEventListener('mousemove', (ev) => this.editObjectMousemove(ev));
    room.addEventListener('wheel', (ev) => this.editObjectMousewheel(ev));
    elation.events.add(this, 'mousedown', this.editObjectClick);
    elation.events.add(document, 'pointerlockchange', (ev) => this.editObjectHandlePointerlock(ev));

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
    //this.engine.systems.controls.activateContext('roomedit_togglemove', this);

    this.editObjectShowWireframe();
    this.editObjectShowInfo(object);
    let manipulator = this.getManipulator();
    manipulator.attach(object.objects['3d']);
    manipulator.enabled = true;
    this.setMode('pos');
  }

  editObjectShowInfo(object) {
    //let content = elation.template.get('janus.ui.editor.object.info', {object: object, editmode: this.roomedit.modes[this.roomedit.modeid]});
    if (!this.infowindow) {
      this.objectinfo = elation.elements.create('janus-ui-editor-objectinfo', { object: object });
      this.infowindow = elation.elements.create('ui-window', {top: 50, right: 1, width: '16em', title: object.js_id, minimizable: 0, maximizable: 0, closable: 0, append: document.body, content: this.objectinfo});
setTimeout(() => {
      this.objectinfo.updateObject(object);
}, 100);
    } else { //if (this.infowindow.title != object.js_id) {
      this.infowindow.settitle(object.js_id);
// FIXME - wy is dely needed here?
setTimeout(() => {
      this.objectinfo.updateObject(object);
}, 100);
    }
    if (this.infowindow.hidden) {
      this.infowindow.show();
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
      root.matrix.identity();
    }
    this.roomedit.wireframe = root;
    this.roomedit.object._target.objects['3d'].add(root);
    root.updateMatrixWorld();
  }
  editObjectCloneWireframe(obj, parent, material, constrain) {
    let newobj = null;
    if (obj instanceof THREE.Mesh) {
      newobj = new THREE.Mesh(obj.geometry, material)
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
        } else {
          this.roomedit.object.collision_id = 'cube';
          this.roomedit.object.collision_trigger = true;
          this.roomedit.object.collision_scale = this.roomedit.objectBoundingBox.max.clone().sub(this.roomedit.objectBoundingBox.min);
          this.roomedit.object.collision_pos = this.roomedit.objectBoundingBox.max.clone().add(this.roomedit.objectBoundingBox.min).multiplyScalar(.5);
        }
      }
    }
    this.roomedit.object = false;
    this.editObjectRemoveWireframe();
    let manipulator = this.getManipulator();
    manipulator.detach();
    manipulator.enabled = false;
    if (this.infowindow) {
      this.infowindow.hide();
    }

    elation.events.remove(room, 'mousemove', this.editObjectMousemove);
    elation.events.remove(this, 'wheel', this.editObjectMousewheel);
    elation.events.remove(this, 'mousedown', this.editObjectClick);
    elation.events.remove(document, 'pointerlockchange', this.editObjectHandlePointerlock);

    // deactivate context
    janus.engine.systems.controls.deactivateContext('roomedit', this);
    //this.engine.systems.controls.deactivateContext('roomedit_togglemove', this);
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
        this.roomedit.objectPosition = ev.data.point;
        let manipulator = this.getManipulator();
        manipulator.enabled = false;
        this.editObjectUpdate();
      }
    }
  }
  editObjectUpdate() {
    var obj = this.roomedit.object;
    var bbox = this.roomedit.objectBoundingBox;

    var point = this.roomedit.objectPosition || this.roomedit.object.position;

    if (!bbox) {
      bbox = this.roomedit.objectBoundingBox = obj.getBoundingBox(true);
    }
    var headpos = player.head.localToWorld(V(0,0,0));
    var cursorpos = obj.parent.worldToLocal(translate(point, V(0, -bbox.min.y, 0)), true);
    cursorpos = this.editObjectSnapVector(cursorpos, this.roomedit.snap);
    var dir = V(cursorpos).sub(headpos);
    var distance = dir.length();
    dir.multiplyScalar(1/distance);
    //distance = Math.min(distance, 20);
    var newpos = V(headpos).add(V(dir).multiplyScalar(distance));

    obj.pos = newpos;
    obj.sync = true;
  }
  editObjectMousewheel(ev) {
      //this.roomedit.distancescale *= (ev.deltaY > 0 ? .9 : 1.1);
      let obj = this.roomedit.object,
          mode = this.roomedit.modes[this.roomedit.modeid];

console.log('do go', mode, obj, ev);
      if (mode == 'pos') {
        let move = this.roomedit.snap * (ev.deltaY < 0 ? -1 : 1);
        if (ev.ctrlKey) {
          obj.pos.y += move;
        } else if (ev.shiftKey) {
          obj.pos.z += move;
        } else {
          obj.pos.x += move;
        }
        this.editObjectSnapVector(obj.pos._target, this.roomedit.snap);
      } else if (mode == 'rotation') {
        let rot = new THREE.Euler();
        let quat = new THREE.Quaternion();
        let move = (ev.deltaY > 0 ? 1 : -1) * this.roomedit.rotationsnap * THREE.Math.DEG2RAD;
        if (ev.ctrlKey) {
          rot.z += move;
        } else if (ev.shiftKey) {
          rot.x += move;
        } else {
          rot.y += move;
        }
        quat.setFromEuler(rot);
        obj.orientation.multiply(quat);
        //this.editObjectSnapVector(obj.rotation, this.roomedit.rotationsnap * THREE.Math.DEG2RAD);
      } else if (mode == 'scale') {
        let scale = this.roomedit.snap * (ev.deltaY < 0 ? 1 : -1);
        if (ev.ctrlKey) {
          obj.scale.y += scale;
        } else if (ev.shiftKey) {
          obj.scale.z += scale;
        } else {
          obj.scale.x += scale;
          obj.scale.y += scale;
          obj.scale.z += scale;
        }
      }
      obj.refresh();
      this.editObjectShowInfo(obj);
      ev.preventDefault();
//obj.updateOrientationFromEuler();
//obj.updateDirvecsFromOrientation();
      //this.editObjectMousemove(ev);
    }
  editObjectClick(ev) {
    if (this.roomedit.object) {
      if (ev.button == 0) {
        this.editObjectStop();
      } else if (ev.button == 2) {
        this.editObjectRevert();
      }
    }
  }
  editObjectGetMode() {
    return this.roomedit.modes[this.roomedit.modeid];
  }
  editObjectToggleMode(ev) {
    var roomedit = ev.target.roomedit;
    if (!roomedit.object) return;
    if (ev.value) {
      var modes = roomedit.modes,
          modeid = (roomedit.modeid + 1) % modes.length;

      roomedit.modeid = modeid;
      ev.target.editObjectShowInfo(roomedit.object);

console.log('toggle up');
      ev.target.setMode(modes[modeid]);
    }
  }
  editObjectToggleModeReverse(ev) {
    var roomedit = ev.target.roomedit;
    if (!roomedit.object) return;
    if (ev.value) {
      var modes = roomedit.modes,
          modeid = (modes.length + roomedit.modeid - 1) % modes.length;

      roomedit.modeid = modeid;
      ev.target.editObjectShowInfo(roomedit.object);

console.log('toggle down');
      ev.target.setMode(modes[modeid]);
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

        let rot = new THREE.Euler().setFromVector3(vec.clone().multiplyScalar(amount * THREE.Math.DEG2RAD));
        let quat = new THREE.Quaternion();
        quat.setFromEuler(rot);
        //obj.rotation = V(rot.x * THREE.Math.RAD2DEG, rot.y * THREE.Math.RAD2DEG, rot.z * THREE.Math.RAD2DEG);
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
        obj.col = V(THREE.Math.clamp(obj.col.r + vec.x * snap, 0, 1),
                    THREE.Math.clamp(obj.col.g + vec.y * snap, 0, 1),
                    THREE.Math.clamp(obj.col.b + vec.z * snap, 0, 1));

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

    if (amount == 1) this.setRotationSnap(90);
    else if (amount == .1) this.setRotationSnap(45);
    else if (amount == .01) this.setRotationSnap(15);
    else if (amount == .001) this.setRotationSnap(5);
    console.log('set snap to', amount);
  }

  // FIXME - the following functions aren't bound to "this", because the control system isn't properly managing context
  editObjectManipulateLeft(ev) {
console.log('manip left', ev.value, ev);
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
      this.engine.systems.conyytrols.activateContext('roomedit', this);
    } else if (ev.value == 0) {
      roomedit.moving = true;
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

      let data = new DataTransfer();
      data.items.add('text/plain', 'blublub');
      //data.items.add('x-janus/x-' + obj.tag, 'cool huh');
      navigator.clipboard.write(data).then(() => {
        console.log('success!');
      }, (e) => {
        console.log('FAILED!', e);
      });
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
console.log('here is the new one', newobj);
      //oldobj.parent.add(oldobj.clone());
    }
  }
  handleDragOver(ev) {
console.log('do the dragover', ev);
    //ev.dataTransfer.dropEffect = "link"
    ev.preventDefault();
  }
  handleDrop(ev) {
    ev.preventDefault();
    var files = ev.dataTransfer.files,
        items = ev.dataTransfer.items;
    this.roomedit.raycast = true;
    if (files.length > 0) {
      var objects = [];
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
        types['text/x-jml'].getAsString((jml) => this.loadObjectFromJML(jml));
      } else if (types['text/uri-list']) {
        types['text/uri-list'].getAsString((urilist) =>  this.loadObjectFromURIList(urilist));
      }
    }
    if (janus.engine.systems.admin.hidden) {
      janus.engine.systems.controls.requestPointerLock();
    }
  }
  loadObjectFromURIList(list) {
    var urls = list.split('\n');

    var objects = [];
    for (var i = 0; i < urls.length; i++) {
      var hashidx = urls[i].indexOf('#');
      let id = (hashidx == -1 ? urls[i] : urls[i].substring(0, hashidx)).trim();
      let type = 'Object';
      let objargs = {
        id: id,
        js_id: player.userid + '-' + id + '-' + window.uniqueId(),
        //cull_face: 'none',
        sync: true,
        pos: player.vectors.cursor_pos.clone()
      }
      if (id.length > 0) {
        var schemeidx = id.indexOf(':');
        if (schemeidx != -1) {
          // Handle special schemes which are used for internal primitives
          var scheme = id.substr(0, schemeidx);
          if (scheme == 'janus-object') {
            objargs.id = id.substr(schemeidx+1);
            objargs.collision_id = objargs.id;
          } else if (scheme == 'janus-light') {
            type = 'light';
            if (id == 'point') {
              // set up the point light
              objargs.light_shadow = 'true';
            }
          }
        }
        if (id.match(/\.(png|gif|jpg|jpeg)/i)) {
          type = 'image';
        }
        if (typeof EventBridge != 'undefined') {
          // if EventBridge is defined, we're (probably) running inside of High Fidelity, so just spawn this object
          EventBridge.emitWebEvent(JSON.stringify({
            type: 'spawn',
            data: objargs.id
          }));
        } else {
          var newobject = room.createObject(type, objargs);
          objects.push(newobject);
        }
      }
    }
    if (objects[0]) {
      this.editObject(objects[0], true);
    }
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
          sync: true
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
});

elation.elements.define('janus.ui.editor.objectinfo', class extends elation.elements.base {
  create() {
    this.handleThingChange = elation.bind(this, this.handleThingChange);
console.log('I CREATE', this.handleThingChange);
    this.defineAttributes({
      object: { type: 'object' },
      mode: { type: 'string', default: 'pos' }
    });
    this.propeditors = {
      pos: elation.elements.create('janus.ui.editor.property.vector3', {label: 'Position', propertyname: 'pos'}),
      rotation: elation.elements.create('janus.ui.editor.property.euler', {label: 'Rotation', propertyname: 'rotation'}),
      scale: elation.elements.create('janus.ui.editor.property.vector3', {label: 'Scale', propertyname: 'scale'}),
      col: elation.elements.create('janus.ui.editor.property.color', {label: 'Color', propertyname: 'col'}),
    };
    this.list = elation.elements.create('ui-list', {
      class: 'janus_editor',
      items: Object.values(this.propeditors),
      append: this,
      //itemcomponent: 'janus.ui.editor.property',
      //itemtemplate: 'janus.ui.editor.property',
    });
    this.setMode('pos');
console.log('created objectinfo', this.object, this);
  }
  setMode(mode) {
console.log('set mode', mode);
    if (this.list) {
      this.list.removeclass('mode_' + this.mode);
    }
    this.mode = mode;
    if (this.list) {
      this.list.addclass('mode_' + mode);
    }
  }
  updateObject(object) {
    if (this.object !== object) {
      if (this.object) {
        this.object.removeEventListener('objectchange', this.handleThingChange);
      }
      this.object = object;
      //console.log('new object set', object, this.object);

      this.object.addEventListener('objectchange', this.handleThingChange);
      this.updateProperties();
    }
  }
  updateProperties() {
    for (var k in this.propeditors) {
      this.propeditors[k].updateValue(this.object[k]);
    }
  }
  handleThingChange(ev) {
    let obj = ev.target;
    console.log('thing changed!', ev, obj, this);
    this.updateProperties();
  }
});

class ColorTransform extends THREE.Object3D {
  
  attach(object) {
  }
};
