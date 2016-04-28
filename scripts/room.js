elation.require([
    'ui.textarea', 'ui.window', 
     'engine.things.generic', 'engine.things.sound', 'engine.things.label', 
    'janusweb.object', 'janusweb.portal', 'janusweb.image', 'janusweb.video', 'janusweb.text',
    'janusweb.translators.bookmarks', 'janusweb.translators.reddit', 'janusweb.translators.error'
  ], function() {
  elation.component.add('engine.things.janusroom', function() {
    this.postinit = function() {
      this.defineProperties({
        'janus': { type: 'object' },
        'url': { type: 'string', default: false },
        'skybox_left': { type: 'string', default: 'skyrender_left' },
        'skybox_right': { type: 'string', default: 'skyrender_right' },
        'skybox_up': { type: 'string', default: 'skyrender_up' },
        'skybox_down': { type: 'string', default: 'skyrender_down' },
        'skybox_front': { type: 'string', default: 'skyrender_front' },
        'skybox_back': { type: 'string', default: 'skyrender_back' },
        'fog': { type: 'boolean', default: false },
        'fog_mode': { type: 'string', default: 'exp' },
        'fog_density': { type: 'float', default: 1.0 },
        'fog_start': { type: 'float', default: 0.0 },
        'fog_end': { type: 'float', default: 100.0 },
        'fog_col': { type: 'color', default: 0x000000 },
        'walk_speed': { type: 'float', default: 1.8 },
        'run_speed': { type: 'float', default: 5.4 },
      });
      this.translators = {
        '^bookmarks$': elation.janusweb.translators.bookmarks({}),
        '^https?:\/\/(www\.)?reddit.com': elation.janusweb.translators.reddit({}),
        '^error$': elation.janusweb.translators.error({})
      };
      this.playerstartposition = [0,0,0];
      this.playerstartorientation = new THREE.Quaternion();
      this.load();
      this.roomsrc = '';
      //this.showDebug();
    }
    this.createChildren = function() {
      this.spawn('light_ambient', this.id + '_ambient', {
        color: 0x333333
      });
      this.spawn('light_directional', this.id + '_sun', {
        position: [-20,50,25],
        intensity: 0.2
      });
      this.spawn('light_point', this.id + '_point', {
        position: [22,19,-15],
        intensity: 0.2
      });
    }
    this.setActive = function() {
      this.setSkybox();
      this.setFog();
      this.setNearFar();
      this.setPlayerPosition();
      this.active = true;
      elation.events.fire({type: 'room_active', data: this});
    }
    this.setPlayerPosition = function(pos, orientation) {
      if (!pos) {
        pos = this.playerstartposition;
        orientation = this.playerstartorientation;
      }
        
      var player = this.engine.client.player;
      if (pos && orientation) {
        player.properties.position.set(pos[0], pos[1], pos[2]);
        player.properties.orientation.copy(orientation);
        // HACK - we actually want the angle opposite to this
        this.engine.client.player.properties.orientation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)));
      }
      player.properties.movespeed = this.properties.walk_speed * 100;
      player.properties.runspeed = this.properties.run_speed * 100;
    }
    this.setSkybox = function() {
      if (this.skyboxtexture) {
        this.engine.systems.world.setSky(this.skyboxtexture);
        return;
      }
      var textures = [
        elation.engine.assets.find('image', this.properties.skybox_right),
        elation.engine.assets.find('image', this.properties.skybox_left),
        elation.engine.assets.find('image', this.properties.skybox_up),
        elation.engine.assets.find('image', this.properties.skybox_down),
        elation.engine.assets.find('image', this.properties.skybox_front),
        elation.engine.assets.find('image', this.properties.skybox_back)
      ];
      var loaded = 0, errored = 0;
      textures.forEach(elation.bind(this, function(n) { 
        if (n) {
          elation.events.add(n, 'asset_load,asset_error', elation.bind(this, function(ev) {
            if (ev.type == 'asset_load') loaded++;
            else errored++;
            if (loaded + errored == 6) {
              this.processSkybox(textures);
            }
          }));
        }
      }));
      return false;
    }
    this.processSkybox = function(textures) {
      if (textures[0] && textures[1] && textures[2] && textures[3] && textures[4] && textures[5]) {
        var images = [];
        textures.forEach(function(t) { images.push(t.image); });
      
        // Handle skyboxes with missing textures.  We need to figure out 
        // the skybox texture size, then create a blank canvas of that size
        // Images of size 16x16 are (probably!) placeholders
        var width = undefined, height = undefined;
        images.forEach(function(img) { 
          if (img.width != 16 && img.height != 16) {
            width = img.width;
            height = img.height;
          }
        });
        if (width && height) {
          for (var i = 0; i < images.length; i++) {
            if (images[i] instanceof HTMLCanvasElement && images[i].width != width && images[i].height != height) {
              images[i].width = width;
              images[i].height = height;
            }
          }
        }
        if (images[0] && images[1] && images[2] && images[3] && images[4] && images[5]) {
          var texture = new THREE.CubeTexture( images );
          texture.needsUpdate = true;
          this.skyboxtexture = texture;
          this.engine.systems.world.setSky(texture);
          return true;
        }
      }
    }
    this.setFog = function() {
      if (this.properties.fog) {
        var fogcol = this.properties.fog_col || 0;
        var fogcolor = new THREE.Color();
        if (fogcol[0] == '#') {
          fogcolor.setHex(parseInt(fogcol.substr(1), 16));
        } else if (elation.utils.isString(fogcol) && fogcol.indexOf(' ') != -1) {
          var rgb = fogcol.split(' ');
          fogcolor.setRGB(rgb[0], rgb[1], rgb[2]);
        } else {
          fogcolor.setHex(fogcol);
        }
        if (this.properties.fog_mode == 'exp' || this.properties.fog_mode == 'exp2') {
          this.engine.systems.world.setFogExp(parseFloat(this.properties.fog_density), fogcolor);
        } else {
          this.engine.systems.world.setFog(this.properties.fog_start, this.properties.fog_end, fogcolor);
        }
      } else {
        this.engine.systems.world.disableFog();
      }
    }
    this.setNearFar = function() {
      this.engine.client.player.camera.camera.near = this.properties.near_dist;
      this.engine.client.player.camera.camera.far = this.properties.far_dist;
    }
    this.showDebug = function() {
      var content = elation.ui.panel_vertical({classname: 'janusweb_room_debug'});
      if (!this.debugwindow) {
        this.debugwindow = elation.ui.window({title: 'Janus Room', content: content, append: document.body, center: true});
      }

      //elation.ui.content({append: content, content: this.properties.url, classname: 'janusweb_room_url'});
      elation.ui.textarea({append: content, value: this.roomsrc, classname: 'janusweb_room_source'});
      this.debugwindow.settitle(this.properties.url);
      this.debugwindow.setcontent(content);
    }
    this.load = function(url, baseurloverride) {
      if (!url) {
        url = this.properties.url;
      } else {
        this.properties.url = url;
      }
      var baseurl = baseurloverride;
      if (!baseurl) {
        baseurl = url.split('/'); 
        if (baseurl.length > 3) baseurl.pop(); 
        baseurl = baseurl.join('/') + '/'; 
      }
      this.baseurl = baseurl;

      this.jsobjects = {};
      this.websurfaces = {};
      this.images = {};
      this.videos = {};

      this.setTitle('loading...');

      var proxyurl = this.properties.janus.properties.corsproxy;

      var fullurl = url;
      if (fullurl[0] == '/' && fullurl[1] != '/') fullurl = this.baseurl + fullurl;
      if (!fullurl.match(/^https?:/) && !fullurl.match(/^\/\//)) {
        fullurl = self.location.origin + fullurl;
      } else {
        fullurl = proxyurl + fullurl;
      }

      var translator = this.getTranslator(url);

      if (url == document.location.href) {
        setTimeout(elation.bind(this, function() {
          this.roomsrc = this.parseSource(document.documentElement.outerHTML);
          var roomdata = this.parseFireBox(this.roomsrc.source);
          this.createRoomObjects(roomdata);
        }), 0);
      } else if (translator) {
        setTimeout(elation.bind(this, function() {
          translator.exec({url: url, janus: this.properties.janus, room: this})
                    .then(elation.bind(this, this.createRoomObjects));
        }), 0);
      } else {
        elation.net.get(fullurl, null, { 
          headers: {
            //'User-Agent':'FireBox 1.0'
            //'X-Requested-With':'JanusWeb Client'
          },
          callback: elation.bind(this, function(data, xhr) { 
            var source = this.parseSource(data);
            if (source && source.source) {
              this.roomsrc = source.source;
              var responseURL = xhr.getResponseHeader('X-Final-URL');
              if (!responseURL) {
                responseURL = xhr.responseURL.replace(proxyurl, '');
              }
              if (responseURL != this.properties.url) {
                var url = responseURL;
                if (!baseurloverride) {
                  baseurl = url.split('/'); 
                  baseurl.pop(); 
                  baseurl = baseurl.join('/') + '/'; 
                  this.baseurl = baseurl;
                }
                this.properties.url = url;
              }
              var roomdata = this.parseFireBox(source.source);
              this.createRoomObjects(roomdata);
            } else {
              var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
              var transpath = datapath + 'assets/translator/web/';
              console.log('no firebox room, load the translator', transpath);
              this.load(transpath + 'Parallelogram.html', transpath );
            }
          }), 
          failurecallback: elation.bind(this, function() {
            var translator = this.translators['^error$'];
            translator.exec({janus: this.properties.janus, room: this})
                      .then(elation.bind(this, this.createRoomObjects));
            
          })
        });
      }
    }
    this.parseSource = function(data) { 
      this.fullsource = data;
      var titlere = /<title>([\s\S]*?)<\/title>/mi; 
      var re = /<fireboxroom>[\s\S]*?<\/fireboxroom>/mi; 
      var mtitle = data.match(titlere); 
      var parsed = {
        title: 'Untitled Room',
        source: false 
      }
      if (mtitle) {
        parsed.title = mtitle[1];
        this.setTitle(mtitle[1]);
      } else {
        this.setTitle(null);
      }
      var m = data.match(re); 
      if (m) { 
        parsed.source = m[0];
      }
      return parsed;
    }

    this.parseFireBox = function(fireboxsrc) {
      var xml = elation.utils.parseXML(fireboxsrc, false, true); 
      var rooms = this.getAsArray(elation.utils.arrayget(xml, 'fireboxroom._children.room', {})); 
      var room = {_children: {}};
      for (var i = 0; i < rooms.length; i++) {
        var attrs = Object.keys(rooms[i]).filter(function(k) { return (k[0] != '_'); });
        attrs.forEach(function(k) {
          room[k] = rooms[i][k];
        });
        if (rooms[i]._children) {
          Object.keys(rooms[i]._children).forEach(function(k) {
            room._children[k] = rooms[i]._children[k];
          });
        }
      }
      var roomdata = this.getRoomData(xml, room);
      return roomdata;
    }
    
    this.createRoomObjects = function(roomdata) {
      var room = roomdata.room,
          assets = roomdata.assets || [],
          objects = roomdata.objects || [],
          links = roomdata.links || [],
          sounds = roomdata.sounds || [],
          images = roomdata.images || [],
          image3ds = roomdata.image3ds || [],
          texts = roomdata.texts || [],
          videos = roomdata.videos || [];

      objects.forEach(elation.bind(this, function(n) { 
        var thingname = n.id + (n.js_id ? '_' + n.js_id : '_' + Math.round(Math.random() * 1000000));
setTimeout(elation.bind(this, function() {
        var thing = this.spawn('janusobject', thingname, { 
          'room': this,
          'js_id': n.js_id,
          'render.model': n.id, 
          'position': n.pos,
          'orientation': n.orientation,
          //'scale': n.scale,
          'image_id': n.image_id,
          'video_id': n.video_id,
          'loop': n.loop,
          'collision_id': n.collision_id,
          'websurface_id': n.websurface_id,
          'col': n.col,
          'cull_face': n.cull_face,
          'blend_src': n.blend_src,
          'blend_dest': n.blend_dest,
          'rotate_axis': n.rotate_axis,
          'rotate_deg_per_sec': n.rotate_deg_per_sec,
          'props': n,
          'visible': n.visible,
          'lighting': n.lighting
        }); 
        thing.setProperties(n);
        if (n.js_id) {
          this.jsobjects[n.js_id] = thing;
        }
}), Math.random() * 500);
      }));
      if (links) links.forEach(elation.bind(this, function(n) {
setTimeout(elation.bind(this, function() {
        var linkurl = (n.url.match(/^https?:/) || n.url.match(/^\/\//) || this.getTranslator(n.url) ? n.url : this.baseurl + n.url);
        var portalargs = { 
          'room': this,
          'js_id': n.js_id,
          'janus': this.properties.janus,
          'position': n.pos,
          'orientation': n.orientation,
          'scale':n.scale,
          'url': linkurl,
          'title': n.title,
        }; 
        if (n.thumb_id) {
          portalargs.thumbnail = elation.engine.assets.find('image', n.thumb_id);
        }
        var portal = this.spawn('janusportal', 'portal_' + n.url + '_' + Math.round(Math.random() * 10000), portalargs);
        if (n.js_id) {
          this.jsobjects[n.js_id] = portal;
        }
}), Math.random() * 500);
      }));
      if (images) images.forEach(elation.bind(this, function(n) {
setTimeout(elation.bind(this, function() {
        var imageargs = { 
          'room': this,
          'janus': this.properties.janus,
          'js_id': n.js_id,
          'position': n.pos,
          'orientation': n.orientation,
          'scale': n.scale,
          'image_id': n.id,
          'color': n.col,
          'lighting': n.lighting
        }; 
        var asset = false;
        if (assets.image) assets.image.forEach(function(img) {
          if (img.id == n.id) {
            asset = img;
          }
        });

        if (asset) {
          imageargs.sbs3d = asset.sbs3d;
          imageargs.ou3d = asset.ou3d;
          imageargs.reverse3d = asset.reverse3d;
        }
        var image = this.spawn('janusimage', n.id + '_' + Math.round(Math.random() * 10000), imageargs);
        if (n.js_id) {
          this.jsobjects[n.js_id] = image;
        }
}), Math.random() * 500);
      }));
      if (image3ds) image3ds.forEach(elation.bind(this, function(n) {
        var imageargs = { 
          'room': this,
          'janus': this.properties.janus,
          'js_id': n.js_id,
          'position': n.pos,
          'orientation': n.orientation,
          'scale': n.scale,
          'image_id': n.left_id,
          'color': n.col,
          'lighting': n.lighting
        }; 
        var image = this.spawn('janusimage', n.id + '_' + Math.round(Math.random() * 10000), imageargs);
        if (n.js_id) {
          this.jsobjects[n.js_id] = image;
        }
      }));
      if (texts) texts.forEach(elation.bind(this, function(n) {
        var labelargs = { 
          'room': this,
          'janus': this.properties.janus,
          'js_id': n.js_id,
          'position': n.pos,
          'orientation': n.orientation,
          'scale': n.scale,
          'text': n._content || ' ',
          'color': (n.col ? new THREE.Color().setRGB(n.col[0], n.col[1], n.col[2]) : new THREE.Color(0xffffff)),
        }; 
        var label = this.spawn('janustext', n.id + '_' + Math.round(Math.random() * 10000), labelargs);
        if (n.js_id) {
          this.jsobjects[n.js_id] = label;
        }
      }));
      var soundmap = {};
      if (assets.sound) assets.sound.forEach(function(n) { soundmap[n.id] = n; });
      if (sounds) sounds.forEach(elation.bind(this, function(n) {
        var soundargs = soundmap[n.id];
        if (soundargs) {
          var soundurl = (soundargs.src.match(/^https?:/) || soundargs.src[0] == '/' ? soundargs.src : this.baseurl + soundargs.src);

          var proxyurl = this.properties.janus.properties.corsproxy;
          soundurl = proxyurl + soundurl;
          var sound = this.spawn('sound', n.id + '_' + Math.round(Math.random() * 10000), { 
            'room': this,
            'js_id': n.js_id,
            'position': n.pos,
            'src': soundurl,
            'distance': parseFloat(n.dist),
            'volume': n.scale[0],
            'autoplay': true,
            'loop': n.loop,
          }); 
          if (n.js_id) {
            this.jsobjects[n.js_id] = sound;
          }
        } else {
          console.log("Couldn't find sound: " + n.id);
        }
      }));

      var videoassetmap = {};
      if (assets.video) assets.video.forEach(function(n) { videoassetmap[n.id] = n; });
      if (videos) videos.forEach(elation.bind(this, function(n) {
        var asset = videoassetmap[n.id];
        var videourl = (asset.src.match(/^https?:/) || asset.src[0] == '/' ? asset.src : this.baseurl + asset.src);
        var video = this.spawn('janusvideo', n.id + '_' + Math.round(Math.random() * 10000), {
          room: this,
          js_id: n.js_id,
          position: n.pos,
          orientation: n.orientation,
          scale: n.scale,
          //src: videourl,
          video_id: n.id,
          loop: asset.loop,
          autoplay: asset.auto_play || false,
          lighting: n.lighting
        });
        if (n.video) {
          this.jsobjects[n.js_id] = sound;
        }
      }));
      
      if (room) {
        if (room.use_local_asset && room.visible !== false) {
setTimeout(elation.bind(this, function() {
          var localasset = this.spawn('janusobject', 'local_asset_' + Math.round(Math.random() * 10000), { 
            'room': this,
            'render.model': room.use_local_asset,
            'col': room.col,
          }); 
}), Math.random() * 500);
        }
        // set player position based on room info
        this.playerstartposition = room.pos;
        this.playerstartorientation = room.orientation;

        if (room.skybox_left_id) this.properties.skybox_left = room.skybox_left_id;
        if (room.skybox_right_id) this.properties.skybox_right = room.skybox_right_id;
        if (room.skybox_up_id) this.properties.skybox_up = room.skybox_up_id;
        if (room.skybox_down_id) this.properties.skybox_down = room.skybox_down_id;
        if (room.skybox_front_id) this.properties.skybox_front = room.skybox_front_id;
        if (room.skybox_back_id) this.properties.skybox_back = room.skybox_back_id;
    
        this.properties.near_dist = parseFloat(room.near_dist) || 0.01;
        this.properties.far_dist = parseFloat(room.far_dist) || 1000;
        this.properties.fog = room.fog;
        this.properties.fog_mode = room.fog_mode || 'exp';
        this.properties.fog_density = room.fog_density;
        this.properties.fog_start = parseFloat(room.fog_start) || this.properties.near_dist;
        this.properties.fog_end = parseFloat(room.fog_end) || this.properties.far_dist;
        this.properties.fog_col = room.fog_col || room.fog_color;

        this.properties.walk_speed = room.walk_speed || 1.8;
        this.properties.run_speed = room.run_speed || 5.4;
      }

      //if (!this.active) {
        this.setActive();
      //}

      elation.events.fire({type: 'janus_room_load', element: this});
      //this.showDebug();
    }
    this.getRoomData = function(xml, room) {
      var assets = this.parseAssets(xml, room);
      var objects = this.getAsArray(elation.utils.arrayget(room, '_children.object', [])); 
      var links = this.getAsArray(elation.utils.arrayget(room, '_children.link', [])); 
      var sounds = this.getAsArray(elation.utils.arrayget(room, '_children.sound', [])); 
      var images = this.getAsArray(elation.utils.arrayget(room, '_children.image', [])); 
      var image3ds = this.getAsArray(elation.utils.arrayget(room, '_children.image3d', [])); 
      var texts = this.getAsArray(elation.utils.arrayget(room, '_children.text', [])); 
      var videos = this.getAsArray(elation.utils.arrayget(room, '_children.video', [])); 

      var orphanobjects = this.getAsArray(elation.utils.arrayget(xml, 'fireboxroom._children.object')); 
      var orphanlinks = this.getAsArray(elation.utils.arrayget(xml, 'fireboxroom._children.link')); 
      var orphansounds = this.getAsArray(elation.utils.arrayget(xml, 'fireboxroom._children.sound')); 
      var orphanvideos = this.getAsArray(elation.utils.arrayget(xml, 'fireboxroom._children.video')); 
      var orphanimages = this.getAsArray(elation.utils.arrayget(xml, 'fireboxroom._children.image')); 
      var orphantexts = this.getAsArray(elation.utils.arrayget(xml, 'fireboxroom._children.text')); 

      if (orphanobjects && orphanobjects[0]) objects.push.apply(objects, orphanobjects);
      if (links && orphanlinks[0]) links.push.apply(links, orphanlinks);
      if (images && orphanimages[0]) images.push.apply(images, orphanimages);
      if (videos && orphanvideos[0]) videos.push.apply(videos, orphanvideos);
      if (sounds && orphansounds[0]) sounds.push.apply(sounds, orphansounds);
      if (texts && orphantexts[0]) texts.push.apply(texts, orphantexts);

      return {
        assets: assets,
        room: this.parseNode(room),
        objects: objects.map(elation.bind(this, this.parseNode)),
        links: links.map(elation.bind(this, this.parseNode)),
        sounds: sounds.map(elation.bind(this, this.parseNode)),
        images: images.map(elation.bind(this, this.parseNode)),
        image3ds: image3ds.map(elation.bind(this, this.parseNode)),
        texts: texts.map(elation.bind(this, this.parseNode)),
        videos: videos.map(elation.bind(this, this.parseNode)),
      };
    }
    this.getAsArray = function(arr) {
      return (elation.utils.isArray(arr) ? arr : [arr]);
    }
    this.getOrientation = function(xdir, ydir, zdir) {
      if (xdir) xdir = new THREE.Vector3().fromArray(xdir.split(' ')).normalize();
      if (ydir) ydir = new THREE.Vector3().fromArray(ydir.split(' ')).normalize();
      if (zdir) zdir = new THREE.Vector3().fromArray(zdir.split(' ')).normalize();

      if (xdir && !ydir && !zdir) {
        ydir = new THREE.Vector3(0,1,0);
        zdir = new THREE.Vector3().crossVectors(xdir, ydir);
      }
      if (!xdir && !ydir && zdir) {
        ydir = new THREE.Vector3(0,1,0);
        xdir = new THREE.Vector3().crossVectors(ydir, zdir);
      }

      if (!xdir && ydir && zdir) {
        xdir = new THREE.Vector3().crossVectors(zdir, ydir);
      }
      if (xdir && !ydir && zdir) {
        ydir = new THREE.Vector3().crossVectors(xdir, zdir).multiplyScalar(-1);
      }
      if (xdir && ydir && !zdir) {
        zdir = new THREE.Vector3().crossVectors(xdir, ydir);
      }
      if (!xdir) xdir = new THREE.Vector3(1,0,0);
      if (!ydir) ydir = new THREE.Vector3(0,1,0);
      if (!zdir) zdir = new THREE.Vector3(0,0,1);

      var mat4 = new THREE.Matrix4().makeBasis(xdir, ydir, zdir);
      var quat = new THREE.Quaternion();
      var pos = new THREE.Vector3();
      var scale = new THREE.Vector3();
      //quat.setFromRotationMatrix(mat4);
      mat4.decompose(pos, quat, scale);
      quat.normalize();
      //quat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)));
      return quat;
    }
    this.parseAssets = function(xml) {
      var assetxml = elation.utils.arrayget(xml, 'fireboxroom._children.assets', {}); 
      var objectassets = this.getAsArray(elation.utils.arrayget(assetxml, "_children.assetobject", [])); 
      var soundassets = this.getAsArray(elation.utils.arrayget(assetxml, "_children.assetsound", [])); 
      var imageassets = this.getAsArray(elation.utils.arrayget(assetxml, "_children.assetimage", [])); 
      var videoassets = this.getAsArray(elation.utils.arrayget(assetxml, "_children.assetvideo", [])); 
      var websurfaceassets = this.getAsArray(elation.utils.arrayget(assetxml, "_children.assetwebsurface", [])); 
      var assetlist = [];
      var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
      imageassets.forEach(function(n) { 
        var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
        assetlist.push({ assettype:'image', name:n.id, src: src }); 
      });
      videoassets.forEach(elation.bind(this, function(n) { 
        var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
        assetlist.push({ 
          assettype:'video', 
          name:n.id, 
          src: src, 
          loop: n.loop,
          sbs3d: n.sbs3d == 'true',  
          ou3d: n.ou3d == 'true',  
          auto_play: n.auto_play == 'true',  
        }); 
      }));
      websurfaceassets.forEach(elation.bind(this, function(n) { this.websurfaces[n.id] = n; }));
      elation.engine.assets.loadJSON(assetlist, this.baseurl); 

      var objlist = []; 
      var baseurl = this.baseurl;
      objectassets.forEach(function(n) { 
        if (n.src) {
          var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
          var mtlsrc = (n.mtl && n.mtl.match(/^file:/) ? n.mtl.replace(/^file:/, datapath) : n.mtl);
          if (mtlsrc && !mtlsrc.match(/^(https?:)?\/\//)) mtlsrc = baseurl + mtlsrc;
          var srcparts = src.split(' ');
          src = srcparts[0];
          objlist.push({assettype: 'model', name: n.id, src: src, mtl: mtlsrc, tex_linear: n.tex_linear, tex0: n.tex || n.tex0 || srcparts[1], tex1: n.tex1 || srcparts[2], tex2: n.tex2 || srcparts[3], tex3: n.tex3 || srcparts[4]}); 
        }
      }); 
      elation.engine.assets.loadJSON(objlist, this.baseurl); 
      var assets = {
        image: imageassets,
        sound: soundassets,
        video: videoassets
      };
      return assets;
    }
    this.parseNode = function(n) {
      var nodeinfo = {};
      var attrs = Object.keys(n);
      attrs.forEach(elation.bind(this, function(k) {
        nodeinfo[k] = (n[k] == 'false' ? false : n[k]);
      }));

      nodeinfo.pos = (n.pos ? (elation.utils.isArray(n.pos) ? n.pos : n.pos.split(' ')).map(parseFloat) : [0,0,0]);
      nodeinfo.scale = (n.scale ? (elation.utils.isArray(n.scale) ? n.scale : n.scale.split(' ')).map(parseFloat) : [1,1,1]);
      nodeinfo.orientation = this.getOrientation(n.xdir, n.ydir || n.up, n.zdir || n.fwd);
      nodeinfo.col = (n.col ? (n.col[0] == '#' ? [parseInt(n.col.substr(1,2), 16)/255, parseInt(n.col.substr(3, 2), 16)/255, parseInt(n.col.substr(5, 2), 16)/255] : (elation.utils.isArray(n.col) ? n.col : n.col.split(' '))) : null);
      
      var minscale = 1e-6;
/*
      nodeinfo.scale[0] = Math.max(minscale, nodeinfo.scale[0]);
      nodeinfo.scale[1] = Math.max(minscale, nodeinfo.scale[1]);
      nodeinfo.scale[2] = Math.max(minscale, nodeinfo.scale[2]);
*/
      if (nodeinfo.scale[0] < minscale && nodeinfo.scale[0] > -minscale) nodeinfo.scale[0] = minscale;
      if (nodeinfo.scale[1] < minscale && nodeinfo.scale[1] > -minscale) nodeinfo.scale[1] = minscale;
      if (nodeinfo.scale[2] < minscale && nodeinfo.scale[2] > -minscale) nodeinfo.scale[2] = minscale;

      return nodeinfo;
    }
    this.getTranslator = function(url) {
      var keys = Object.keys(this.translators);
      for (var i = 0; i < keys.length; i++) {
        var re = new RegExp(keys[i]);
        if (url.match(re)) {
          return this.translators[keys[i]];
        }
      }
      // TODO - implement default page handling as translator
      return false;
    }
    this.enable = function() {
    }
    this.disable = function() {
      this.objects['3d'].traverse(function(n) {
        if (n instanceof THREE.Audio && n.isPlaying) {
          n.stop();
        }
      });
      elation.events.fire({type: 'room_disable', data: this});
    }
    this.setTitle = function(title) {
      if (!title) title = 'Untitled Page';
      this.title = title;

      document.title = 'JanusWeb | ' + this.title;
    }
    this.applyEditXML = function(editxml) {
      var xml = elation.utils.parseXML('<edit>' + editxml + '</edit>');
      var edit = xml.edit._children;
      var keys = Object.keys(edit);
      var hasNew = false;
      keys.forEach(elation.bind(this, function(k) {
        var newobjs = edit[k];
        if (!elation.utils.isArray(newobjs)) newobjs = [newobjs];
        
        var diff = {
          assets: {
            objects: [],
            image: [],
            videos: [],
            sounds: [],
          },
          objects: [],
          images: [],
          image3ds: [],
          links: [],
          videos: [],
          sounds: [],
          texts: [],
        };
        for (var i = 0; i < newobjs.length; i++) {
          var newobj = newobjs[i],
              existing = this.jsobjects[newobj.js_id];
          if (existing) {
            existing.setProperties(newobj);
          } else {
            hasNew = true;
            diff[(k.toLowerCase() + 's')].push(newobj);
            if (newobj.id.match(/^https?:/)) {
              diff.assets.objects.push({assettype: 'model', name: newobj.id, src: newobj.id});
            }
            console.log('create new!', newobj.js_id, newobj);
          }
        }
        if (hasNew) {
          elation.engine.assets.loadJSON(diff.assets.objects, this.baseurl); 
          this.createRoomObjects(diff);
        }
      }));
    }
    this.applyDeleteXML = function(deletexml) {
      var del = elation.utils.parseXML(deletexml);
      var keys = Object.keys(del);
      keys.forEach(elation.bind(this, function(k) {
        var delobj = del[k],
            existing = this.jsobjects[delobj.js_id];
        if (existing) {
          existing.die();
        }
      }));
    }
  }, elation.engine.things.generic);
});
