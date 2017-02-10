elation.require([
    'ui.textarea', 'ui.window', 
     'engine.things.generic', 'engine.things.label', 'engine.things.skybox',
    'janusweb.object', 'janusweb.portal', 'janusweb.image', 'janusweb.video', 'janusweb.text', 'janusweb.janusparagraph',
    'janusweb.sound', 'janusweb.januslight', 'janusweb.janusparticle', 'janusweb.janusghost',
    'janusweb.translators.bookmarks', 'janusweb.translators.reddit', 'janusweb.translators.error', 'janusweb.translators.blank', 'janusweb.translators.default'
  ], function() {
  elation.component.add('engine.things.janusroom', function() {
    this.postinit = function() {
      elation.engine.things.janusroom.extendclass.postinit.call(this);
      this.defineProperties({
        'janus': { type: 'object' },
        'url': { type: 'string', default: false },
        'corsproxy': { type: 'string', default: false },
        'baseurl': { type: 'string', default: false },
        'source': { type: 'string' },
        'skybox_left': { type: 'string' },
        'skybox_right': { type: 'string' },
        'skybox_up': { type: 'string' },
        'skybox_down': { type: 'string' },
        'skybox_front': { type: 'string' },
        'skybox_back': { type: 'string' },
        'cubemap_irradiance_id': { type: 'string' },
        'cubemap_radiance_id': { type: 'string' },
        'fog': { type: 'boolean', default: false },
        'fog_mode': { type: 'string', default: 'exp' },
        'fog_density': { type: 'float', default: 1.0 },
        'fog_start': { type: 'float', default: 0.0 },
        'fog_end': { type: 'float', default: 100.0 },
        'fog_col': { type: 'color', default: 0x000000 },
        'bloom': { type: 'float', default: 0.4, set: this.updateBloom },
        'walk_speed': { type: 'float', default: 1.8 },
        'run_speed': { type: 'float', default: 5.4 },
        'jump_velocity': { type: 'float', default: 5.0 },
        'gravity': { type: 'float', default: -9.8 },
        'locked': { type: 'bool', default: false },
        'cursor_visible': { type: 'bool', default: true },
        'use_local_asset': { type: 'string', set: this.updateLocalAsset },
        'col': { type: 'color', set: this.updateLocalAsset },
      });
      this.translators = {
        '^about:blank$': elation.janusweb.translators.blank({janus: this.janus}),
        '^bookmarks$': elation.janusweb.translators.bookmarks({janus: this.janus}),
        '^https?:\/\/(www\.)?reddit.com': elation.janusweb.translators.reddit({janus: this.janus}),
        '^error$': elation.janusweb.translators.error({janus: this.janus}),
        '^default$': elation.janusweb.translators.default({janus: this.janus})
      };
      this.playerstartposition = [0,0,0];
      this.playerstartorientation = new THREE.Quaternion();
      this.roomsrc = '';
      this.changes = {};
      this.appliedchanges = {};
      this.openportals = [];
      this.roomassets = {};
      this.pendingassets = [];
      this.jsobjects = {};
      this.cookies = {};
      this.websurfaces = {};
      this.images = {};
      this.videos = {};
      this.loaded = false;

      if (this.engine.systems.admin) {
        elation.events.add(this.engine.systems.admin, 'admin_edit_change', elation.bind(this, this.onRoomEdit));
      }
      //this.showDebug();
      elation.events.add(window, 'keydown', elation.bind(this, this.onKeyDown));
      elation.events.add(window, 'keyup', elation.bind(this, this.onKeyUp));

      elation.events.add(this.engine.client.container, 'mousedown', elation.bind(this, this.onMouseDown));
      elation.events.add(this.engine.client.container, 'mouseup', elation.bind(this, this.onMouseUp));

      if (this.url) {
        this.load(this.url, this.baseurl);
      } else if (this.source) {
        this.loadFromSource(this.source);
      }
    }
    this.createChildren = function() {
      this.createLights();

      this.lastthink = 0;
      this.thinktime = 0;
      elation.events.add(this, 'thing_think', elation.bind(this, this.onScriptTick));
    }
    this.createLights = function() {
      this.spawn('light_ambient', this.id + '_ambient', {
        color: 0x666666
      });
      this.spawn('light_directional', this.id + '_sun', {
        position: [-20,50,25],
        intensity: 0.1
      });
      this.spawn('light_point', this.id + '_point', {
        position: [22,19,-15],
        intensity: 0.1
      });
    }
    this.setActive = function() {
      this.setSkybox();
      this.setFog();
      this.updateBloom();
      this.setNearFar();
      this.setPlayerPosition();
      this.active = true;
      elation.events.fire({element: this, type: 'room_active', data: this});
    }
    this.setPlayerPosition = function(pos, orientation) {
      if (!pos) {
        pos = this.playerstartposition;
        orientation = this.playerstartorientation;
      }
      var player = this.engine.client.player;
      player.reset_position();
      player.properties.movestrength = 80 * this.properties.walk_speed;
      player.properties.runstrength = 80 * this.properties.run_speed;
      player.cursor_visible = this.cursor_visible;
      // FIXME - for some reason the above call sometimes orients the player backwards.  Doing it on a delay fixes it...
      setTimeout(elation.bind(player, player.reset_position), 0);
    }
    this.setSkybox = function() {
      if (!this.loaded) return;
      if (!this.skybox) {
        this.skybox = this.spawn('skybox', this.id + '_sky', {
          position: [0,0,0],
          collidable: false
        });
      }
      if (this.skyboxtexture) {
        this.skybox.setTexture(this.skyboxtexture);
        return;
      }

      var hasSkybox = (this.skybox_left || this.skybox_right || this.skybox_top || this.skybox_bottom || this.skybox_left || this.skybox_right) != undefined;
      if (hasSkybox) {
        var assets = [
          this.getAsset('image', this.skybox_right || 'black'),
          this.getAsset('image', this.skybox_left || 'black'),
          this.getAsset('image', this.skybox_up || 'black'),
          this.getAsset('image', this.skybox_down || 'black'),
          this.getAsset('image', this.skybox_front || 'black'),
          this.getAsset('image', this.skybox_back || 'black')
        ];
      } else {
        var skyboxname = 'miramar';
        var assets = [
          this.getAsset('image', skyboxname + '_right'),
          this.getAsset('image', skyboxname + '_left'),
          this.getAsset('image', skyboxname + '_up'),
          this.getAsset('image', skyboxname + '_down'),
          this.getAsset('image', skyboxname + '_front'),
          this.getAsset('image', skyboxname + '_back')
        ];
      }

      var loaded = 0, errored = 0;
      var texures = [];
      assets.forEach(elation.bind(this, function(asset) { 
        if (asset) {
          var n = asset.getInstance();
            elation.events.add(n, 'asset_load,asset_error', elation.bind(this, function(ev) {
              if (ev.type == 'asset_load') loaded++;
              else errored++;
              if (loaded + errored == 6) {
                this.processSkybox(assets);
              }
            }));
          }
      }));
      return false;
    }
    this.processSkybox = function(assets) {
      if (assets[0] && assets[1] && assets[2] && assets[3] && assets[4] && assets[5]) {
        var images = [];
        assets.forEach(function(asset) { 
          var t = asset.getInstance();
          images.push(t.image); 
        });
      
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
          this.skybox.setTexture(this.skyboxtexture);
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
    this.updateBloom = function() {
      // adjust bloom setting
      var bloomfilter = this.engine.client.view.effects['bloom'];
      if (bloomfilter) {
        bloomfilter.copyUniforms.opacity.value = this.bloom;
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
      if (!baseurl && url) {
        baseurl = url.split('/'); 
        if (baseurl.length > 3) baseurl.pop(); 
        baseurl = baseurl.join('/') + '/'; 
      }
      this.baseurl = baseurl;

      this.jsobjects = {};
      this.cookies = {};
      this.websurfaces = {};
      this.images = {};
      this.videos = {};

      this.setTitle('loading...');

      var proxyurl = this.corsproxy || '';

      var fullurl = url;
      if (fullurl[0] == '/' && fullurl[1] != '/') fullurl = this.baseurl + fullurl;
      if (!fullurl.match(/^https?:/) && !fullurl.match(/^\/\//)) {
        fullurl = self.location.origin + fullurl;
      } else {
        fullurl = proxyurl + fullurl;
      }

      elation.events.fire({element: this, type: 'room_load_queued'});

      var translator = this.getTranslator(url);

      /*
      // Disabled - using outerHTML to get the source is a nice way to avoid an extra network trip,
      // but due to how browser parsers work it means we can't get back unmodified XML, so it's best
      // to just make an XHR call and let the browser cache handle it
      if (url == document.location.href) {
        setTimeout(elation.bind(this, function() {
          this.roomsrc = this.parseSource(document.documentElement.outerHTML);
          var roomdata = this.parseFireBox(this.roomsrc.source);
          this.createRoomObjects(roomdata);
          this.setActive();
          this.loaded = false;
          elation.events.fire({type: 'janus_room_load', element: this});
        }), 0);
      } else 
      */

      if (translator) {
        setTimeout(elation.bind(this, function() {
          // TODO - use the new official translators here!
          translator.exec({url: url, janus: this.properties.janus, room: this})
                    .then(elation.bind(this, function(objs) {
                      this.roomsrc = objs.source;
                      this.loadRoomAssets(objs);
                      this.createRoomObjects(objs);
                      this.loaded = true;
                      this.setActive();
                      elation.events.fire({type: 'janus_room_load', element: this});
                    }));
        }), 0);
      } else if (url.indexOf('data:') == 0) {
        var prefix = 'data:text/html,';
        var data = decodeURIComponent(url.substr(prefix.length));
        setTimeout(elation.bind(this, function() {
          elation.events.fire({element: this, type: 'room_load_processing'});
          this.loadFromSource(data);
        }), 0);
      } else {
        var started = false;
        elation.net.get(fullurl, null, { 
          headers: {
            //'User-Agent':'FireBox 1.0'
            //'X-Requested-With':'JanusWeb Client'
          },
          callback: elation.bind(this, function(data, xhr) { 
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
            elation.events.fire({element: this, type: 'room_load_processing'});
            this.loadFromSource(data);
          }), 
          failurecallback: elation.bind(this, function(xhr) {
            var translator = this.translators['^error$'];
            translator.exec({janus: this.properties.janus, room: this, error: xhr.status || 404})
                      .then(elation.bind(this, this.createRoomObjects));
            
          }),
          onprogress: elation.bind(this, function(ev) {
            if (!started) {
              started = true;
              elation.events.fire({element: this, type: 'room_load_start'});
            }
            var progress = {
              src: ev.target.responseURL,
              total: ev.total,
              loaded: ev.loaded
            };
            elation.events.fire({element: this, type: 'room_load_progress', data: progress});
          })
        });
      }
    }
    this.validateSource = function(sourcecode) {
      return new Promise(elation.bind(this, function(resolve, reject) {
        var source = this.parseSource(sourcecode);

        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
        var roomdata = this.janus.parser.parse(source.source, this.baseurl, datapath);
        resolve(true);
      }));
    }
    this.loadFromSource = function(sourcecode, baseurl) {
      if (baseurl) {
        this.baseurl = baseurl;
      }
      var source = this.parseSource(sourcecode);
      if (source && source.source) {
        this.roomsrc = source.source;
        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
        var roomdata = this.janus.parser.parse(source.source, this.baseurl, datapath);
        this.loadRoomAssets(roomdata);
        this.createRoomObjects(roomdata);
        this.loaded = true;
        if (this.active) {
          this.setActive();
        }
        elation.events.fire({element: this, type: 'room_load_processed'});
        elation.events.fire({type: 'janus_room_load', element: this});
      } else {
        var translator = this.getTranslator('default');
        setTimeout(elation.bind(this, function() {
          // TODO - use the new official translators here!
          translator.exec({url: this.url, janus: this.properties.janus, room: this})
                    .then(elation.bind(this, function(objs) {
                      this.roomsrc = objs.source;
                      this.loadRoomAssets(objs);
                      this.createRoomObjects(objs);
                      this.loaded = true;
                      this.setActive();
                      elation.events.fire({type: 'janus_room_load', element: this});
                    }));
        }), 0);
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

    this.loadRoomAssets = function(roomdata) {
      if (roomdata && roomdata.assets && roomdata.assets.assetlist && roomdata.assets.assetlist.length > 0) {
        elation.engine.assets.loadJSON(roomdata.assets.assetlist, this.baseurl);
        this.websurfaces = roomdata.assets.websurfaces;
      }
    }
    this.clear = function() {
      for (var k in this.children) {
        this.remove(this.children[k]);
      }
      this.createLights();
    }
    this.createRoomObjects = function(roomdata) {
      var room = roomdata.room,
          assets = roomdata.assets || [],
          objects = roomdata.objects || [],
          links = roomdata.links || [],
          sounds = roomdata.sounds || [],
          particles = roomdata.particles || [],
          images = roomdata.images || [],
          image3ds = roomdata.image3ds || [],
          texts = roomdata.texts || [],
          paragraphs = roomdata.paragraphs || [],
          lights = roomdata.lights || [],
          ghosts = roomdata.ghosts || [],
          videos = roomdata.videos || [];

      if (lights) lights.forEach(elation.bind(this, function(n) {
        this.createObject('light',  n);
      }));
      if (objects) objects.forEach(elation.bind(this, function(n) { 
        this.createObject('object', n);
      }));
      if (links) links.forEach(elation.bind(this, function(n) {
        this.createObject('link', n);
      }));
      if (images) images.forEach(elation.bind(this, function(n) {
        this.createObject('image', n);
      }));
      if (image3ds) image3ds.forEach(elation.bind(this, function(n) {
        this.createObject('image', n);
      }));
      if (texts) texts.forEach(elation.bind(this, function(n) {
        this.createObject('text', n);
      }));
      if (paragraphs) paragraphs.forEach(elation.bind(this, function(n) {
        this.createObject('paragraph',  n);
      }));
      if (sounds) sounds.forEach(elation.bind(this, function(n) {
        this.createObject('sound',  n);
      }));
      if (particles) particles.forEach(elation.bind(this, function(n) {
        this.createObject('particle',  n);
      }));
      if (ghosts) {
        var ghostassetmap = {};
        if (assets.ghosts) assets.ghosts.forEach(function(n) { ghostassetmap[n.id] = n; });
        ghosts.forEach(elation.bind(this, function(n) {
          var asset = ghostassetmap[n.id];
          if (asset) {
            var ghosturl = (asset.src.match(/^https?:/) || asset.src[0] == '/' ? asset.src : this.baseurl + asset.src);
            n.ghost_src = ghostassetmap[n.id].src;
          }
          this.createObject('ghost',  n);
        }));
      }

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
        this.jsobjects[n.js_id] = video.getProxyObject();
      }));
      
      if (room) {
        if (room.use_local_asset && room.visible !== false) {
//setTimeout(elation.bind(this, function() {
        this.localasset = this.createObject('object', {
          id: room.use_local_asset,
          col: room.col,
          fwd: room.fwd,
          xdir: room.xdir,
          ydir: room.ydir,
          zdir: room.zdir
        });
//}), Math.random() * 500);
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

        if (room.cubemap_radiance_id) this.properties.cubemap_radiance_id = room.cubemap_radiance_id;
        if (room.cubemap_irradiance_id) this.properties.cubemap_irradiance_id = room.cubemap_irradiance_id;
    
        //this.setSkybox();

        this.properties.near_dist = parseFloat(room.near_dist) || 0.01;
        this.properties.far_dist = parseFloat(room.far_dist) || 1000;
        this.properties.fog = room.fog;
        this.properties.fog_mode = room.fog_mode || 'exp';
        this.properties.fog_density = room.fog_density;
        this.properties.fog_start = parseFloat(room.fog_start) || this.properties.near_dist;
        this.properties.fog_end = parseFloat(room.fog_end) || this.properties.far_dist;
        this.properties.fog_col = room.fog_col || room.fog_color;
        this.properties.bloom = room.bloom || 0.4;
        this.properties.gravity = room.gravity || -9.8;
        //if (room.col) this.properties.col = room.col;

        this.properties.walk_speed = room.walk_speed || 1.8;
        this.properties.run_speed = room.run_speed || 5.4;
        this.properties.cursor_visible = room.cursor_visible;
      }

      if (assets.scripts) {
        this.pendingScripts = 0;
        assets.scripts.forEach(elation.bind(this, function(s) {
          var script = elation.engine.assets.find('script', s.src);
          this.pendingScripts++;
          elation.events.add(script, 'asset_load', elation.bind(this, function() {
            document.head.appendChild(script);
            script.onload = elation.bind(this, this.doScriptOnload);
          }));
        }));
      }

      //if (!this.active) {
      //  this.setActive();
      //}
      //this.showDebug();
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
      this.engine.systems.ai.add(this);
      var keys = Object.keys(this.children);
      for (var i = 0; i < keys.length; i++) {
        var obj = this.children[keys[i]];
        if (obj.start) {
          obj.start();
        }
      }
      elation.events.fire({type: 'room_enable', data: this});
    }
    this.disable = function() {
      this.engine.systems.ai.remove(this);
      var keys = Object.keys(this.children);
      for (var i = 0; i < keys.length; i++) {
        var obj = this.children[keys[i]];
        if (obj.stop) {
          obj.stop();
        }
      }
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
      if (!edit) return;
      var keys = Object.keys(edit);
      var hasNew = false;

      var waslocked = this.locked;
      //this.locked = true;
      this.applyingEdits = true;
      var skip = ['sync'];
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
//console.log('GOT EDIT', editxml);
        for (var i = 0; i < newobjs.length; i++) {
          var newobj = newobjs[i],
              existing = this.jsobjects[newobj.js_id];
          this.appliedchanges[newobj.js_id] = true;
          if (existing) {
            //existing.setProperties(newobj);
            var objkeys = Object.keys(newobj);
            for (var j = 0; j < objkeys.length; j++) {
              if (skip.indexOf(objkeys[j]) == -1) {
                existing[objkeys[j]] = newobj[objkeys[j]];
              }
            }
          } else {
            hasNew = true;
            newobj.sync = false;
            diff[(k.toLowerCase() + 's')].push(newobj);
            if (newobj.id && newobj.id.match(/^https?:/)) {
              diff.assets.objects.push({assettype: 'model', name: newobj.id, src: newobj.id});
            }
            //console.log('create new!', newobj.js_id, newobj);
          }
        }
        if (hasNew) {
          //elation.engine.assets.loadJSON(diff.assets.objects, this.baseurl); 
          this.createRoomObjects(diff);
        }
      }));
      this.applyingEdits = false;
      setTimeout(elation.bind(this, function() {
        //this.locked = waslocked;
        //this.appliedchanges = {};
      }), 0);
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
    this.createObject = function(type, args) {
      var typemap = {
        'object': 'janusobject',
        'link': 'janusportal',
        'text': 'janustext',
        'paragraph': 'janusparagraph',
        'image': 'janusimage',
        'image3d': 'janusimage',
        'video': 'janusvideo',
        'sound': 'janussound',
        'light': 'januslight',
        'particle': 'janusparticle',
        'ghost': 'janusghost',
      };
      var realtype = typemap[type.toLowerCase()] || type;
      //var thingname = args.id + (args.js_id ? '_' + args.js_id : '_' + Math.round(Math.random() * 1000000));
      var thingname = args.js_id;
      var objectargs = {
        'room': this,
        'janus': this.properties.janus,
        'position': args.pos,
        'velocity': args.vel,
        'color': args.col,
        'pickable': true,
        'collidable': true
      };
/*
        'js_id': args.js_id,
        'scale': args.scale,
        'orientation': args.orientation,
        'visible': args.visible,
        'rotate_axis': args.rotate_axis,
        'rotate_deg_per_sec': args.rotate_deg_per_sec,
        fwd: args.fwd,
        xdir: args.xdir,
        ydir: args.ydir,
        zdir: args.zdir,
      };
*/
      elation.utils.merge(args, objectargs);

      switch (realtype) {
        case 'janusobject':
          elation.utils.merge({ 
            'janusid': args.id, 
          }, objectargs); 
          break;
        case 'janustext':
          elation.utils.merge({
            'text': args.text || args._content || ' ',
            'col': args.col, //(args.col ? new THREE.Color().setRGB(args.col[0], args.col[1], args.col[2]) : new THREE.Color(0xffffff)),
          }, objectargs);
          break;
        case 'janusportal':
          // If it's an absolute URL or we have a translator for this URL type, use the url unmodified.  Otherwise, treat it as relative
          if (args.url) {
            var linkurl = (args.url.match(/^(https?:)?\/\//) || this.getTranslator(args.url) ? args.url : this.baseurl + args.url);
            objectargs.url = linkurl;
          }
          objectargs.size = objectargs.scale;
          objectargs.scale = new THREE.Vector3(1,1,1);
          break;
        case 'janusimage':
          objectargs.image_id = args.id;
          break;
        case 'janussound':
          objectargs.sound_id = args.id;
          objectargs.distance = parseFloat(args.dist);
          //objectargs.volume = args.scale[0];
          break;
        case 'janusparticle':
          objectargs.particle_vel = args.vel;
          objectargs.particle_accel = args.accel;
          objectargs.particle_scale = args.scale;
          objectargs.vel = new THREE.Vector3();
          objectargs.accel = new THREE.Vector3();
          objectargs.scale = new THREE.Vector3(1,1,1);
          break;
        case 'janusghost':
          objectargs.ghost_id = args.id;
          objectargs.ghost_datasrc = args.id;
          //objectargs.ghost_scale = args.scale;
          //objectargs.scale = new THREE.Vector3(1,1,1);
          objectargs.orientation = new THREE.Quaternion()
          break;
      }
      //console.log('spawn it', realtype, args, objectargs);
      if (elation.engine.things[realtype]) {
        if (!objectargs.js_id) {
          objectargs.js_id = realtype + '_' + (objectargs.id ? objectargs.id + '_' : '') + window.uniqueId();
        }
        if (this.jsobjects[objectargs.js_id]) {
          objectargs.js_id = objectargs.js_id + '_' + window.uniqueId();
        }
        var object = this.spawn(realtype, objectargs.js_id, objectargs);
        if (objectargs.js_id) {
          this.jsobjects[objectargs.js_id] = object.getProxyObject();
        }

        if (realtype == 'janussound') {
          this.sounds[objectargs.js_id] = object;
        }
        if (realtype == 'janusportal') {
          elation.events.add(object, 'janusweb_portal_open', elation.bind(this, this.registerOpenPortal));
          elation.events.add(object, 'janusweb_portal_close', elation.bind(this, this.unregisterOpenPortal));
        }

        elation.events.add(object, 'thing_change_queued', elation.bind(this, this.onThingChange));
        elation.events.add(object, 'collide', elation.bind(this, this.onCollide));
        //elation.events.add(object, 'thing_asset_add', elation.bind(this, this.addAsset));

        return this.jsobjects[objectargs.js_id];
      } else {
        console.log('ERROR - unknown type: ', realtype);
      }
    }
    this.removeObject = function(obj) {
      var proxy = obj;
      if (elation.utils.isString(obj)) {
        proxy = this.jsobjects[obj];
      }
      if (proxy) {
        var obj = this.getObjectFromProxy(proxy);
        if (obj && obj.parent) {
          obj.parent.remove(obj);
        }
      }
    }
    this.addCookie = function(name, value) {
      this.cookies[name] = value;
    }
    this.doScriptOnload = function() {
      if (--this.pendingScripts <= 0) {
        elation.events.fire({type: 'janus_room_scriptload', element: this});
      }
    }
    this.playSound = function(name, properties) {
      if (!this.sounds[name]) {
        this.sounds[name] = this.createObject('Sound', {
          id: name
        });
      }
      if (this.sounds[name]) {
        if (properties) {
          for (var k in properties) {
            this.sounds[name][k] = properties[k];
          }
        }
        this.sounds[name].play();
      }
    }
    this.stopSound = function(name) {
      if (this.sounds[name]) {
        this.sounds[name].stop();
      }
    }
    this.seekSound = function(name, time) {
      if (this.sounds[name]) {
        this.sounds[name].seek(time);
      }
    }
    this.getAsset = function(type, id, assetargs) {
      if (!this.roomassets[type]) {
        this.roomassets[type] = {};
      }
      var asset = this.roomassets[type][id];
      if (!asset) {
        asset = elation.engine.assets.find(type, id, true);
        if (!asset) {
          var assetpack = { assettype:type, name:id, src: id, baseurl: this.baseurl }; 
          if (assetargs) {
            for (var k in assetargs) {
              assetpack[k] = assetargs[k];
            }
          }
          elation.engine.assets.get(assetpack, this.baseurl); 
          asset = elation.engine.assets.find(type, id, true);
        }
        this.roomassets[type][id] = asset;
        if (asset) {
          elation.events.fire({element: this, type: 'room_add_asset', data: asset});
          if (!asset.loaded) {
            this.pendingassets.push(asset);
            elation.events.add(asset, 'asset_load_complete,asset_error', elation.bind(this, this.assetLoaded, asset));
            elation.events.add(asset, 'asset_load_dependency', elation.bind(this, this.assetLoadDependency, asset));
          }
        }
      }
      return asset;
    }
    this.assetLoaded = function(asset) {
      var idx;
      while (idx !== -1) {
        idx = this.pendingassets.indexOf(asset);
        if (idx >= 0) {
          this.pendingassets.splice(idx, 1);
          if (this.pendingassets.length == 0) {
            setTimeout(elation.bind(this, function() {
              elation.events.fire({element: this, type: 'room_load_complete'});
            }), 0);
          }
        }
      }
    }
    this.assetLoadDependency = function(asset, ev) {
      var newasset = ev.data;
      var type = newasset.assettype;
      if (!this.roomassets[type]) {
        this.roomassets[type] = {};
      }
      this.roomassets[type][newasset.name] = newasset;
      elation.events.fire({element: this, type: 'room_add_asset', data: newasset});
      if (asset && !newasset.loaded) {
        this.pendingassets.push(newasset);
        elation.events.add(newasset, 'asset_load_complete,asset_error', elation.bind(this, this.assetLoaded, newasset));
        elation.events.add(newasset, 'asset_load_dependency', elation.bind(this, this.assetLoadDependency, newasset));
      }
    }
/*
    this.addAsset = function(ev) {
      var asset = ev.data;
      var type = asset.assettype;
      if (!this.roomassets[type]) this.roomassets[type] = {};

      if (!this.roomassets[type][asset.name]) {
        this.roomassets[type][asset.name] = asset;
        elation.events.fire({element: this, type: 'room_add_asset', data: ev.data});
      }
    }
*/
    this.onKeyDown = function(ev) { 
      elation.events.fire({type: 'janus_room_keydown', element: this, keyCode: ev.key.toUpperCase() });
    }
    this.onKeyUp = function(ev) { 
      elation.events.fire({type: 'janus_room_keyup', element: this, keyCode: ev.key.toUpperCase() });
    }
    this.onMouseDown = function(ev) { 
      elation.events.fire({type: 'janus_room_mousedown', element: this, event: ev});
    }
    this.onMouseUp = function(ev) { 
      elation.events.fire({type: 'janus_room_mouseup', element: this, event: ev});
    }
    this.onThingChange = function(ev) {
      var thing = ev.target;
      if (!this.applyingEdits && thing.js_id && this.jsobjects[thing.js_id]) {
        var proxy = this.jsobjects[thing.js_id];
        if (proxy.sync) {
          if (!this.appliedchanges[thing.js_id]) {
            this.changes[thing.js_id] = proxy;
          }
        }
      }
    }
    this.onRoomEdit = function(ev) {
      var thing = ev.data;
      if (thing && !this.applyingEdits && !this.appliedchanges[thing.js_id] && thing.js_id && this.jsobjects[thing.js_id]) {
        this.changes[thing.js_id] = this.jsobjects[thing.js_id];
      }
    }
    this.onScriptTick = function(ev) {
      this.engine.systems.world.scene['world-3d'].updateMatrix();
      this.engine.systems.world.scene['world-3d'].updateMatrixWorld();
/*
      for (var k in this.jsobjects) {
        var realobj = this.getObjectFromProxy(this.jsobjects[k]);
        if (realobj) {
          realobj.updateVectors(false);
        }
      }
*/
      this.janus.scriptframeargs[0] = ev.data.delta * 1000;
      elation.events.fire({element: this, type: 'janusweb_script_frame'});
      elation.events.fire({element: this, type: 'janusweb_script_frame_end'});
    }
    this.onCollide = function(ev) { 
      //console.log('objects collided', ev.target, ev.data.other);
      var obj1 = ev.target, obj2 = ev.data.other;

/*
      if (!this.collidercache[obj1.id][obj2.id]) {
        this.collidercache[obj1.id][obj2.id] = true;
        elation.events.fire({element: this, type: 'janus_room_collider_enter', data: obj2});
      }
*/

    }
    this.getObjectById = function(js_id) {
      return this.jsobjects[js_id];
    }
    this.openLink = function(js_id) {
      var link = this.jsobjects[js_id];
      if (link) {
        link.activate();
      }
    }
    this.getObjectFromProxy = function(proxy, children) {
      return proxy._target;
    }
    this.registerOpenPortal = function(ev) {
      var portal = ev.target;
      console.log('portal opened', ev);
      this.openportals.push(portal);

    }
    this.unregisterOpenPortal = function(ev) {
      var portal = ev.target;
      console.log('portal closed', ev);
      var idx = this.openportals.indexOf(portal);
      if (idx != -1) {
        this.openportals.splice(idx, 1);
      }
    }
    this.getVisiblePortals = function(portals) {
      if (typeof portals == 'undefined') {
        portals = [];
      }

      for (var i = 0; i < this.openportals.length; i++) {
        // TODO - apply frustum visibility check
        var portal = this.openportals[i];
        portals.push(portal);

        if (portal.portalroom) {
          portal.portalroom.getVisiblePortals(portals);
        }
      }
      return portals;
    }
    this.getActiveAssets = function() {
      var keys = Object.keys(this.jsobjects);
      var assets = {};
      for (var i = 0; i < keys.length; i++) {
        var obj = this.jsobjects[keys[i]]._target;
        obj.getActiveAssets(assets);
      }
      return assets;
    }
    this.updateLocalAsset = function() {
      if (this.localasset) {
        this.localasset.col = this.col;
      }
    }
    this.save = function() {
      var assets = [];
      for (var type in this.roomassets) {
        for (var name in this.roomassets[type]) {
          var asset = this.roomassets[type][name];
          if (asset) {
            assets.push(asset);
          }
        }
      }
      var urls = [this.url];
      for (var i = 0; i < assets.length; i++) {
        var url = assets[i].getFullURL();
        urls.push(url);
      }
      return urls;
    }
  }, elation.engine.things.generic);
});
