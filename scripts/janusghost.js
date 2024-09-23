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
        animation_extras: { type: 'string' },
        bone_head: { type: 'string' },
        morphtarget_mouth: { type: 'string' },
        morphtarget_eyes: { type: 'string' },
      });

      this.frames = false;

      if (!('project_vertex_discard_close' in THREE.ShaderChunk)) {
        THREE.ShaderChunk['color_fragment_discard_close'] = `
          #if defined( USE_COLOR_ALPHA )
            diffuseColor *= vColor;
          #elif defined( USE_COLOR )
            diffuseColor.rgb *= vColor;
          #endif
          float dist = length(vViewPosition);
          float mindist = .2;
          float maxdist = .4;
          if (dist < maxdist) {
            diffuseColor.a = clamp(((dist - mindist) / (maxdist - mindist)), 0., 1.);
          }
          if (diffuseColor.a <= 1e-4) {
            discard;
          }
        `;
      }
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
        this.assetpack.loadJSON(assets.assetlist, true);
      }

      let animnames = []; //'idle', 'walk', 'walk_left', 'walk_right', 'walk_back', 'run', 'jump', 'fly', 'speak', 'type', 'portal'];
      let animassets = assets.assetlist.filter(asset => animnames.indexOf(asset.name) != -1);

      if (!this.animationmixer) {
        // Set up our animation mixer with a simple bone mapper for our head.  We'll add more animations to this ass other assets load
        // TODO - this is probably also where we'd map any other tracked objects (hands, hips, etc). and set up IK

/*
        let headtrack = new THREE.QuaternionKeyframeTrack('Neck.quaternion', [0], [0, 0, 0, 1]),
            headclip = new THREE.AnimationClip('head_rotation', -1, [headtrack]);
        this.headtrack = headtrack;

        this.initAnimations([ headclip ]);
        //this.animations['head_rotation'].play();
*/
        this.initAnimations([]);
      }

      animassets.forEach(anim => {
        let asset = this.getAsset('model', anim.name);
        console.log('try to load the animation', asset, anim);
        if (asset) {
          if (!asset.loaded) {
            let model = asset.getInstance();
            elation.events.add(asset, 'asset_load', ev => {
              let clip = false;
              model.traverse(n => { if (n.animations && n.animations.length > 0) clip = n.animations[0]; });
              if (clip) {
                if (this.animationmixer && !this.animations[anim.name]) {
                  let action = this.animationmixer.clipAction(clip);
                  this.animations[anim.name] = action;
                }
              }
            });
          }
        }
      });
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
              opacity: 0.9999,
              renderorder: this.renderorder || 100,
              shader_chunk_replace: (this.lighting ? {
                'color_fragment': 'color_fragment_discard_close',
              } : {}),
            });
            this.face.start();
          } else {
            this.face = headid;
            this.face.lighting = this.lighting;
            this.face.opacity = 0.9999;
            this.face.renderorder = this.renderorder || 100;
            this.face.shader_chunk_replace = (this.lighting ? {
              'color_fragment': 'color_fragment_discard_close',
            } : {});
            this.head.appendChild(headid);
            this.face.start();
          }
          if (scale) {
            this.face.scale.fromArray(scale);
            if (this.label) {
              this.label.scale.fromArray(scale);
              this.label.pos.multiply(this.label.scale);
            }
          }
          this.head.pos = headpos.clone().multiply(this.face.scale);
          this.face.applyPosition(headpos.negate());

          if (this.remotevideo) {
            this.updateVideoScreen();
            this.face.addEventListener('load', (ev) => {
              console.log('the asset for my face loaded', ev, this);
              this.updateVideoScreen();
            });
          }
        }
        //this.head.properties.position.copy(headpos);

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
            rotation: V(0, 180, 0),
            lighting: this.lighting,
            //cull_face: 'none'
            opacity: 0.9999,
            renderorder: this.renderorder || 100,
            shader_chunk_replace: (this.lighting ? {
              'color_fragment': 'color_fragment_discard_close',
            } : {}),
          });
        } else {
          this.body = bodyid;
          this.appendChild(bodyid);
        }
        if (pos) this.body.pos = pos;
        this.body.start();
        if (scale && this.body) this.body.scale.fromArray(scale);

        elation.events.add(this, 'load', ev => {
          if (this.body.modelasset) {
            if (this.body.modelasset.loaded) {
              this.loadAnimations();
              if (this.animation_extras) {
                this.loadAnimationExtras();
              }
            } else {
              elation.events.add(this.body.modelasset, 'asset_load_complete', () => {
                this.loadAnimations();
                if (this.animation_extras) {
                  this.loadAnimationExtras();
                }
              });
            }
          }
          // FIXME - this prevents avatars from being culled, which prevents our default mesh from disappearing but also means we lose out on possible performance optimizations in rooms with lots of avatars
          this.objects['3d'].traverse(n => {
            if (n instanceof THREE.Mesh) {
              n.frustumCulled = false;
            }
          });
        });
      }
    }
    this.loadAnimations = function(assetid) {
      if (!assetid) assetid = 'avatar_animations';
      let animasset = this.getAsset('model', assetid);
      if (!animasset.loaded) {
        let animationsLoaded = false;
        elation.events.add(animasset, 'asset_load_complete', ev => {
          if (!animationsLoaded) {
            animationsLoaded = true;
            if (this.body.animationmixer) {
              this.cloneAnimations(animasset);
            }
            this.body.setAnimation('idle');
          }
        });
        animasset.load();
      } else {
        if (this.body.animationmixer) {
          this.cloneAnimations(animasset);
        }
        //this.body.setAnimation('idle');
      }
    }
    this.cloneAnimations = function(animasset) {
      let animations = animasset.animations;
      //console.log('clone all the animations', animations, animasset._model);
      if (this.body) {
        if (this.bone_head) {
          this.initHeadAnimation(animasset);
        }

        animations.forEach(clip => {
          this.body.animations[clip.name] = this.body.animationmixer.clipAction(this.retargetAnimation(clip, animasset._model));
          //console.log('new clip', clip.name, clip, this.body.animations[clip.name]);
        });
        //console.log('head rot', this.body.animations['head_rotation'], headclip, headaction);
        //console.log(this.body.modelasset, this.body.modelasset.vrm);
        if (this.body.modelasset && this.body.modelasset.vrm) {
          let rename = {};
          let bonemap = this.body.modelasset.vrm.humanoid.humanBones;
          for (let k in bonemap) {
            console.log(k, bonemap[k]);
            if (bonemap[k].length > 0) {
              rename[bonemap[k][0].node.name] = k;
            }
          }
          let bones = [];
          let meshes = [];
          this.body.objects['3d'].traverse(n => { if (n instanceof THREE.Bone) bones.push(n); else if (n instanceof THREE.SkinnedMesh) meshes.push(n); });
          /*
          console.log('rename the bones!', rename);
          THREE.SkeletonUtils.renameBones(bones, rename);
          console.log('bones now', bones);
          */
          
        }
      }
    }
    this.retargetAnimation = function(clip, sourcecontainer) {
      let newclip = clip.clone();
      let sourcemesh = null,
          destmesh = null;
      if (sourcecontainer) {
        sourcecontainer.traverse(n => { /*console.log(' - ', n); */ if (n instanceof THREE.SkinnedMesh && n.skeleton) sourcemesh = n; });
      }
      this.objects['3d'].traverse(n => { if (n instanceof THREE.SkinnedMesh && n.skeleton) destmesh = n; });
      let remove = [];
      if (this.body && this.body.modelasset && this.body.modelasset.vrm) {
        let vrm = this.body.modelasset.vrm;
        //console.log('RETARGET ANI*MATION', clip, this.body.modelasset.vrm, sourcemesh, destmesh);
        newclip.tracks.forEach(track => {
          let parts = track.name.split('.');
          console.log(parts, track.name);
          try {
            let bone = vrm.humanoid.getBone(parts[0]);
            if (bone) {
              track.name = bone.node.name + '.' + parts[1];
              let sourcebone = sourcemesh.skeleton.getBone(bone.node.name);
              //console.log(track, bone);
            } else {
              //console.log('no bone!', parts, track);
            }
          } catch (e) {
            console.log('omgwtf', e.message);
            remove.push(track);
          }
        });
        remove.forEach(track => {
          let idx = newclip.tracks.indexOf(track);
          if (idx != -1) {
            newclip.tracks.splice(idx, 1);
            //console.log('removed track', track);
          }
        });
      } else if (destmesh && sourcemesh) {
        // FIXME - silly hack to store skeleton, we should just be extracting it at load time
        this.body.skeleton = destmesh.skeleton;
        this.body.objects['3d'].skeleton = destmesh.skeleton;
        //newclip = THREE.SkeletonUtils.retargetClip(destmesh, sourcemesh, newclip, {useFirstFramePosition: true});
        //console.log('retarget it!', newclip, destmesh, sourcemesh);
        newclip.tracks.forEach(track => {
          let [name, property] = track.name.split('.');
          let srcbone = sourcemesh.skeleton.getBoneByName(name);
          let dstbone = destmesh.skeleton.getBoneByName(name);
          if (dstbone) {
            let scale = srcbone.position.length() / dstbone.position.length();
            if (property == 'position') {
              for (let i = 0; i < track.values.length; i++) {
                track.values[i] /= scale;
              }
              //remove.push(track);
            } else if (property == 'quaternion') {
            }
          } else {
            //console.log('missing bone!', srcbone, track);
            remove.push(track);
          }
        });
      } else {
        let armature = sourcecontainer.getObjectByName('Armature') || sourcecontainer;
        newclip.tracks.forEach(track => {
          track.name = track.name.replace('mixamorig', '');
          let p = track.name.split('.');
          if (p[1] == 'position') {
            for (let i = 0; i < track.values.length / 3; i++) {
              track.values[i * 3] *= armature.scale.x;
              track.values[i * 3 + 1] *= armature.scale.y;
              track.values[i * 3 + 2] *= armature.scale.z;
            }
          }
          if (p[0] == 'Hips') {
            if (p[1] == 'position') {
              let v = new THREE.Vector3();
              for (let i = 0; i < track.values.length / 3; i++) {
                v.set(track.values[i * 3], track.values[i * 3 + 1], track.values[i * 3 + 2]).applyQuaternion(armature.quaternion);
                //console.log('position rotation', v, [track.values[i * 3], track.values[i * 3 + 1], track.values[i * 3 + 2]], track);
                track.values[i * 3] = v.x;
                track.values[i * 3 + 1] = v.y;
                track.values[i * 3 + 2] = v.z;
              }
            } else if (p[1] == 'quaternion') {
              //console.log('apply rotation', track);
              let q = new THREE.Quaternion();
              for (let i = 0; i < track.values.length / 4; i++) {
                q.set(track.values[i * 4], track.values[i * 4 + 1], track.values[i * 4 + 2], track.values[i * 4 + 3]).premultiply(armature.quaternion);
                track.values[i * 4] = q.x;
                track.values[i * 4 + 1] = q.y;
                track.values[i * 4 + 2] = q.z;
                track.values[i * 4 + 3] = q.w;
              }
            }
          }
        });
      }
      remove.forEach(track => {
        let idx = newclip.tracks.indexOf(track);
        if (idx != -1) {
          newclip.tracks.splice(idx, 1);
          //console.log('removed track', track);
        }
      });
      //console.log('finished clip', newclip);
      return newclip;
    }
    this.rebindAnimations = function() {
      this.body.rebindAnimations();
    }
    this.loadAnimationExtras = function() {
      let animids = this.animation_extras.split(' ');
      animids.forEach(animid => this.loadAnimations(animid));
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
            flip = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
            origin = new THREE.Vector3(),
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
            matrix.lookAt(origin, zdir, ydir);
            q1.setFromRotationMatrix(matrix);
            this.head.properties.orientation.copy(this.orientation).invert().multiply(q1).multiply(flip);
            if (this.body && this.headaction) {
              this.setHeadOrientation(this.head.orientation, true);
            }
            if (movedata.head_pos && this.face) {
              var headpos = this.head.properties.position;
              var facepos = this.face.properties.position;
              var newpos = parser.getVectorValue(movedata.head_pos);
              //headpos.copy(this.head_pos);
              //facepos.fromArray(newpos).sub(headpos);
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

        // FIXME - workaround for null values
        if (isNaN(this.position.x)) this.position.x = 0;
        if (isNaN(this.position.y)) this.position.y = 0;
        if (isNaN(this.position.z)) this.position.z = 0;
        if (isNaN(this.orientation.x) || isNaN(this.orientation.y) || isNaN(this.orientation.z) || isNaN(this.orientation.w)) this.orientation.set(0,0,0,1);

        if (this.head) {
          if (isNaN(this.head.position.x)) this.head.position.x = 0;
          if (isNaN(this.head.position.y)) this.head.position.y = 0;
          if (isNaN(this.head.position.z)) this.head.position.z = 0;
          if (isNaN(this.head.orientation.x) || isNaN(this.head.orientation.y) || isNaN(this.head.orientation.z) || isNaN(this.head.orientation.w)) this.head.orientation.set(0,0,0,1);
        }

        if (movedata.morphtargets) {
          if (this.body) {
            let morphtargets = movedata.morphtargets;
            for (let target in morphtargets) {
              this.body.setMorphTargetInfluence(target, morphtargets[target]);
            }
          }
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
        this.animation_extras = ghostdef.animation_extras;
        this.bone_head = ghostdef.bone_head;
        this.morphtarget_mouth = ghostdef.morphtarget_mouth;
        this.morphtarget_eyes = ghostdef.morphtarget_eyes;
        this.lighting = elation.utils.any(ghostdef.lighting, true);
        if (ghostdef.morphtarget_eyes) {
          this.blink();
        }
        if (ghostdef.head_id) {
          this.setHead(ghostdef.head_id, headpos, ghostdef.scale);
        } else if (this.head) {
          this.setHead(false);
        }
        if (ghostdef.body_id) {
          this.setBody(ghostdef.body_id, ghostdef.scale, ghostdef.pos);
        } else if (this.body) {
          this.setBody(false);
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
      inverse.copy(this.objects['3d'].matrixWorld).invert();
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
return;
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
    this.setAnimation = function(anim) {
      if (this.body) this.body.anim_id = anim;
    }
    this.initHeadAnimation = function(animasset) {
      let body = this.body || this._target.body,
          head = this.head || this._target.head;
      if (body && this.bone_head &&  !this.headaction) {
        if (!body.animationmixer) {
          body.initAnimations([]);
        }
        // Set up our animation mixer with a simple bone mapper for our head.  We'll add more animations to this as other assets load
        // TODO - this is probably also where we'd map any other tracked objects (hands, hips, etc). and set up IK

        let headtrack = new THREE.QuaternionKeyframeTrack(this.bone_head + '.quaternion', [0], [0, 0, 0, 1]),
            headclip = new THREE.AnimationClip('head_rotation', -1, [headtrack]);
        let headaction = body.animationmixer.clipAction(this.retargetAnimation(headclip, animasset._model));
        headaction.weight = 5;
        this.headaction = headaction;
        headaction.play();
      }
    }
    this.setHeadOrientation = function(orientation, invert) {
      let headaction = this.headaction || this._target.headaction;
      if (headaction && headaction._clip.tracks[0]) {
        let track = headaction._clip.tracks[0];
        if (track) {
          track.values[0] = orientation.x * (invert ? -1 : 1);
          track.values[1] = orientation.y * (invert ? 1 : -1);
          track.values[2] = orientation.z * (invert ? -1 : 1);
          track.values[3] = orientation.w; // * (invert ? -1 : 1);
        }
      }
    }
    this.blink = function() {
      if (!this.blinktimer) {
        if (this.body && this.morphtarget_eyes) {
          this.body.setMorphTargetInfluence(this.morphtarget_eyes, 1);
          setTimeout(() => {
            this.body.setMorphTargetInfluence(this.morphtarget_eyes, 0);
          }, 100);
        }
        this.blinktimer = setTimeout(() => {
          this.blinktimer = false;
          this.blink();
        }, 250 + Math.random() * 10000);
      }
    }
    this.setSpeakingVolume = function(volume) {
      if (this.body && this.morphtarget_mouth) {
        this.body.setMorphTargetInfluence(this.morphtarget_mouth, volume);
      }
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusghost.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          body: [ 'property', 'body'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusbase);
});
