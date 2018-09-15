elation.require(['ui.all', 'janusweb.urlbar'], function() {
  elation.component.add('janusweb.ui.old', function() {
    this.init = function() {
      elation.janusweb.ui.navigation.extendclass.init.call(this);

      this.client = this.args.client;
      this.player = this.client.player;
      this.janusweb = this.client.janusweb;

      this.createUI();
      //this.createUI3D();
    }
    this.createUI = function() {
      this.navigation = elation.ui.panel({append: this, classname: 'janusweb_ui_navigation'})
      this.backbutton = elation.ui.button({append: this.navigation, label: '◀', events: { click: elation.bind(this.janusweb, this.janusweb.navigateBack) } });
      this.homebutton = elation.ui.button({append: this.navigation, label: '🏠', events: { click: elation.bind(this.janusweb, this.janusweb.navigateHome) } });
      this.urlbar = elation.janusweb.urlbar({
        append: this.navigation, 
        label: '', 
        value: this.janusweb.properties.url, 
        janusweb: this.janusweb,
        client: this.client,
        events: { 
          ui_input_accept: elation.bind(this, function(ev) { this.janusweb.setActiveRoom(ev.data); this.client.hideMenu(); this.player.enable(); }),
          focus: elation.bind(this, function(ev) { this.player.disable(); }),
          blur: elation.bind(this, function(ev) { this.player.enable(); }),
        }
      });
    }

    this.createUI3D = function() {
      var nav3d = this.janusweb.spawn('generic', 'janusweb_navigation_3d', { position: [0,1,5] });
      this.navigation3d = elation.ui.panel3d({append3d: nav3d, panelorientation: 'horizontal', classname: 'janusweb_ui_navigation'})

      this.backbutton3d    = elation.ui.button3d({append3d: this.navigation3d, label: '◀', events: { click: elation.bind(this.janusweb, this.janusweb.navigateBack) } });
      this.forwardbutton3d = elation.ui.button3d({append3d: this.navigation3d, label: '▶', events: { click: elation.bind(this.janusweb, this.janusweb.navigateForward) } });
      this.homebutton3d    = elation.ui.button3d({append3d: this.navigation3d, label: '🏠', events: { click: elation.bind(this.janusweb, this.janusweb.navigateHome) } });
    }
    this.enable = function() {
      elation.janusweb.ui.navigation.extendclass.enable.call(this);
      this.navigation.enable();
    }
    this.disable = function() {
      elation.janusweb.ui.navigation.extendclass.disable.call(this);
      this.navigation.disable();
    }
  }, elation.ui.base);

  /* base3d */
  elation.component.add('ui.base3d', function() {
    this.init = function() {
      var append3d = this.args.append3d;
      if (append3d.sceneobj) append3d = append3d.sceneobj;
      this.style = new elation.ui.style3d();

      if (append3d) {
        this.engine = append3d.engine;
        this.client = this.engine.client;
        this.sceneobj = this.create();
        if (this.sceneobj) {
          append3d.add(this.sceneobj);
        }
      }
    }
    this.create = function() {
    }
    this.dimensions = function() {
      if (this.sceneobj) {
        var bounds = this.sceneobj.getBoundingBox();
      }
    }
  }, elation.ui.base);

  /* panel */
  elation.component.add('ui.panel3d', function() {
    this.init = function() {
      elation.ui.panel3d.extendclass.init.call(this);
    }
    this.create = function() {
      return elation.engine.things.ui_panel({engine: this.client.engine, client: this.client, properties: this.args, id: Math.floor(Math.random() * 1e10), events: this.events});
    }
  }, elation.ui.base3d);
  elation.component.add('engine.things.ui_panel', function() {
    this.postinit = function() {
      elation.engine.things.ui_panel.extendclass.postinit.call(this);
      this.defineProperties({
        panelorientation: { type: 'string', default: 'vertical' }
      });
      elation.events.add(this, 'thing_add', elation.bind(this, this.update));
    }
    this.createObject3D = function() {
      var box = new THREE.BoxGeometry(1,1,1);
      var mat = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
      var bbox = new THREE.Mesh(box, mat);

      this.geometry = box;

      var obj = new THREE.Object3D();
      obj.add(bbox);
      bbox.visible = false;
      return obj;
    }
    this.update = function() {
      var offset = [0,0,0];
      var size = new THREE.Vector3();
      var bounds = new THREE.Box3();

      // Use the 3d object's children since it's a regular array, in order of insertion
      for (var i = 0; i < this.objects['3d'].children.length; i++) {
        if (!this.objects['3d'].children[i].userData || !this.objects['3d'].children[i].userData.thing) continue;
        var child = this.objects['3d'].children[i].userData.thing;
        var dims = child.getBoundingBox();
        dims.size(size);
        child.position.x = offset[0];
        child.position.y = offset[1];
        child.position.z = offset[2];

        if (this.panelorientation == 'horizontal') {
          offset[0] += size.x;
        } else if (this.panelorientation == 'vertical') {
          offset[1] -= size.y;
        } else if (this.panelorientation == 'depth') {
          offset[2] += size.z;
        }

        var dims = child.getBoundingBox();
        bounds.expandByPoint(dims.min);
        bounds.expandByPoint(dims.max);
      }
      var worldpos = this.localToWorld(new THREE.Vector3(0,0,0));
      bounds.min.sub(worldpos);
      bounds.max.sub(worldpos);
      bounds.size(size);
      //this.objects['3d'].scale.set(size.x, size.y, size.z);

      this.geometry.vertices[0].set(bounds.max.x, bounds.max.y, bounds.max.z);
      this.geometry.vertices[1].set(bounds.max.x, bounds.max.y, bounds.min.z);
      this.geometry.vertices[2].set(bounds.max.x, bounds.min.y, bounds.max.z);
      this.geometry.vertices[3].set(bounds.max.x, bounds.min.y, bounds.min.z);
      this.geometry.vertices[4].set(bounds.min.x, bounds.max.y, bounds.min.z);
      this.geometry.vertices[5].set(bounds.min.x, bounds.max.y, bounds.max.z);
      this.geometry.vertices[6].set(bounds.min.x, bounds.min.y, bounds.min.z);
      this.geometry.vertices[7].set(bounds.min.x, bounds.min.y, bounds.max.z);

      if (this.geometry.boundingBox) {
        this.geometry.boundingBox.copy(bounds);
      } else {
        this.geometry.boundingBox = bounds;
      }
    }
  }, elation.engine.things.generic);

  /* button */
  elation.component.add('ui.button3d', function() {
    this.create = function() {
      return elation.engine.things.ui_button({engine: this.client.engine, client: this.client, properties: this.args, id: Math.floor(Math.random() * 1e10), events: this.events});
    }
  }, elation.ui.base3d);
  elation.component.add('engine.things.ui_button', function() {
    this.postinit = function() {
      elation.engine.things.ui_panel.extendclass.postinit.call(this);
      this.defineProperties({
        label: { type: 'string', default: '' },
        fontSize: { type: 'integer', default: 512 },
        font: { type: 'string', default: 'Open Sans Regular' },
      });
      elation.events.add(this, 'mouseover,mouseout,mousedown,mouseup,click', this);
    }
    this.createObject3D = function() {
      var box = new THREE.BoxGeometry(1,0.5,0.1);
      box.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,.05));
      var mat = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true});
      var bbox = new THREE.Mesh(box, mat);

      var labelgen = this.getAssetWrapper();
      var label = labelgen.getLabel(this.label);

      var buttongeo = new THREE.BoxGeometry(0.8,.4,.1);
      var buttonmat = new THREE.MeshPhongMaterial({color: 0x999999, map: label});
      var sidemat = new THREE.MeshPhongMaterial({color: 0x999999});
      var button = new THREE.Mesh(buttongeo, new THREE.MeshFaceMaterial([sidemat, sidemat, sidemat, sidemat, buttonmat, sidemat]));

      this.geometry = buttongeo;
      this.material = buttonmat;

      var obj = new THREE.Object3D(); 
      bbox.visible = false;
      obj.add(bbox);
      obj.add(button);

      return obj;
    }
    this.createChildren = function() {
    }
    this.createForces = function() {
      this.geometry.computeBoundingBox();
      this.setCollider('box', this.geometry.boundingBox);
    }

    this.mouseover = function() {
      this.material.color.setHex(0xccffcc);
    }
    this.mouseout = function() {
      this.material.color.setHex(0x999999)
    }
    this.mousedown = function() {
alert('e');
      this.scale.z = 0.5;
    }
    this.mouseup = function() {
      this.scale.z = 1.0;
    }
    this.getAssetWrapper = function() {
      var color = (this.properties.color instanceof THREE.Color ? this.properties.color : new THREE.Color(this.properties.color));
      if (!this.labelgen) {
        var genname = ['label2d', this.font, this.fontSize, color.getHexString()].join('_');
        var asset = elation.engine.assets.find('labelgen', genname);
        if (!asset) {
          asset = elation.engine.assets.get({
            assettype: 'labelgen',
            assetname: genname,
            color: '#' + color.getHexString(),
            font: this.font,
            fontSize: this.fontSize,
            outlineSize: 0
          });
        }
        this.labelgen = asset;
      }
      return this.labelgen;
    }
  }, elation.engine.things.generic);

  elation.define('ui.style3d', {
    margin: function() { },
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    marginFront: 0,
    marginBack: 0,

    padding: function() { },
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingFront: 0,
    paddingBack: 0,

    width: 'auto',
    height: 'auto',
    depth: 'auto',

    border: function() { },
    borderWidth: 0,
    borderColor: 0xffffff,
    borderStyle: 'solid',
    borderRadius: 0,

    background: function() { },
    backgroundColor: 'trans',
    backgroundImage: null,
  });
});
