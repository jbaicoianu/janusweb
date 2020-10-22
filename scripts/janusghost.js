elation.require(['janusweb.janusbase', 'engine.things.leapmotion'], function() {
  elation.component.add('engine.things.janusghost', function() {
    this.postinit = function() {
      elation.engine.things.janusghost.extendclass.postinit.call(this);
      this.defineProperties({
        ghost_id: { type: 'string' },
        ghost_src: { type: 'string' },
        avatar_src: { type: 'string' },
        head_id: { type: 'string' },
        head_pos: { type: 'vector3', default: [0,1,0] },
        body_id: { type: 'string' },
        userid_pos: { type: 'vector3', default: [0,2,0] },
        lighting: { type: 'boolean', default: true, set: this.updateMaterial },
        showlabel: { type: 'boolean', default: true },
        ghost_scale: { type: 'vector3', default: [1,1,1] },
        ghostassets: { type: 'object' },
        auto_play: { type: 'boolean', default: true },
        screen_name: { type: 'string' },
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

      this.createBodyParts();
      if (this.head_id) {
        this.setHead(this.head_id, this.properties.head_pos);
      }
      if (this.body_id) {
        this.setBody(this.body_id);
      }
      var name = this.properties.ghost_id;
      if (false && this.showlabel) {
        this.label = this.createObject('text', {
          size: .1,
          thickness: .03,
          align: 'center',
          collidable: false,
          text: name,
          pos: this.userid_pos,
          pickable: false,
          collidable: false,
          col: '#ffffff',
          emissive: '#cccccc',
          shadow_receive: false,
          lighting: false,
          billboard: 'y'
        });
      }

      if (this.avatar_src) {
        elation.net.get(this.avatar_src, null, {
          callback: elation.bind(this, function(data) {
            this.setAvatar(data);
            this.refresh();
          })
        });
      }
    }
    this.createBodyParts = function() {
      this.head = this.createObject('object', {
      });
      this.shoulders = this.createObject('object', {
        'js_id': this.properties.player_id + '_shoulders',
        'pos': V(0, 1.0, 0),
      });
    }
    this.setGhostAssets = function(assets) {
      if (!this.ghostassets) {
        this.ghostassets = assets;
        this.assetpack = elation.engine.assets.loadJSON(assets.assetlist);
      } else {
        console.log(this.ghostassets);
        this.assetpack.loadJSON(assets.assetlist);
      }
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
            //this.head.properties.position.copy(headpos);
          }

          if (elation.utils.isString(headid)) {
            this.face = this.head.createObject('object', {
              id: headid,
              //pos: headpos.clone().negate(),
              //orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),
              //rotation: V(0, 180, 0),
              lighting: this.lighting,
              //cull_face: 'none'
            });
            this.face.start();
          } else {
            this.face = headid;
            this.head.appendChild(headid);
            this.face.start();
          }
          if (this.remotevideo) {
            this.updateVideoScreen();
            this.face.addEventListener('load', (ev) => {
              console.log('the asset for my face loaded', ev, this);
              this.updateVideoScreen();
            });
          }
        }
        //this.head.properties.position.copy(headpos);
        if (scale) {
          this.face.scale.fromArray(scale);
          if (this.label) {
            this.label.scale.fromArray(scale);
            this.label.pos.multiply(this.label.scale);
          }
        }
      }
    }
    this.setBody = function(bodyid, scale, pos) {
      if (this.body) {
        this.body.die();
        this.body = false;
      }
      if (bodyid) {
        if (elation.utils.isString(bodyid)) {
          this.body = this.createObject('object', {
            id: bodyid,
            //orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)),
            //rotation: V(0, 180, 0),
            lighting: this.lighting,
            //cull_face: 'none'
          });
        } else {
          this.body = bodyid;
          this.appendChild(bodyid);
        }
        if (pos) this.body.pos = pos;
        this.body.start();
        if (scale && this.body) this.body.scale.fromArray(scale);
      }
    }
    this.rebindAnimations = function() {
      this.body.rebindAnimations();
    }

    this.start = function() {
      elation.engine.things.janusghost.extendclass.start.call(this);
      this.framenum = -1;
      if (this.frames.length > 0) {
        this.showNextFrame();
      }
    }
    this.stop = function() {
      elation.engine.things.janusghost.extendclass.stop.call(this);
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
            matrix = new THREE.Matrix4(),
            q1 = new THREE.Quaternion();
      return function(movedata) {
        var parser = this.janus.parser;
        if (movedata.dir) {
          this.properties.zdir.fromArray(parser.getVectorValue(movedata.dir)).normalize();
          this.properties.ydir.set(0,1,0);
          this.properties.xdir.crossVectors(this.properties.ydir, this.properties.zdir).normalize();
          this.properties.zdir.crossVectors(this.properties.xdir, this.properties.ydir).normalize();
          this.updateOrientationFromDirvecs();
        }

        if (movedata.avatar) {
          this.setAvatar(movedata.avatar.replace(/\^/g, '"'));
        }
        if (movedata.scale) {
          this.scale.fromArray(parser.getVectorValue(movedata.scale));
        }
        if (movedata.view_dir && movedata.up_dir) {
          if (this.head) {
            ydir.fromArray(parser.getVectorValue(movedata.up_dir, [0,1,0]));
            zdir.fromArray(parser.getVectorValue(movedata.view_dir, [0,0,1]));
            xdir.crossVectors(zdir, ydir);

            xdir.crossVectors(zdir, ydir).normalize();
            zdir.crossVectors(xdir, ydir).normalize();

            matrix.makeBasis(xdir, ydir, zdir);
            q1.setFromRotationMatrix(matrix);
            this.head.properties.orientation.copy(this.orientation).inverse().multiply(q1);
            if (movedata.head_pos && this.face) {
              var headpos = this.head.properties.position;
              var facepos = this.face.properties.position;
              var newpos = parser.getVectorValue(movedata.head_pos);
              headpos.copy(this.head_pos);
              facepos.fromArray(newpos).sub(headpos);
              if (this.body) {
                if (this.head.parent != this.body) {
                  this.body.appendChild(this.head);
                }
                //headpos.divide(this.body.scale);
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
        if (movedata.userid_pos) {
          this.userid_pos = movedata.userid_pos;
        }
        this.objects.dynamics.updateState();
        this.refresh();
      }
    })();
    this.setAvatar = function(avatar) {
      if (!this.head) {
        this.createBodyParts();
      }
      if (!this.avatarcode || this.avatarcode != avatar) {
        this.avatarcode = avatar;


        if (this.ghostchildren) {
          while (this.ghostchildren.length > 0) {
            let child = this.ghostchildren.pop();
            child.die();
          }
        }
        this.ghostchildren = [];

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
        if (ghostdef.screen_name) {
          this.screen_name = ghostdef.screen_name;
        }
        this.setGhostAssets(things.assets);
        if (ghostdef.head_id) {
          this.setHead(ghostdef.head_id, headpos, ghostdef.scale);
        }
        if (ghostdef.body_id) {
          this.setBody(ghostdef.body_id, ghostdef.scale, ghostdef.pos);
        }
        if (ghostdef._children) {
          for (var type in ghostdef._children) {
            for (var i = 0; i < ghostdef._children[type].length; i++) {
              let js_id = ghostdef._children[type][i].js_id;
              delete ghostdef._children[type][i].js_id;
              let childobj = this.createObject(type, ghostdef._children[type][i]);
              this.ghostchildren.push(childobj);
              if (js_id == 'head') {
                this.setHead(childobj, headpos, ghostdef.scale);
              } else if (js_id == 'body') {
                this.setBody(childobj, ghostdef.scale, ghostdef.pos);
              }
            }
          }
        }
      }
    }
    this.updateHands = function(hand0, hand1) {
      if (!this.shoulders) {
        this.shoulders = this.spawn('janusbase', this.properties.player_id + '_shoulders', {
          'position': [0,1.0,0],
          'parent': this,
          'janus': this.janus,
          'room': this.room
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
    this.setRemoteVideo = function(video) {
      if (video) {
        this.remotevideo = video;
        /*
        video.srcObject.addEventListener('addtrack', (ev) => console.log('added a track', ev, this));
        video.srcObject.addEventListener('active', (ev) => console.log('tracks activated', ev, this));
        video.srcObject.addEventListener('inactive', (ev) => console.log('tracks deactivated', ev, this));
        video.srcObject.addEventListener('removetrack', (ev) => console.log('removed a track', ev, this));
        */
        video.addEventListener('play', (ev) => this.updateVideoScreen());
        video.addEventListener('resize', (ev) => this.updateVideoScreen());
        this.setGhostAssets({
          assetlist: [{
            assettype: 'video',
            name: 'screen',
            video: video
          }]
        });
      }
      this.updateVideoScreen();
    }
    this.updateVideoScreen = function() {
      if (this.remotevideo && this.remotevideo.videoWidth > 0) {
        this.getChildren().forEach(n => {
          let screen = false;
          let c = n.getProxyObject();
          if (c.video_id == 'screen') {
            screen = c;
          } else if (this.screen_name && c.parts[this.screen_name]) {
            screen = c.parts[this.screen_name];
            console.log('found a screen part', screen);
            // FIXME - sometimes the screen part's parent is NULL, which causes the screen to disappear
          }
          if (screen) {
            screen.video_id = '';
            screen.updateMaterial();
            setTimeout(() => {
              screen.video_id = 'screen';
              screen.emissive_id = 'screen';
              screen.visible = true;
              screen.updateMaterial();
              if (screen.parent === null && screen !== c) {
                // FIXME - this is an attempt to fix the FIXME above, but it's hacky and I need to verify that it actually works
                console.log('Screen had no parent, adding it to ourselves', screen, c);
                c.appendChild(screen);
              }
            }, 50);
          }
        });
      }
    }
  }, elation.engine.things.janusbase);
});
