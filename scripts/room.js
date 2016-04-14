elation.require([
    'ui.textarea', 'ui.window', 
     'engine.things.generic', 'engine.things.sound', 'engine.things.label', 
    'janusweb.object', 'janusweb.portal', 'janusweb.image', 'janusweb.video', 'janusweb.text'
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
      this.playerstartposition = [0,0,0];
      this.playerstartorientation = new THREE.Quaternion();
      this.load();
      this.roomsrc = '';
      //this.showDebug();
    }
    this.createChildren = function() {
      this.spawn('light_ambient', this.id + '_ambient', {
        color: 0x222222
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
      player.properties.movespeed = this.properties.walk_speed * 60;
      player.properties.runspeed = this.properties.run_speed * 60;
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
          this.engine.systems.world.setFogExp(this.properties.fog_density, fogcolor);
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
    this.load = function(url) {
      if (!url) {
        url = this.properties.url;
      } else {
        this.properties.url = url;
      }
      var baseurl = url.split('/'); 
      if (baseurl.length > 3) baseurl.pop(); 
      baseurl = baseurl.join('/') + '/'; 
      this.baseurl = baseurl;

      this.jsobjects = {};
      this.websurfaces = {};
      this.images = {};
      this.videos = {};

      this.setTitle('loading...');

      var proxyurl = this.properties.janus.properties.corsproxy;

      var fullurl = url;
      if (fullurl[0] == '/' && fullurl[1] != '/') fullurl = this.baseurl + fullurl;
      if (!fullurl.match(/^https?:/)) {
        fullurl = self.location.origin + fullurl;
      } else {
        fullurl = proxyurl + fullurl;
      }

      if (url == document.location.href) {
        setTimeout(elation.bind(this, function() {
          this.parseSource(document.documentElement.outerHTML);
        }), 0);
      } else {
        elation.net.get(fullurl, null, { 
          headers: {
            //'User-Agent':'FireBox 1.0'
            //'X-Requested-With':'JanusWeb Client'
          },
          callback: elation.bind(this, function(data, xhr) { 
            this.parseSource(data);

            var responseURL = xhr.getResponseHeader('X-Final-URL');
            if (!responseURL) {
              responseURL = xhr.responseURL.replace(proxyurl, '');
            }
            if (responseURL != this.properties.url) {
              var url = responseURL;
              var baseurl = url.split('/'); 
                  baseurl.pop(); 
                  baseurl = baseurl.join('/') + '/'; 
                  //root = elation.engine.instances.default.systems.world.children.default; 
              this.baseurl = baseurl;
              this.properties.url = url;
            }

          })
        }); 
      }
    }
    this.parseSource = function(data) { 
      this.fullsource = data;
      var titlere = /<title>([\s\S]*?)<\/title>/mi; 
      var re = /<fireboxroom>[\s\S]*?<\/fireboxroom>/mi; 
      var mtitle = data.match(titlere); 
      if (mtitle) {
        this.setTitle(mtitle[1]);
      } else {
        this.setTitle(null);
      }
      
      var m = data.match(re); 
      if (m) { 
        this.roomsrc = m[0];
        this.parseFireBox(this.roomsrc);
      } else {
        console.log('no firebox room, load the translator');
        this.load(self.location.origin + '/media/janusweb/assets/translator/web/Parallelogram.html');
      }
    }

    this.parseFireBox = function(fireboxsrc) {
      var root = this;

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
      console.log(xml, room);

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

      var roomnode = this.parseNode(room);
    
      if (room.use_local_asset && room.visible != 'false') {
        var localasset = this.spawn('janusobject', 'local_asset_' + Math.round(Math.random() * 10000), { 
          'room': this,
          'render.model': room.use_local_asset,
          'col': roomnode.col,
        }); 
      }
      objects.forEach(elation.bind(this, function(n) { 
        var node = this.parseNode(n);
        var thingname = n.id + (n.js_id ? '_' + n.js_id : '_' + Math.round(Math.random() * 1000000));
        var thing = root.spawn('janusobject', thingname, { 
          'room': this,
          'render.model': n.id, 
          'position': node.pos,
          'orientation': node.orientation,
          'scale': node.scale,
          'image_id': n.image_id,
          'video_id': n.video_id,
          'collision_id': n.collision_id,
          'websurface_id': n.websurface_id,
          'col': node.col,
          'cull_face': n.cull_face,
          'blend_src': n.blend_src,
          'blend_dest': n.blend_dest,
          'rotate_axis': n.rotate_axis,
          'rotate_deg_per_sec': n.rotate_deg_per_sec,
          'props': n,
          'visible': node.visible,
          'lighting': node.lighting
        }); 
        if (n.js_id) {
          this.jsobjects[n.js_id] = thing;
        }
      }));
      links.forEach(elation.bind(this, function(n) {
        var node = this.parseNode(n);
        var linkurl = (n.url.match(/^https?:/) ? n.url : this.baseurl + n.url);
        var portalargs = { 
          'room': this,
          'janus': this.properties.janus,
          'position': node.pos,
          'orientation': node.orientation,
          'scale':node. scale,
          'url': linkurl,
          'title': n.title,
        }; 
        if (n.thumb_id) {
          portalargs.thumbnail = elation.engine.assets.find('image', n.thumb_id);
        }
        var portal = root.spawn('janusportal', 'portal_' + n.url + '_' + Math.round(Math.random() * 10000), portalargs);
        //console.log('herp', portal); 
        if (n.js_id) {
          this.jsobjects[n.js_id] = portal;
        }
      }));
      images.forEach(elation.bind(this, function(n) {
        var node = this.parseNode(n);
        var imageargs = { 
          'room': this,
          'janus': this.properties.janus,
          'position': node.pos,
          'orientation': node.orientation,
          'scale': node.scale,
          'image_id': n.id,
          'color': node.col,
          'lighting': node.lighting
        }; 
        var asset = false;
        assets.image.forEach(function(img) {
          if (img.id == n.id) {
            asset = img;
          }
        });

        if (asset) {
          imageargs.sbs3d = asset.sbs3d;
          imageargs.ou3d = asset.ou3d;
          imageargs.reverse3d = asset.reverse3d;
        }
        var image = root.spawn('janusimage', n.id + '_' + Math.round(Math.random() * 10000), imageargs);
      }));
      image3ds.forEach(elation.bind(this, function(n) {
        var node = this.parseNode(n);
        var imageargs = { 
          'room': this,
          'janus': this.properties.janus,
          'position': node.pos,
          'orientation': node.orientation,
          'scale': node.scale,
          'image_id': n.left_id,
          'color': node.col,
          'lighting': node.lighting
        }; 
        var image = root.spawn('janusimage', n.id + '_' + Math.round(Math.random() * 10000), imageargs);
      }));
      texts.forEach(elation.bind(this, function(n) {
        var node = this.parseNode(n);
        var labelargs = { 
          'room': this,
          'janus': this.properties.janus,
          'position': node.pos,
          'orientation': node.orientation,
          'scale': node.scale,
          'text': n._content || ' ',
          'color': new THREE.Color().setRGB(node.col[0], node.col[1], node.col[2]),
        }; 
        var label = root.spawn('janustext', n.id + '_' + Math.round(Math.random() * 10000), labelargs);
      }));
      var soundmap = {};
      assets.sound.forEach(function(n) { soundmap[n.id] = n; });
      sounds.forEach(elation.bind(this, function(n) {
        var node = this.parseNode(n);
        var soundargs = soundmap[n.id];
        if (soundargs) {
          var soundurl = (soundargs.src.match(/^https?:/) || soundargs.src[0] == '/' ? soundargs.src : this.baseurl + soundargs.src);

          var proxyurl = this.properties.janus.properties.corsproxy;
          soundurl = proxyurl + soundurl;
          var sound = root.spawn('sound', n.id + '_' + Math.round(Math.random() * 10000), { 
            'room': this,
            'position': node.pos,
            'src': soundurl,
            'autoplay': true,
            'loop': true,
          }); 
        } else {
          console.log("Couldn't find sound: " + n.id);
        }
      }));

      var videoassetmap = {};
      assets.video.forEach(function(n) { videoassetmap[n.id] = n; });
      videos.forEach(elation.bind(this, function(n) {
        var node = this.parseNode(n);
        var asset = videoassetmap[n.id];
        var videourl = (asset.src.match(/^https?:/) || asset.src[0] == '/' ? asset.src : this.baseurl + asset.src);
        var video = root.spawn('janusvideo', n.id + '_' + Math.round(Math.random() * 10000), {
          'room': this,
          position: node.pos,
          orientation: node.orientation,
          scale: node.scale,
          //src: videourl,
          video_id: n.id,
          loop: asset.loop,
          autoplay: asset.auto_play || false,
          'lighting': node.lighting
        });
      }));
      
      // set player position based on room info
      this.playerstartposition = roomnode.pos.map(parseFloat);
      this.playerstartorientation = roomnode.orientation;

      if (room.skybox_left_id) this.properties.skybox_left = room.skybox_left_id;
      if (room.skybox_right_id) this.properties.skybox_right = room.skybox_right_id;
      if (room.skybox_up_id) this.properties.skybox_up = room.skybox_up_id;
      if (room.skybox_down_id) this.properties.skybox_down = room.skybox_down_id;
      if (room.skybox_front_id) this.properties.skybox_front = room.skybox_front_id;
      if (room.skybox_back_id) this.properties.skybox_back = room.skybox_back_id;
  
      this.properties.near_dist = parseFloat(room.near_dist) || 0.01;
      this.properties.far_dist = parseFloat(room.far_dist) || 1000;
      this.properties.fog = room.fog;
      this.properties.fog_mode = room.fog_mode;
      this.properties.fog_density = room.fog_density;
      this.properties.fog_start = parseFloat(room.fog_start) || this.properties.near_dist;
      this.properties.fog_end = parseFloat(room.fog_end) || this.properties.far_dist;
      this.properties.fog_col = room.fog_col || room.fog_color;

      this.properties.walk_speed = room.walk_speed || 1.8;
      this.properties.run_speed = room.run_speed || 5.4;

      this.setActive();

      elation.events.fire({type: 'janus_room_load', element: this});
      //this.showDebug();
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
      imageassets.forEach(function(n) { assetlist.push({ assettype:'image', name:n.id, src: n.src }); });
      videoassets.forEach(elation.bind(this, function(n) { 
        assetlist.push({ 
          assettype:'video', 
          name:n.id, 
          src: n.src, 
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
          var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, '/media/janusweb/') : n.src);
          var mtlsrc = (n.mtl && n.mtl.match(/^file:/) ? n.mtl.replace(/^file:/, '/media/janusweb/') : n.mtl);
          if (mtlsrc && !mtlsrc.match(/^https?:/)) mtlsrc = baseurl + mtlsrc;
          var srcparts = src.split(' ');
          src = srcparts[0];
          objlist.push({assettype: 'model', name: n.id, src: src, mtl: mtlsrc, tex0: n.tex || n.tex0 || srcparts[1], tex1: n.tex1 || srcparts[2], tex2: n.tex2 || srcparts[3], tex3: n.tex3 || srcparts[4]}); 
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
      var nodeinfo = {
        pos: (n.pos ? n.pos.split(' ') : [0,0,0]),
        scale: (n.scale ? n.scale.split(' ') : [1,1,1]),
        orientation: this.getOrientation(n.xdir, n.ydir || n.up, n.zdir || n.fwd),
        col: (n.col ? (n.col[0] == '#' ? [parseInt(n.col.substr(1,2), 16)/255, parseInt(n.col.substr(3, 2), 16)/255, parseInt(n.col.substr(5, 2), 16)/255] : n.col.split(' ')) : [1,1,1]),
        visible: (n.visible !== false && n.visible !== 0 && n.visible !== 'false'),
        lighting: (n.lighting !== false && n.lighting !== 0 && n.lighting !== 'false')
      };
      var minscale = 1e-6;
      nodeinfo.scale[0] = Math.max(minscale, nodeinfo.scale[0]);
      nodeinfo.scale[1] = Math.max(minscale, nodeinfo.scale[1]);
      nodeinfo.scale[2] = Math.max(minscale, nodeinfo.scale[2]);

      return nodeinfo;
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
  }, elation.engine.things.generic);
});
