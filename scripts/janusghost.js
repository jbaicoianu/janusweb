elation.require(['janusweb.janusbase', 'engine.things.leapmotion'], function() {
  elation.component.add('engine.things.janusghost', function() {
    this.postinit = function() {
      elation.engine.things.janusghost.extendclass.postinit.call(this);
      this.defineProperties({
        ghost_id: { type: 'string' },
        ghost_src: { type: 'string' },
        head_id: { type: 'string' },
        head_pos: { type: 'vector3', default: [0,1,0] },
        body_id: { type: 'string' },
        lighting: { type: 'boolean', default: true, set: this.updateMaterial },
        ghost_scale: { type: 'vector3', default: [1,1,1] },
        ghostassets: { type: 'object' },
        auto_play: { type: 'boolean', default: true },
      });

      this.frames = false;
    }
    this.createObject3D = function() {
      if (this.ghost_src) {
        var url = this.ghost_src;
        if (elation.engine.assets.corsproxy && !this.isURLLocal(url) && url.indexOf(elation.engine.assets.corsproxy) == -1) {
          url = elation.engine.assets.corsproxy + url;
        }
        elation.net.get(url, null, {
          callback: elation.bind(this, this.setGhostData)
        });
      }
      return new THREE.Object3D();
    }
    this.isURLLocal = function(src) {
      if (src.match(/^(https?:)?\/\//i)) {
        return (src.indexOf(self.location.origin) == 0);
      }
      return (
        (src[0] == '/' && src[1] != '/') ||
        (src[0] != '/')
      );
    }
    this.createChildren = function() {
      this.head = this.spawn('generic', null, { position: new THREE.Vector3() });
      this.setHead(this.head_id, this.properties.head_pos);
      this.setBody(this.body_id);
      var name = this.properties.ghost_id;
      this.label = this.head.spawn('label', name + '_label', {
        size: .1,
        align: 'center',
        collidable: false,
        text: name,
        position: [0,1.5,0],
        orientation: [0,1,0,0],
        pickable: false,
        collidable: false
      });
    }
    this.setGhostAssets = function(assets) {
      this.ghostassets = assets;
    }
    this.getGhostObjects = function() {
      var objects = {};
      if (this.ghostassets && this.ghostassets['object']) {
        this.ghostassets['object'].forEach(function(n) {
          objects[n.id] = n;
        });
      }
      return objects;
    }
    this.setGhostData = function(data) {
      var lines = data.split('\n');
      var frames = [];
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line || line.length == 0) {
          continue;
        } else if (line[0] == '{') {
          // TODO - I think this format is the same as what gets send over the network
          var packet = JSON.parse(line);
          frames.push(packet.data);
        } else {
          var parts = line.split(' ');
          if (parts[0] == 'CHAT') {
            // TODO - handle chat
          } else if (parts.length == 13 || parts.length == 16) {
            var frame = {
              time_sec: parseFloat(parts[0]),
              pos: [parts[1], parts[2], parts[3]].map(parseFloat),
              dir: [parts[4], parts[5], parts[6]].map(parseFloat),
              view_dir: [parts[7], parts[8], parts[9]].map(parseFloat),
              up_dir: [parts[10], parts[11], parts[12]].map(parseFloat)
            };
            if (parts.length >= 16) {
              frame.head_pos = [parts[13], parts[14], parts[15]].map(parseFloat);
            }
            frames.push(frame);
          }
        }
        
      }
      this.frames = frames;
      if (frames.length > 0 && this.auto_play) {
        this.start();
      }
    }
    this.setHead = function(headid, headpos) {
      var objects = this.getGhostObjects();
      if (headid && this.head) {
        var assetid = headid;
        if (objects && objects[headid]) {
          assetid = this.id + '_head_model';
          var asset = elation.engine.assets.get({
            assettype: 'model',
            name: assetid,
            src: objects[headid].src,
            mtl: objects[headid].mtl 
          });
        }
        if (headpos) {
          this.head.properties.position.copy(headpos);
        }

        this.face = this.head.spawn('janusobject', null, {
          janus: this.janus,
          room: this.room,
          janusid: assetid,
          position: headpos.clone().negate(),
          orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),
          lighting: this.lighting,
          cull_face: 'none'
        });
        //this.head.properties.position.copy(headpos);
      }
    }
    this.setBody = function(bodyid) {
      var objects = this.getGhostObjects();
      if (bodyid) {
        var assetid = bodyid;
        if (objects && objects[bodyid]) {
          assetid = this.player_name + '_body_model';
          if (objects[bodyid].src.match(/Beta\.fbx\.gz/)) {
            assetid = 'avatar_gltf';
          } else {
            var asset = elation.engine.assets.get({
              assettype: 'model',
              name: assetid,
              src: objects[bodyid].src,
              mtl: objects[bodyid].mtl,
            });
          }
        }
        this.body = this.spawn('janusobject', null, {
          janus: this.janus,
          room: this.room,
          janusid: assetid,
          orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)),
          lighting: this.lighting,
          cull_face: 'none'
        });
      }
    }
    this.start = function() {
      this.framenum = -1;
      if (this.frames.length > 0) {
        this.showNextFrame();
      }
    }
    this.stop = function() {
      if (this.frametimer) {
        clearTimeout(this.frametimer);
      }
    }
    this.showNextFrame = function() {
      this.framenum = (this.framenum + 1) % this.frames.length;
      this.applyCurrentFrame();
    }
    this.applyCurrentFrame = function() {
      var frame = this.frames[this.framenum],
          nextframe = this.frames[(this.framenum + 1) % this.frames.length];

      this.updateData(frame);
      this.frametimer = setTimeout(elation.bind(this, this.showNextFrame), 100);
    }
    this.updateData = (function() {
      // static scratch variables
      var xdir = new THREE.Vector3(),
            ydir = new THREE.Vector3(),
            zdir = new THREE.Vector3(),
            matrix = new THREE.Matrix4();
      return function(movedata) {
        var parser = this.janus.parser;
        if (movedata.dir && this.body) {
          this.body.properties.zdir.fromArray(parser.getVectorValue(movedata.dir)).normalize();
          this.body.properties.ydir.set(0,1,0);
          this.body.properties.xdir.crossVectors(this.body.properties.ydir, this.body.properties.zdir);
          this.body.properties.zdir.crossVectors(this.body.properties.xdir, this.body.properties.ydir);
          this.body.updateVectors(true);
        }

        if (movedata.view_dir && movedata.up_dir) {
          if (this.head) {
            ydir.fromArray(parser.getVectorValue(movedata.up_dir, [0,1,0])),
            zdir.fromArray(parser.getVectorValue(movedata.view_dir, [0,0,1])),
            xdir.crossVectors(zdir, ydir);

            xdir.crossVectors(zdir, ydir).normalize();
            zdir.crossVectors(xdir, ydir);

            matrix.makeBasis(xdir, ydir, zdir);
            this.head.properties.orientation.setFromRotationMatrix(matrix);
            if (movedata.head_pos && this.face) {
              var headpos = this.face.properties.position;
              var newpos = parser.getVectorValue(movedata.head_pos);
/*
              headpos.copy(this.properties.head_pos).negate();
              headpos.x += newpos[0];
              headpos.y += newpos[1];
              headpos.z += newpos[2];
*/
              headpos.fromArray(newpos);
            }
          }
        }
        if (movedata.avatar) {
          this.setAvatar(movedata.avatar.replace(/\^/g, '"'));
        }
        if (movedata.hand0 || movedata.hand1) {
          this.updateHands(movedata.hand0, movedata.hand1);
        }
  /*

        if (movedata.speaking && movedata.audio) {
          this.speak(movedata.audio);
        }

  */
        if (movedata.room_edit || movedata.room_delete) {
          var edit = movedata.room_edit,
              del = movedata.room_delete;

          this.handleRoomEdit(edit, del);
        }

        //this.set('position', movepos, true);
        if (movedata.pos) {
          this.properties.position.fromArray(parser.getVectorValue(movedata.pos));
        }
        this.objects.dynamics.updateState();
        this.refresh();
      }
    })();
    this.setAvatar = function(avatar) {
      if (!this.avatarcode || this.avatarcode != avatar) {
        this.avatarcode = avatar;
        var things = this.janus.parser.parse(avatar);
        if (this.avatar_body) {
          this.remove(this.avatar_body);
        }
        var ghostdef = things.ghosts[0];
        var headpos = new THREE.Vector3();
        if (ghostdef.head_pos) {
          headpos.fromArray(ghostdef.head_pos.split(' '));
          this.head_pos = headpos;
        }
        this.setGhostAssets(things.assets);
        this.setHead(ghostdef.head_id, headpos);
        this.setBody(ghostdef.body_id);
      }

    }
    this.updateHands = function(hand0, hand1) {
      if (!this.hands) {
        this.hands = {
          left: this.shoulders.spawn('leapmotion_hand', this.properties.player_name + '_hand_left'),
          right: this.shoulders.spawn('leapmotion_hand', this.properties.player_name + '_hand_right'),
        };
      }

      var inverse = new THREE.Matrix4();
      inverse.getInverse(this.objects['3d'].matrixWorld);
      if (hand0 && hand0.state) {
        this.hands.left.show();
        this.hands.left.setState(hand0.state, inverse);
      } else {
        this.hands.left.hide();
      }
      if (hand1 && hand1.state) {
        this.hands.right.show();
        this.hands.right.setState(hand1.state, inverse);
      } else {
        this.hands.right.hide();
      }
    }
    this.handleRoomEdit = function(edit, del) {
      //var room = this.janus.rooms[roomId];
      var room = this.room;
      if (room) {
        if (edit) {
          var editxml = edit.replace(/\^/g, '"');
          room.applyEditXML(editxml);
        }
        if (del) {
          var deletexml = del.replace(/\^/g, '"');
          room.applyDeleteXML(deletexml);
        }
      } 
    }
  }, elation.engine.things.janusbase);
});
