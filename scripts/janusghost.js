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
        var isLocal = this.isURLLocal(url);
        if (isLocal) {
          url = this.room.baseurl + url;
        }
        if (elation.engine.assets.corsproxy && isLocal && url.indexOf(elation.engine.assets.corsproxy) == -1) {
          url = elation.engine.assets.corsproxy + url;
        }
        elation.net.get(url, null, {
          callback: elation.bind(this, this.setGhostData)
        });
      } else if (this.ghost_id) {
        var ghostdef = this.room.ghosts[this.ghost_id];
        //this.room.getAsset('ghost', this.ghost_id);
        var ghostasset = this.room.getAsset('ghost', this.ghost_id);
        if (ghostasset) {
          if (ghostasset.loaded) {
            this.setGhostData(ghostasset.getInstance());
          } else {
            ghostasset.load();
            elation.events.add(ghostasset, 'asset_load', elation.bind(this, function(ev) {
              this.setGhostData(ghostasset.getInstance());
            }));
          }
        }
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
      elation.engine.things.janusghost.extendclass.createChildren.call(this);

      this.head = this.spawn('janusbase', null, { position: new THREE.Vector3(), parent: this });
      this.shoulders = this.spawn('janusbase', this.properties.player_id + '_shoulders', {
        'position': [0,1.0,0],
        'parent': this
      });
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
      this.assetpack = elation.engine.assets.loadJSON(assets.assetlist);
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
    this.setHead = function(headid, headpos, scale) {
      if (this.face) {
        this.face.die();
        this.face = false;
      }
      if (headid && this.head) {
        if (!this.face || this.face.janusid != headid) {
          if (headpos) {
            this.head.properties.position.copy(headpos);
          }

          this.face = this.head.spawn('janusobject', null, {
            janus: this.janus,
            room: this.room,
            parent: this,
            janusid: headid,
            position: headpos.clone().negate(),
            orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),
            lighting: this.lighting,
            cull_face: 'none'
          });
        }
        //this.head.properties.position.copy(headpos);
        if (scale) {
          this.face.scale.fromArray(scale);
          this.label.scale.fromArray(scale);
          this.label.properties.position.multiply(this.label.scale);
        }
      }
    }
    this.setBody = function(bodyid, scale) {
      if (this.body) {
        this.body.die();
        this.body = false;
      }
      if (bodyid) {
        this.body = this.spawn('janusobject', null, {
          janus: this.janus,
          room: this.room,
          parent: this,
          janusid: bodyid,
          orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)),
          lighting: this.lighting,
          cull_face: 'none'
        });
        if (scale && this.body) this.body.scale.fromArray(scale);
      }
    }
    this.setAnimation = function(anim_id) {
      if (anim_id != this.anim_id) {
        if (!this.body || !this.body.animationmixer) return;
        if (this.activeanimation) {
          this.activeanimation.fadeOut(this.anim_transition_time);
          var oldanim = this.activeanimation;
          setTimeout(elation.bind(this, function() {
            if (this.activeanimation !== oldanim)
              oldanim.stop();
          }), this.anim_transition_time * 1000);
        }
        if (this.body.animationactions && this.body.animationactions[anim_id]) {
          var action = this.body.animationactions[anim_id];
          //console.log('found action!', anim_id, action);
          action.fadeIn(this.anim_transition_time);
          action.play();
          this.activeanimation = action;
        } else {
          console.log('need to load action', anim_id, this.ghostassets, this.skeleton);
          //this.loadAsset()
          var objects = this.getGhostObjects();
          var assetid = anim_id;

          if (objects && objects[anim_id]) {
            assetid = this.player_name + '_anim_' + anim_id;
            var asset = elation.engine.assets.find('model', assetid, true);
            if (!asset) {
              asset = elation.engine.assets.get({
                assettype: 'model',
                name: assetid,
                src: objects[anim_id].src,
                mtl: objects[anim_id].mtl,
              });
            }

            if (asset.loaded) {
              var animations = asset.extractAnimations();
              if (animations.length > 0) {
                var action = this.body.animationmixer.clipAction(animations[0]);
                this.body.animationactions[anim_id] = action;
                action.play();
              }
            } else {
              asset.getInstance();
              elation.events.add(asset, 'asset_load', elation.bind(this, function() {
                var animations = asset.extractAnimations();
                if (animations.length > 0) {
                  var action = this.body.animationmixer.clipAction(animations[0]);
                  this.body.animationactions[anim_id] = action;
                  if (anim_id == this.anim_id) {
                    action.play();
                    this.activeanimation = action;
                  }
                }
              }));
            }
          }
        }
        this.anim_id = anim_id;
      }
    }
    this.rebindAnimations = function() {
      this.body.rebindAnimations();
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
          this.body.properties.xdir.crossVectors(this.body.properties.ydir, this.body.properties.zdir).normalize();
          this.body.properties.zdir.crossVectors(this.body.properties.xdir, this.body.properties.ydir).normalize();
          this.body.updateVectors(true);
        }

        if (movedata.avatar) {
          this.setAvatar(movedata.avatar.replace(/\^/g, '"'));
        }
        if (movedata.view_dir && movedata.up_dir) {
          if (this.head) {
            ydir.fromArray(parser.getVectorValue(movedata.up_dir, [0,1,0]));
            zdir.fromArray(parser.getVectorValue(movedata.view_dir, [0,0,1]));
            xdir.crossVectors(zdir, ydir);

            xdir.crossVectors(zdir, ydir).normalize();
            zdir.crossVectors(xdir, ydir).normalize();

            matrix.makeBasis(xdir, ydir, zdir);
            this.head.properties.orientation.setFromRotationMatrix(matrix);
            if (movedata.head_pos && this.face) {
              var headpos = this.head.properties.position;
              var facepos = this.face.properties.position;
              var newpos = parser.getVectorValue(movedata.head_pos);
              headpos.copy(this.head_pos);
              facepos.fromArray(newpos).sub(this.head_pos);
              if (this.body) {
                headpos.multiply(this.body.scale);
                facepos.multiply(this.body.scale);
              }
            }
          }
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
          var pos = parser.getVectorValue(movedata.pos);
        }
        if (movedata.vel) {
          this.properties.velocity.fromArray(parser.getVectorValue(movedata.vel));
          this.properties.position.fromArray(pos);
        } else {
          if (this.interpolateLastPos) {
            var rate = this.janus.network.getUpdateRate(this.room);
            var lastpos = this.interpolateLastPos;
            this.properties.position.fromArray(this.interpolateLastPos);
            this.properties.velocity.set(pos[0] - lastpos[0], pos[1] - lastpos[1], pos[2] - lastpos[2]).multiplyScalar(1000 / rate);

            if (this.interpolateTimer) clearTimeout(this.interpolateTimer);
            this.interpolateTimer = setTimeout(elation.bind(this, function() {
              this.properties.velocity.set(0,0,0);
            }), rate);
          } else {
            this.properties.position.fromArray(pos);
          }
          this.interpolateLastPos = pos;
        }
        if (movedata.rotvel) {
          this.properties.angular.fromArray(parser.getVectorValue(movedata.rotvel));
        } else {
          // TODO - interpolate rotations
        }
        if (movedata.anim_id) {
          this.setAnimation(movedata.anim_id);
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
        var ghostdef = things.ghost[0];
        var headpos = new THREE.Vector3();
        if (ghostdef.head_pos) {
          headpos.fromArray(ghostdef.head_pos.split(' '));
          this.head_pos = headpos;
        }
        this.setGhostAssets(things.assets);
        this.setHead(ghostdef.head_id, headpos, ghostdef.scale);
        this.setBody(ghostdef.body_id, ghostdef.scale);
        if (ghostdef._children) {
          for (var type in ghostdef._children) {
            for (var i = 0; i < ghostdef._children[type].length; i++) {
              this.createObject(type, ghostdef._children[type][i]);
            }
          }
        }
      }
    }
    this.updateHands = function(hand0, hand1) {
      if (!this.shoulders) {
        this.shoulders = this.spawn('janusbase', this.properties.player_id + '_shoulders', {
          'position': [0,1.0,0],
          'parent': this
        });
      }
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
    this.updateTransparency = function() {
      var player = this.engine.client.player;

      var dist = player.distanceTo(this);
      var opacity = Math.min(1, dist / 0.25);

      // FIXME - we should cache materials rather than fetching them every frame
      var materials = [];
      this.objects['3d'].traverse(function(n) {
        if (n.material) {
          materials = materials.concat(elation.utils.isArray(n.material) ? n.material : [n.material]);
        }
      });
      materials.forEach(function(m) { 
        m.opacity = opacity;
        m.transparent = (opacity < 1);
        m.visible = (opacity > 0);
      });
    }
    this.setRoom = function(room) {
      if (room !== this.room) {
        if (this.room) {
          this.room.remove(this);
        }
        this.room = room;
        if (room && this.parent != this.room) {
          room.add(this);
        }
      }
    }
  }, elation.engine.things.janusbase);
});
