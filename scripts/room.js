elation.require([
    'ui.textarea', 'ui.window', 
     'engine.things.generic', 'engine.things.label', 'engine.things.skybox',
    'janusweb.object', 'janusweb.portal', 'janusweb.image', 'janusweb.video', 'janusweb.text', 'janusweb.janusparagraph',
    'janusweb.sound', 'janusweb.januslight', 'janusweb.janusparticle', 'janusweb.janusghost',
    'janusweb.translators.bookmarks', 'janusweb.translators.reddit', 'janusweb.translators.error', 'janusweb.translators.blank', 'janusweb.translators.default', 'janusweb.translators.dat'
  ], function() {
  elation.component.add('engine.things.janusroom', function() {
    this.postinit = function() {
      elation.engine.things.janusroom.extendclass.postinit.call(this);
      this.toneMappingTypes = {
        'none': THREE.NoToneMapping,
        'linear': THREE.LinearToneMapping,
        'reinhard': THREE.ReinhardToneMapping,
        'uncharted2': THREE.Uncharted2ToneMapping,
        'cineon': THREE.CineonToneMapping,
        'acesfilmic': THREE.ACESFilmicToneMapping,
      };
      this.defineProperties({
        'janus': { type: 'object' },
        'url': { type: 'string', default: false },
        'referrer': { type: 'string' },
        'deferload': { type: 'boolean', default: false },
        'roomid': { type: 'string' },
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
        'fog': { type: 'boolean', default: false, set: this.setFog },
        'fog_mode': { type: 'string', default: 'exp', set: this.setFog },
        'fog_density': { type: 'float', default: 1.0, set: this.setFog },
        'fog_start': { type: 'float', default: 0.0, set: this.setFog },
        'fog_end': { type: 'float', default: 100.0, set: this.setFog },
        'fog_col': { type: 'color', default: 0x000000, set: this.setFog },
        'ambient': { type: 'color', default: 0x666666, set: this.updateLights },
        'near_dist': { type: 'float', default: 0.01, set: this.setNearFar },
        'far_dist': { type: 'float', default: 1000.0, set: this.setNearFar },
        'pbr': { type: 'boolean', default: false },
        'toon': { type: 'boolean', default: false },
        'bloom': { type: 'float', default: 0.4, set: this.updateBloom },
        'tonemapping_type': { type: 'string', default: 'linear', set: this.updateToneMapping },
        'tonemapping_exposure': { type: 'float', default: 0.8, set: this.updateToneMapping },
        'tonemapping_whitepoint': { type: 'float', default: 1.0, set: this.updateToneMapping },
        'defaultlights': { type: 'bool', default: true, set: this.updateLights },
        'shadows': { type: 'bool', default: false, set: this.updateShadows },
        'party_mode': { type: 'bool', default: true },
        'walk_speed': { type: 'float', default: 1.0 },
        'run_speed': { type: 'float', default: 2.0 },
        'jump_velocity': { type: 'float', default: 5.0 },
        'flying': { type: 'boolean', default: true, set: this.updateFlying },
        'gravity': { type: 'float', default: 0, set: this.updateGravity },
        'teleport': { type: 'bool', default: true, set: this.updateTeleport },
        'locked': { type: 'bool', default: false },
        'cursor_visible': { type: 'bool', default: true },
        'use_local_asset': { type: 'string', set: this.updateLocalAsset },
        'col': { type: 'color', set: this.updateLocalAsset },
        'private': { type: 'bool', default: false },
        'server': { type: 'string' },
        'port': { type: 'int' },
        'rate': { type: 'int', default: 200 },
        'classList': { type: 'object', default: [] },
        'className': { type: 'string', default: '', set: this.setClassName },
        'gazetime': { type: 'float', default: 1000 },
        'selfavatar': { type: 'boolean', default: true },
        'onload': { type: 'string' },
      });
      this.translators = {
        '^about:blank$': elation.janusweb.translators.blank({janus: this.janus}),
        '^bookmarks$': elation.janusweb.translators.bookmarks({janus: this.janus}),
        '^dat:': elation.janusweb.translators.dat({janus: this.janus}),
        '^https?:\/\/(www\.)?reddit.com': elation.janusweb.translators.reddit({janus: this.janus}),
        '^error$': elation.janusweb.translators.error({janus: this.janus}),
        '^default$': elation.janusweb.translators.default({janus: this.janus})
      };
      this.spawnpoint = new THREE.Object3D();
      this.roomsrc = '';
      this.changes = {};
      this.deletions = [];
      this.appliedchanges = {};
      this.openportals = [];
      this.roomassets = {};
      this.pendingassets = [];
      this.jsobjects = {};
      this.cookies = {};
      this.websurfaces = {};
      this.ghosts = {};
      this.images = {};
      this.sounds = {};
      this.videos = {};
      this.loaded = false;
      this.completed = false;
      this.parseerror = false;

      this.roomscripts = [];
      this.customElements = {};
      this.unknownElements = {};
      this.eventlistenerproxies = {};

      // FIXME - binding functions to this instance so we can unbind events later.  Should be done at a lower level
      this.onRoomEdit = elation.bind(this, this.onRoomEdit);
      this.onClick = elation.bind(this, this.onClick);
      this.onKeyDown = elation.bind(this, this.onKeyDown);
      this.onKeyUp = elation.bind(this, this.onKeyUp);
      this.onObjectClick = elation.bind(this, this.onObjectClick);
      this.onMouseDown = elation.bind(this, this.onMouseDown);
      this.onMouseUp = elation.bind(this, this.onMouseUp);
      this.onMouseMove = elation.bind(this, this.onMouseMove);
      this.onScriptTick = elation.bind(this, this.onScriptTick);

      this.roomedit = {
        snap: .01,
        modes: ['pos', 'rotation', 'scale', 'col'],
        movespeed: new THREE.Vector3(),
        modeid: 0,
        object: false,
        distancescale: 1
      };

      if (this.url) {
        this.roomid = md5(this.url);
        if (!this.deferload) {
          this.load(this.url, this.baseurl);
        }
      } else if (this.source) {
        this.loadFromSource(this.source);
      }
    }
    this.createChildren = function() {
      this.createLights();
      //this.setCollider('sphere', {radius: 1e4});

      this.objects['3d'].add(this.spawnpoint);

      this.lastthink = 0;
      this.thinktime = 0;
    }
    this.createLights = function() {
      this.roomlights = {
        ambient: this.spawn('light_ambient', this.id + '_ambient', {
          color: this.properties.ambient._target
        }),
        directional: this.spawn('light_directional', this.id + '_sun', {
          position: [-20,50,25],
          intensity: 0.1
        }),
        point: this.spawn('light_point', this.id + '_point', {
          position: [22,19,-15],
          intensity: 0.1
        })
      };
    }
    this.updateLights = function() {
      if (!this.roomlights) {
        this.createLights();
      }
      if (!this.objects['3d']) return;
      this.roomlights.ambient.lightobj.color = this.ambient._target;
      if (this.defaultlights) {
        if (this.roomlights.directional.parent != this) {
          this.add(this.roomlights.directional);
        }
        if (this.roomlights.point.parent != this) {
          this.add(this.roomlights.point);
        }
      } else {
        if (this.roomlights.directional.parent) {
          this.roomlights.directional.parent.remove(this.roomlights.directional);
        }
        if (this.roomlights.point.parent) {
          this.roomlights.point.parent.remove(this.roomlights.point);
        }
      }
    }
    this.setActive = function() {
      this.setSkybox();
      this.setFog();
      this.updateBloom();
      this.updateToneMapping();
      this.setNearFar();
      this.setPlayerPosition();
      this.active = true;
      elation.events.fire({element: this, type: 'room_active', data: this});
    }
    this.setPlayerPosition = function(pos, orientation) {
      if (!pos) {
        pos = this.spawnpoint.position;
        orientation = this.spawnpoint.quaternion;
      }
      var player = this.engine.client.player;
      this.appendChild(player);
      player.reset_position();
      player.properties.movestrength = 80 * this.properties.walk_speed;
      player.properties.runstrength = 80 * this.properties.run_speed;
      player.cursor_visible = elation.utils.any(this.cursor_visible, true);
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
/*
        this.skyboxcollider = this.createObject('object', {
          js_id: 'room_skybox',
          collision_id: 'cube',
          collision_scale: V(1000),
          collision_trigger: true
        });
*/
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
        var skyboxname = 'dayskybox';
        var assets = [
          this.getAsset('image', skyboxname + '_right'),
          this.getAsset('image', skyboxname + '_left'),
          this.getAsset('image', skyboxname + '_up'),
          this.getAsset('image', skyboxname + '_down'),
          this.getAsset('image', skyboxname + '_front'),
          this.getAsset('image', skyboxname + '_back')
        ];
      }
      // TODO - THREE.DDSLoader only supports compressed DDS textures, but JanusVR sends uncompressed RGBA888 (I think)
      /* 
      if (this.cubemap_irradiance_id) {
        var asset = this.getAsset('image', this.cubemap_irradiance_id);
        console.log('irradiance', this.cubemap_irradiance_id, asset);
      }
      
      if (this.cubemap_radiance_id) {
        var asset = this.getAsset('image', this.cubemap_radiance_id);
        console.log('radiance', this.cubemap_radiance_id, asset);
      }
      */

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
            // flip skybox 180 degrees
            if (images[i] instanceof HTMLCanvasElement) {
              var ctx = images[i].getContext('2d');
              if (i == 2 || i == 3) { // Y+ or Y-
                // Y+
                ctx.translate(images[i].width/2, images[i].height/2);
                ctx.rotate(Math.PI);
                ctx.translate(-images[i].width/2, -images[i].height/2);
              }
              ctx.drawImage(images[i],0,0,images[i].width,images[i].height);
            }
          }
        }
        if (images[0] && images[1] && images[2] && images[3] && images[4] && images[5]) {
          // flip skybox 180 degrees
          images = [images[1],images[0],images[2],images[3],images[5],images[4]];
          var texture = new THREE.CubeTexture( images );
          texture.needsUpdate = true;
          this.skyboxtexture = texture;
          if (this.janus.currentroom === this) {
            this.skybox.setTexture(this.skyboxtexture);
          }
          return true;
        }
      }
    }
    this.setFog = function() {
      if (this.fog) {
        var fogcol = this.properties.fog_col || 0;
        var fogcolor = new THREE.Color();
        if (fogcol[0] == '#') {
          fogcolor.setHex(parseInt(fogcol.substr(1), 16));
        } else if (elation.utils.isString(fogcol) && fogcol.indexOf(' ') != -1) {
          var rgb = fogcol.split(' ');
          fogcolor.setRGB(rgb[0], rgb[1], rgb[2]);
        } else if (fogcol instanceof THREE.Color) {
          fogcolor.copy(fogcol);
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
    this.updateToneMapping = function() {
      this.engine.systems.render.renderer.toneMapping = this.toneMappingTypes[this.tonemapping_type] || 0;
      this.engine.systems.render.renderer.toneMappingExposure = this.tonemapping_exposure;
      this.engine.systems.render.renderer.toneMappingWhitePoint = this.tonemapping_whitepoint;
      this.refresh();
    }
    this.setNearFar = function() {
      this.engine.client.player.camera.camera.near = this.properties.near_dist;
      this.engine.client.player.camera.camera.far = this.properties.far_dist;
    }
    this.showDebug = function() {
      this.engine.client.player.disable();
      if (!this.debugwindow) {
        var content = elation.ui.panel_vertical({classname: 'janusweb_room_debug'});

        this.debugwindow = elation.ui.window({title: 'Janus Room', content: content, append: document.body, center: true});
        this.debugeditor = elation.ui.textarea({append: content, value: this.roomsrc, classname: 'janusweb_room_source'});
        this.debugwindow.settitle(this.properties.url);

        var updatebutton = elation.ui.button({label: 'Update'});
        var buttons = elation.ui.buttonbar({
          classname: 'janusweb_room_debug_buttons',
          append: content,
          buttons: {
            update: updatebutton
          }
        });

        this.debugwindow.setcontent(content);

        elation.events.add(this.debugeditor, 'change', elation.bind(this, this.handleEditorInput));
        elation.events.add(updatebutton, 'click', elation.bind(this, this.handleEditorUpdate));
      }

      //elation.ui.content({append: content, content: this.properties.url, classname: 'janusweb_room_url'});
      this.debugwindow.show();
      this.debugwindow.center();
    }
    this.load = function(url, baseurloverride) {
      if (!url) {
        url = this.properties.url;
      } else {
        this.properties.url = url;
      }
      var baseurl = baseurloverride;
      if (!baseurl) {
        if (url && !this.baseurl) {
          baseurl = url.split('/');
          if (baseurl.length > 3) baseurl.pop();
          baseurl = baseurl.join('/') + '/';
          this.baseurl = baseurl;
        }
      } else {
        this.baseurl = baseurl;
      }

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
      } else if (!fullurl.match(/^https?:\/\/(localhost|127\.0\.0\.1)/)) {
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
                      if (objs.room.title) {
                        this.setTitle(objs.room.title);
                      }
                      this.roomsrc = objs.source;
                      this.loadRoomAssets(objs);
                      this.createRoomObjects(objs);
                      this.loaded = true;
                      this.setActive();
                      elation.events.fire({element: this, type: 'room_load_processed'});
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
                      .then(elation.bind(this, function(objs) {
                        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
                        var assetpath = datapath + 'assets/translator/errors/';
                        this.baseurl = assetpath;
                        this.loadRoomAssets(objs);
                        this.createRoomObjects(objs);
                        this.enable();
                        this.setActive();
                      }));
            
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
        try {
          var roomdata = this.janus.parser.parse(source.source, this.baseurl, datapath);
          resolve(true);
        } catch (e) {
          reject();
        }
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
        try {
          var roomdata = this.janus.parser.parse(source.source, this.baseurl, datapath);
          this.loadRoomAssets(roomdata);
          this.createRoomObjects(roomdata);
          this.loaded = true;
          if (this.active) {
            this.setActive();
          }
          //this.parseerror = false;
          elation.events.fire({element: this, type: 'room_load_processed'});
          elation.events.fire({type: 'janus_room_load', element: this});
        } catch (e) {
          console.error('Janus room parse error:', e.message);
          this.parseerror = e.message;
          elation.events.fire({type: 'room_load_error', element: this, data: e.message});
        }
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
                      elation.events.fire({element: this, type: 'room_load_processed'});
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
        var assetlist = roomdata.assets.assetlist;
        if (roomdata.assets.websurfaces) {
          elation.utils.merge(roomdata.assets.websurfaces, this.websurfaces);
        }

        if (roomdata.assets.ghosts) {
          var ghosts = roomdata.assets.ghosts;
          for (var i = 0; i < ghosts.length; i++) {
            var ghost = ghosts[i];
            this.ghosts[ghost.id] = ghost;
            assetlist.push({
              assettype: 'file',
              name: ghost.id,
              src: ghost.src
            });
          }
          //elation.utils.merge(roomdata.assets.ghosts, this.ghosts);
        }
        if (roomdata.assets.shaders) {
          let shaders = roomdata.assets.shaders;
          for (var i = 0; i < shaders.length; i++) {
            if (shaders[i].uniforms) {
              //shaders[i].uniforms = this.parseShaderUniforms(shaders[i].uniforms);
            }
          }
        }
        //this.assetpack = elation.engine.assets.loadJSON(assetlist, this.baseurl);
        if (!this.assetpack) {
          this.assetpack = new elation.engine.assets.pack({name: this.id + '_assets', baseurl: this.baseurl, json: assetlist});
        } else {
          this.assetpack.loadJSON(assetlist);
        }
      }
    }
    this.clear = function() {
      for (var k in this.children) {
        this.remove(this.children[k]);
      }
      this.createLights();
    }
    this.createRoomObjects = function(roomdata, parent) {
      var room = roomdata.room,
          assets = roomdata.assets || [];

      // Prevent our loads from echoing back to the server as edits
      this.applyingEdits = true;

      // Parse room objects from the XML, and create Janus objects for them
      var exclude = ['assets', 'room', 'source'];
      for (var k in roomdata) {
        if (exclude.indexOf(k) == -1) {
          roomdata[k].forEach(elation.bind(this, function(n) {
            this.createObject(k, n, parent);
          }));
        }
      }
      
      if (room && !parent) {
        if (room.use_local_asset && room.visible !== false) {
//setTimeout(elation.bind(this, function() {
        var collisionid = room.use_local_asset + '_collision',
            collisionscale = V(1,1,1);
        if (room.use_local_asset == 'room_plane') {
          collisionid = 'cube';
          collisionscale.set(1000,.1,1000);
        }
        this.localasset = this.createObject('object', {
          id: room.use_local_asset,
          collision_id: collisionid,
          collision_scale: collisionscale,
          col: room.col,
          fwd: room.fwd,
          xdir: room.xdir,
          ydir: room.ydir,
          zdir: room.zdir,
          shadows: true
        });
//}), Math.random() * 500);
        }
        // set player spawnpoint based on room info
        if (room.pos) {
          this.spawnpoint.position.fromArray(room.pos);
        }
        if (room.xdir || room.ydir || room.zdir) {
          room.orientation = this.janus.parser.getOrientation(room.xdir, room.ydir, room.zdir);
        }

        if (room.orientation) {
          this.spawnpoint.quaternion.copy(room.orientation);
          this.spawnpoint.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0))); // Janus Native starts the player backwards
          this.spawnpoint.updateMatrixWorld();
        }

        // If we have a referrer, check to see if a reciprocal link exists.  If it does, use this as our spawn point.
        if (roomdata.link && this.referrer) {
          roomdata.link.forEach(link => {
            if (link.url == this.referrer) {
              this.spawnpoint.quaternion.copy(link.orientation.inverse());
              this.spawnpoint.position.fromArray(link.pos);
              this.spawnpoint.position.add(this.spawnpoint.localToWorld(V(0,0,-player.fatness)));
            }
          });
        }

        if (room.skybox_left_id) this.properties.skybox_left = room.skybox_left_id;
        if (room.skybox_right_id) this.properties.skybox_right = room.skybox_right_id;
        if (room.skybox_up_id) this.properties.skybox_up = room.skybox_up_id;
        if (room.skybox_down_id) this.properties.skybox_down = room.skybox_down_id;
        if (room.skybox_front_id) this.properties.skybox_front = room.skybox_front_id;
        if (room.skybox_back_id) this.properties.skybox_back = room.skybox_back_id;

        if (room.cubemap_radiance_id) this.properties.cubemap_radiance_id = room.cubemap_radiance_id;
        if (room.cubemap_irradiance_id) this.properties.cubemap_irradiance_id = room.cubemap_irradiance_id;
    
        //this.setSkybox();

        if (room.server) this.properties.server = room.server;
        if (room.port) this.properties.port = room.port;
        if (room.rate) this.properties.rate = room.rate;
        if (room.gazetime) this.properties.gazetime = room.gazetime;
        if (typeof room.pbr != 'undefined') this.properties.pbr = room.pbr;
        if (typeof room.toon != 'undefined') this.properties.toon = room.toon;
        if (typeof room.ambient != 'undefined') this.ambient = room.ambient;
        if (typeof room.defaultlights != 'undefined') this.defaultlights = room.defaultlights;
        if (typeof room.selfavatar != 'undefined') this.properties.selfavatar = room.selfavatar;

        this.properties.near_dist = parseFloat(room.near_dist) || 0.01;
        this.properties.far_dist = parseFloat(room.far_dist) || 1000;
        this.properties.fog = room.fog;
        this.properties.private = room.private;
        this.properties.fog_mode = room.fog_mode || 'exp';
        this.properties.fog_density = room.fog_density;
        this.properties.fog_start = parseFloat(room.fog_start) || this.properties.near_dist;
        this.properties.fog_end = parseFloat(room.fog_end) || this.properties.far_dist;
        this.fog_col = room.fog_col || room.fog_color;
        this.properties.bloom = room.bloom || 0.4;
        this.properties.tonemapping_type = room.tonemapping_type || 'linear';
        this.properties.tonemapping_exposure = room.tonemapping_exposure || this.tonemapping_exposure;
        this.properties.tonemapping_whitepoint = room.tonemapping_whitepoint || this.tonemapping_whitepoint;
        this.properties.shadows = elation.utils.any(room.shadows, false);
        this.properties.party_mode = elation.utils.any(room.party_mode, true);
        this.properties.locked = room.locked;
        this.gravity = elation.utils.any(room.gravity, 0);
        this.flying = elation.utils.any(room.flying, true);
        this.teleport = elation.utils.any(room.teleport, true);
        //if (room.col) this.properties.col = room.col;

        this.properties.walk_speed = room.walk_speed || 1.8;
        this.properties.run_speed = room.run_speed || 5.4;
        this.properties.cursor_visible = room.cursor_visible;

        if (room.onload) {
          this.properties.onload = room.onload;
          this.addEventListenerProxy('room_load_complete', (ev) => { let func = new Function(room.onload); func();});
        }

        if (assets.scripts) {
          this.pendingScripts = 0;
          this.loadScripts(assets.scripts);
        }
        if (room.require) {
          let roomproxy = this.getProxyObject();
          roomproxy.require(room.require);
        }
      }
      this.applyingEdits = false;

      //if (!this.active) {
      //  this.setActive();
      //}
      //this.showDebug();
    }
    this.loadScripts = function(scripts) {
      scripts.forEach(elation.bind(this, function(s) {
        var script = elation.engine.assets.find('script', s.src);
        this.pendingScripts++;

        if (script._loaded) {
          // If the script is already part of the document, remove it and readd it so it's reevaluated
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }

          var oldscript = script;
          script = document.createElement('script');
          script.src = oldscript.src;
          document.head.appendChild(script);
        }
        this.roomscripts.push(script);
        elation.events.add(script, 'asset_load', elation.bind(this, function() {
          script._loaded = true;
          document.head.appendChild(script);
          script.onload = elation.bind(this, this.doScriptOnload);
        }));
      }));
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
      var keys = Object.keys(this.children);
      for (var i = 0; i < keys.length; i++) {
        var obj = this.children[keys[i]];
        if (obj.start) {
          obj.start();
        }
      }
      if (!this.enabled) {
        this.enabled = true;
        this.engine.systems.ai.add(this);

        elation.events.add(window, 'click', this.onClick);
        elation.events.add(window, 'keydown', this.onKeyDown);
        elation.events.add(window, 'keyup', this.onKeyUp);
        elation.events.add(this.engine.client.container, 'mousedown,touchstart', this.onMouseDown);
        elation.events.add(this.engine.client.container, 'mouseup,touchend', this.onMouseUp);
        elation.events.add(this.engine.client.container, 'mousemove', this.onMouseMove);
        elation.events.add(this, 'click', this.onObjectClick);
/*
        elation.events.add(this, 'dragenter', this.handleDragOver);
        elation.events.add(this, 'dragover', this.handleDragOver);
        elation.events.add(this, 'drop', this.handleDrop);
*/
        elation.events.add(this, 'thing_think', this.onScriptTick);

        elation.events.fire({type: 'room_enable', data: this});
      }
      if (this.engine.systems.admin) {
        elation.events.add(this.engine.systems.admin, 'admin_edit_change', elation.bind(this, this.onRoomEdit));
      }
      //this.showDebug();
    }
    this.disable = function() {
      var keys = Object.keys(this.children);
      for (var i = 0; i < keys.length; i++) {
        var obj = this.children[keys[i]];
        if (obj.stop) {
          obj.stop();
        }
      }
      if (this.enabled) {
        this.engine.systems.ai.remove(this);
        elation.events.fire({type: 'room_disable', data: this});
        this.enabled = false;

        elation.events.remove(this, 'thing_think', this.onScriptTick);
        elation.events.remove(window, 'click', this.onClick);
        elation.events.remove(window, 'keydown', this.onKeyDown);
        elation.events.remove(window, 'keyup', this.onKeyUp);
        elation.events.remove(this.engine.client.container, 'mousedown,touchstart', this.onMouseDown);
        elation.events.remove(this.engine.client.container, 'mouseup,touchend', this.onMouseUp);
        elation.events.remove(this, 'click', this.onObjectClick);
        elation.events.remove(this, 'dragover', this.handleDragOver);
        elation.events.remove(this, 'dragenter', this.handleDragOver);
        elation.events.remove(this, 'drop', this.handleDrop);
      }
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
            assetlist: [],
          },
          object: [],
          image: [],
          image3d: [],
          link: [],
          video: [],
          sound: [],
          text: [],
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
            // If the node has a _content attribute, determine the attribute name by looking at the tag name
            if (newobj._content) {
              var attrname = k.toLowerCase();
              existing[attrname] = newobj._content;
            }
            existing.dispatchEvent({type: 'room_edit'});
            existing.sync = false;
          } else {
            hasNew = true;
            var k = k.toLowerCase();
            if (k.indexOf('asset') == 0) {
              var type = k.substr(5);
              this.loadNewAsset(type, newobj);
            } else {
              if (!diff[k]) diff[k] = [];
              diff[k].push(newobj);
              if (newobj.id && newobj.id.match(/^https?:/)) {
                diff.assets.assetlist.push({assettype: 'model', name: newobj.id, src: newobj.id});
              }
            }
            //console.log('create new!', newobj.js_id, newobj);
          }
        }
        if (hasNew) {
          //elation.engine.assets.loadJSON(diff.assets.objects, this.baseurl);
          this.createRoomObjects(diff);
        }
      }));
      // Clear the list of edits which have been applied this frame
      this.applyingEdits = false;
      this.appliedchanges = {};

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
    this.createObject = function(type, args, parent, skipstart) {
      var customElement = false;
      type = type.toLowerCase();
      var customElement = this.getCustomElement(type);

      //var typemap = this.janus.typemap;
      //var classmap = this.janus.classmap;
      if (!args) args = {};

      var parentobj = (parent ? parent._target || parent : this);
      if (!customElement) {
        if (!this.unknownElements[type]) this.unknownElements[type] = [];
        this.unknownElements[type].push({args: args, parent: parent});
        return;
      }
      var realtype = customElement.classname; //typemap[type.toLowerCase()] || type;
      //var thingname = args.id + (args.js_id ? '_' + args.js_id : '_' + Math.round(Math.random() * 1000000));
      var thingname = args.js_id;
      var objectargs = {
        'room': this,
        'janus': this.properties.janus,
        'js_id': args.js_id,
        'position': args.pos,
        'velocity': args.vel,
        'color': args.col,
        'pickable': true,
        'collidable': true,
        'parent': parentobj,
        'shadows': args.shadows || this.shadows
      };
      if (!args.pos) {
        args.pos = [0,0,0];
        objectargs.position = [0,0,0];
        objectargs.hasposition = false;
      }
      elation.utils.merge(args, objectargs);

      objectargs.tag = type.toUpperCase();

      if (objectargs.class) {
        objectargs.className = objectargs.class;
        delete objectargs.class;
      }

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
        case 'janusparagraph':
          elation.utils.merge({
            'text': args.text || args._content || '',
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
          objectargs.particle_vel = V(args.vel);
          objectargs.particle_accel = args.accel;
          objectargs.particle_scale = args.scale;
          objectargs.vel = new THREE.Vector3();
          objectargs.accel = new THREE.Vector3();
          objectargs.scale = new THREE.Vector3(1,1,1);
          break;
        case 'janusghost':
          objectargs.ghost_id = args.id;
          //objectargs.ghost_scale = args.scale;
          //objectargs.scale = new THREE.Vector3(1,1,1);
          objectargs.orientation = new THREE.Quaternion()
          break;
      }
      //console.log('spawn it', realtype, args, objectargs);
      if (!elation.engine.things[realtype]) {
        console.log('ERROR - unknown type: ', realtype);
        realtype = 'janusobject';
      }
      if (!objectargs.js_id) {
        objectargs.js_id = realtype + '_' + (objectargs.id ? objectargs.id + '_' : '') + window.uniqueId();
      }
      if (this.jsobjects[objectargs.js_id]) {
        objectargs.js_id = objectargs.js_id + '_' + window.uniqueId();
      }
      var object = parentobj.spawn(realtype, objectargs.js_id, objectargs);
      if (objectargs.js_id) {
        this.jsobjects[objectargs.js_id] = object.getProxyObject(customElement);
      }

      if (realtype == 'janussound') {
        this.sounds[objectargs.sound_id] = object;
        this.sounds[objectargs.js_id] = object;
      }
      if (realtype == 'janusvideo') {
        this.videos[objectargs.video_id] = object;
        elation.events.add(object, 'janusweb_video_change', elation.bind(this, function() {
          this.videos[object.video_id] = object;
        }));
      }
      if (realtype == 'janusportal') {
        elation.events.add(object, 'janusweb_portal_open', elation.bind(this, this.registerOpenPortal));
        elation.events.add(object, 'janusweb_portal_close', elation.bind(this, this.unregisterOpenPortal));
      }

      elation.events.add(object, 'thing_change_queued', elation.bind(this, this.onThingChange));
      elation.events.add(object, 'collide', elation.bind(this, this.onCollide));
      //elation.events.add(object, 'thing_asset_add', elation.bind(this, this.addAsset));

      if (args._children) {
        var children = {};
        for (var k in args._children) {
          var objs = args._children[k];
          if (!elation.utils.isArray(objs)) {
            objs = [objs];
          }
          children[k] = objs;
        }
        this.createRoomObjects(children, this.jsobjects[objectargs.js_id]);
      }

      if (this.enabled && !skipstart) {
        object.start();
      }

      return this.jsobjects[objectargs.js_id];
    }
    this.appendChild = function(obj) {
      var proxyobj = obj
      if (elation.utils.isString(obj)) {
        proxyobj = this.jsobjects[obj];
      }
      if (proxyobj) {
        if (proxyobj.parent && typeof proxyobj.parent.removeChild == 'function') {
          proxyobj.parent.removeChild(proxyobj);
        }
        //var realobj = this.room.getObjectFromProxy(proxyobj);
        var realobj = proxyobj._target;
        if (realobj) {
          realobj.room = this;
          this.add(realobj);
          if (typeof obj.start == 'function') {
            obj.start();
          }
        }
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
          if (typeof obj.stop == 'function') {
            obj.stop();
          }
          obj.parent.remove(obj);
          obj.room = false;
          if (obj.js_id && this.jsobjects[obj.js_id]) {
            delete this.jsobjects[obj.js_id];
          }
        }
      }
    }
    this.loadNewAsset = function(type, args) {
      type = type.toLowerCase();
      args = args || {};

      var assetlist = [];
      if (type == 'image') {
        if (args.src) {
          var src = (args.src.match(/^file:/) ? args.src.replace(/^file:/, datapath) : args.src);
          let assetargs = {
            assettype:'image',
            name:args.id,
            src: src,
            texture: args.texture,
            tex_linear: args.tex_linear,
            sbs3d: args.sbs3d,
            ou3d: args.ou3d,
            reverse3d: args.reverse3d,
            hasalpha: args.hasalpha,
            maxsize: args.maxsize,
            preload: args.preload,
            baseurl: this.baseurl
          };
          assetlist.push(assetargs);
        } else if (args.canvas) {
          assetlist.push({ assettype:'image', name:args.id, canvas: args.canvas, tex_linear: args.tex_linear, hasalpha: args.hasalpha, baseurl: this.baseurl });
        } else if (args.texture) {
          assetlist.push({
            assettype:'image',
            name:args.id,
            texture: args.texture,
            tex_linear: args.tex_linear,
            hasalpha: args.hasalpha,
            baseurl: this.baseurl
          });
        }
      } else if (type == 'video') {
        var src = (args.src.match(/^file:/) ? args.src.replace(/^file:/, datapath) : args.src);
        assetlist.push({
          assettype:'video',
          name:args.id,
          src: src,
          loop: args.loop,
          sbs3d: args.sbs3d,
          ou3d: args.ou3d,
          auto_play: args.auto_play,
          baseurl: this.baseurl
        });
      } else if (type == 'sound') {
        var src = (args.src.match(/^file:/) ? args.src.replace(/^file:/, datapath) : args.src);
        assetlist.push({
          assettype:'sound',
          name:args.id,
          src: src,
          baseurl: this.baseurl
        });
      } else if (type == 'websurface') {
        if (args.id) {
          this.websurfaces[args.id] = args;
        }
      } else if (type == 'script') {
        var src = (args.src.match(/^file:/) ? args.src.replace(/^file:/, datapath) : args.src);
        assetlist.push({
          assettype:'script',
          name: src,
          src: src,
          baseurl: this.baseurl
        });
      } else if (type == 'object' || type == 'model') {
        var src, mtlsrc, srcparts = [];
        if (args.src) {
          src = (args.src.match(/^file:/) ? args.src.replace(/^file:/, datapath) : args.src);
          mtlsrc = (args.mtl && args.mtl.match(/^file:/) ? args.mtl.replace(/^file:/, datapath) : args.mtl);
          if (mtlsrc && !mtlsrc.match(/^(https?:)?\/\//)) mtlsrc = this.baseurl + mtlsrc;
          srcparts = src.split(' ');
          src = srcparts[0];
        }
        let object = args.object;
        if (args.mesh_verts) {
          let geo = new THREE.BufferGeometry();
          geo.addAttribute( 'position', new THREE.Float32BufferAttribute( args.mesh_verts, 3 ) );
          if (args.mesh_faces) {
            geo.setIndex(args.mesh_faces);
          }
          if (args.mesh_normals) {
            geo.addAttribute( 'normal', new THREE.Float32BufferAttribute( args.mesh_normals, 3 ) );
          }
          if (args.mesh_uvs) {
            geo.addAttribute( 'uv', new THREE.Float32BufferAttribute( args.mesh_uvs, 2 ) );
          }
          object = new THREE.Mesh(geo, new THREE.MeshPhongMaterial());
        }
        assetlist.push({
          assettype: 'model',
          name: args.id,
          src: src,
          mtl: mtlsrc,
          object: object,
          tex_linear: args.tex_linear,
          tex0: args.tex || args.tex0 || srcparts[1],
          tex1: args.tex1 || srcparts[2],
          tex2: args.tex2 || srcparts[3],
          tex3: args.tex3 || srcparts[4]
        });
      } else if (type == 'ghost') {
        var src = (args.src.match(/^file:/) ? args.src.replace(/^file:/, datapath) : args.src);
        assetlist.push({
          assettype:'ghost',
          name: args.id,
          src: src,
          baseurl: this.baseurl
        });
      } else if (type == 'shader') {
        assetlist.push({
          assettype: 'shader',
          name: args.id,
          fragment_src: args.src,
          vertex_src: args.vertex_src,
          uniforms: args.uniforms,
        });
      }

      this.loadRoomAssets({
        assets: {
          assetlist: assetlist
        }
      });
    }
    this.parseShaderUniforms = function(uniformlist) {
      let uniforms = {};
      if (uniformlist) {
        uniformlist.forEach(u => {
          if (!u.name) {
            console.warn('Shader uniform specified without name', u, this);
            return;
          }
          if (!u.type) {
            console.warn('Shader uniform specified without type', u, this);
            return;
          }
          if (u.type == 'sampler2D') {
            let imgasset = this.getAsset('image', u.value);
            if (imgasset) {
              let texture = imgasset.getInstance();
              uniforms[u.name] = { value: texture };
            }
          } else if (u.type == 'vec2' || u.type == 'vec3' || u.type == 'vec4') {
            let values = this.janus.parser.getVectorValue(u.value);
            uniforms[u.name] = { value: V.apply(null, values) };
          } else {
            uniforms[u.name] = { value: u.value };
          }
        });
      }
      return uniforms;
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
        if (this.sounds[name].playing) {
          this.sounds[name].stop();
          this.sounds[name].seek(0);
        }
        this.sounds[name].play();
      }
    }
    this.pauseSound = function(name) {
      if (this.sounds[name]) {
        this.sounds[name].pause();
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
    this.playVideo = function(name, properties) {
      if (!this.videos[name]) {
        this.videos[name] = this.createObject('Video', {
          id: name
        });
      }
      if (this.videos[name]) {
        if (properties) {
          for (var k in properties) {
            this.videos[name][k] = properties[k];
          }
        }
        this.videos[name].play();
      }
    }
    this.pauseVideo = function(name) {
      if (this.videos[name]) {
        this.videos[name].pause();
      }
    }
    this.stopVideo = function(name) {
      if (this.videos[name]) {
        this.videos[name].pause();
      }
    }
    this.seekVideo = function(name, time) {
      if (this.videos[name]) {
        this.videos[name].seek(time);
      }
    }
    this.getAsset = function(type, id, assetargs) {
      if (!this.roomassets[type]) {
        this.roomassets[type] = {};
      }
      var realtype = type;
      if (type == 'ghost') {
        // Use a simple file dependency for ghosts
        realtype = 'file';
      }
      var asset;
      if (this.assetpack) {
        asset = this.assetpack.get(realtype, id, assetargs); ////this.roomassets[type][id];
      }
      if (!asset) {
        asset = this.janus.getAsset(realtype, id, assetargs);
      }
      if (asset) {
        if (!this.roomassets[type][id]) {
          this.roomassets[type][id] = asset;

          elation.events.fire({element: this, type: 'room_add_asset', data: asset});
          if (!asset.loaded && asset.assettype != 'sound') { // FIXME - skip load tracking for sounds, the engine should be handling this
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
            this.applyingEdits = false;
            setTimeout(elation.bind(this, function() {
              this.completed = true;
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
      elation.events.fire({type: 'janus_room_keydown', element: this, keyCode: ev.key.toUpperCase(), event: ev});
    }
    this.onKeyUp = function(ev) { 
      elation.events.fire({type: 'janus_room_keyup', element: this, keyCode: ev.key.toUpperCase(), event: ev });
    }
    this.onMouseDown = function(ev) { 
      elation.events.fire({type: 'janus_room_mousedown', element: this, event: ev});
      if (ev.button == 0) {
        this.buttonPressed = true;
      }
    }
    this.onMouseUp = function(ev) { 
      elation.events.fire({type: 'janus_room_mouseup', element: this, event: ev});
      if (ev.button == 0) {
        this.buttonPressed = false;
      }
    }
    this.onMouseMove = function(ev) { 
      elation.events.fire({type: 'janus_room_mousemove', element: this, event: ev});
      if (this.buttonPressed) {
        elation.events.fire({type: 'janus_room_mousedrag', element: this, event: ev});
      }
    }
    this.onClick = function(ev) {
      if (!this.firsttouch) {
        this.firsttouch = true;
        this.enable();
      }
    }
    this.onThingChange = function(ev) {
      var thing = ev.target;
      if (!this.applyingEdits && thing.js_id && this.jsobjects[thing.js_id]) {
        var proxy = this.jsobjects[thing.js_id];
        if (proxy.sync) {
          if (!this.appliedchanges[thing.js_id]) {
            this.changes[thing.js_id] = proxy;
          }
          proxy.sync = false;
        }
      }
    }
    this.onThingRemove = function(ev) {
      var thing = ev.target;
      if (!this.applyingEdits && thing.js_id && this.jsobjects[thing.js_id]) {
        var proxy = this.jsobjects[thing.js_id];
        if (proxy.sync) {
          if (!this.appliedchanges[thing.js_id]) {
            this.deletions.push(proxy);
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
      elation.events.fire({element: this, type: 'janusweb_script_frame', data: ev.data.delta});
      elation.events.fire({element: this, type: 'janusweb_script_frame_end', data: ev.data.delta});
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
    this.getObjectsByClassName = function(classname) {
      var objects = [];
      for (var k in this.jsobjects) {
        if (this.jsobjects[k].hasClass(classname)) {
          objects.push(this.jsobjects[k]);
        }
      }
      return objects;
    }
    this.getObjectsByTagName = function(tagname) {
      var objects = [];
      for (var k in this.jsobjects) {
        if (this.jsobjects[k].isType(tagname)) {
          objects.push(this.jsobjects[k]);
        }
      }
      return objects;
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
    this.closeLink = function(js_id) {
      var link = this.jsobjects[js_id];
      if (link) {
        link.closePortal();
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
    this.updateFlying = function() {
      if (typeof player != 'undefined') {
        player.flying = this.flying;
        console.log('Toggle player flying', this.flying);
      }
    }
    this.updateTeleport = function() {
      console.log('Toggle player teleport', this.teleport);
    }
    this.updateGravity = function() {
      if (this.loaded) {
        player.updateGravity(this.gravity);
        this.gravityInitialized = true;
      } else if (!this.gravityInitialized) {
        elation.events.add(this, 'room_load_complete', elation.bind(this, function() {
          player.updateGravity(this.gravity);
        }));
        this.gravityInitialized = true;
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
    this.getServer = function() {
      if (!this._server && !this.private) {
        var hashargs = elation.url();
        var host = elation.utils.any(this.server, hashargs['janus.server'], elation.config.get('janusweb.network.host')),
            port = elation.utils.any(this.port, hashargs['janus.port'], elation.config.get('janusweb.network.port'), 5567);
        this._server = this.janusweb.getConnection(host, port, this.url);
      }
      return this._server;
    }
    this.join = function() {
      elation.events.fire({type: 'join', element: this, data: this.url});
    }
    this.part = function() {
      elation.events.fire({type: 'part', element: this, data: this.url});
    }
    this.getProxyObject = function() {
      if (!this._proxyobject) {
        var proxy = new elation.proxy(this, {
          url:           ['property', 'url', { readonly: true}],
          referrer:      ['property', 'referrer'],
          objects:       ['property', 'jsobjects'],
          cookies:       ['property', 'cookies'],
          walk_speed:    ['property', 'walk_speed'],
          run_speed:     ['property', 'run_speed'],
          jump_velocity: ['property', 'jump_velocity'],
          flying:        ['property', 'flying'],
          gravity:       ['property', 'gravity'],
          fog:           ['property', 'fog'],
          fog_mode:      ['property', 'fog_mode'],
          fog_density:   ['property', 'fog_density'],
          fog_start:     ['property', 'fog_start'],
          fog_end:       ['property', 'fog_end'],
          fog_col:       ['property', 'fog_col'],
          ambient:       ['property', 'ambient'],
          defaultlights: ['property', 'defaultlights'],
          bloom:         ['property', 'bloom'],
          tonemapping_type:       ['property', 'tonemapping_type'],
          tonemapping_exposure:   ['property', 'tonemapping_exposure'],
          tonemapping_whitepoint: ['property', 'tonemapping_whitepoint'],
          pbr:           ['property', 'pbr'],
          toon:          ['property', 'toon'],
          shadows:       ['property', 'shadows'],
          col:           ['property', 'col'],
          locked:        ['property', 'locked'],
          private:       ['property', 'private'],
          selfavatar:    ['property', 'selfavatar'],

          localToWorld:  ['function', 'localToWorld'],
          worldToLocal:  ['function', 'worldToLocal'],
          loadNewAsset:  ['function', 'loadNewAsset'],
          createObject:  ['function', 'createObject'],
          removeObject:  ['function', 'removeObject'],
          appendChild:   ['function', 'appendChild'],
          removeChild:   ['function', 'removeObject'],
          addCookie:     ['function', 'addCookie'],
          playSound:     ['function', 'playSound'],
          stopSound:     ['function', 'stopSound'],
          seekSound:     ['function', 'seekSound'],
          pauseSound:    ['function', 'pauseSound'],
          playVideo:     ['function', 'playVideo'],
          stopVideo:     ['function', 'stopVideo'],
          seekVideo:     ['function', 'seekVideo'],
          pauseVideo:    ['function', 'pauseVideo'],
          openLink:      ['function', 'openLink'],
          raycast:       ['function', 'raycast'],

          getObjectById:         ['function', 'getObjectById'],
          getObjectsByClassName: ['function', 'getObjectsByClassName'],
          getObjectsByTagName:   ['function', 'getObjectsByTagName'],
          getBoundingSphere:     ['function', 'getBoundingSphere'],
          getBoundingBox:        ['function', 'getBoundingBox'],

          registerElement:     ['function', 'registerElement'],
          extendElement:       ['function', 'extendElement'],
          addEventListener:    ['function', 'addEventListenerProxy'],
          removeEventListener: ['function', 'removeEventListenerProxy'],
          dispatchEvent:       ['function', 'dispatchEvent'],

          onLoad:          ['callback', 'janus_room_scriptload'],
          update:          ['callback', 'janusweb_script_frame', null, this.janus.scriptframeargs],
          postUpdate:      ['callback', 'janusweb_script_frame_end', null, this.janus.scriptframeargs],
          onCollision:     ['callback', 'physics_collide', 'objects.dynamics'],
          onColliderEnter: ['callback', 'janus_room_collider_enter'],
          onColliderExit:  ['callback', 'janus_room_collider_exit'],
          onClick:         ['callback', 'click,touchstart', 'engine.client.container'],
          onMouseDown:     ['callback', 'janus_room_mousedown'],
          onMouseUp:       ['callback', 'janus_room_mouseup'],
          onMouseMove:     ['callback', 'janus_room_mousemove'],
          onMouseDrag:     ['callback', 'janus_room_mousedrag'],
          onKeyDown:       ['callback', 'janus_room_keydown'],
          onKeyUp:         ['callback', 'janus_room_keyup']
        });
        this._proxyobject = proxy;
      }
      return this._proxyobject;
    }
    this.hasChanges = function() {
      return Object.keys(this.changes).length > 0;
    }
    this.getChanges = function() {
      var changeids = Object.keys(this.changes);
      var changestr = '';
      if (changeids.length > 0) {
        var xmldoc = document.implementation.createDocument(null, 'edit', null);
        var editroot = xmldoc.documentElement;

        // Build a reverse type map
        // FIXME - double check that this works properly with custom elements
        var typemap = {};
        for (var k in this.janus.typemap) {
          var n = this.janus.typemap[k];
          typemap[n] = k;
        }


        changeids.forEach(elation.bind(this, function(id) {
          //changestr += this.currentroom.changes[id];
          var change = this.changes[id];
          var real = this.getObjectFromProxy(change);
          if (real) {
            var xmltype = typemap[real.type] || 'Object';
            xmlnode = xmldoc.createElement(xmltype);
            
            var attrs = Object.keys(change);
            for (var i = 0; i < attrs.length; i++) {
              var k = attrs[i];
              var val = change[k];
              if (val instanceof THREE.Vector2 ||
                  val instanceof THREE.Quaternion ||
                  val instanceof THREE.Vector3) {
                val = val.toArray().map(function(n) { return +n.toFixed(4); }).join(' ');
              } else if (val instanceof THREE.Euler) {
                val = [val.x.toFixed(4), val.y.toFixed(4), val.z.toFixed(4)].join(' ');
              } else if (val instanceof THREE.Color) {
                if (k == 'col' && real.colorIsDefault) {
                  val = null;
                } else {
                  val = val.toArray().map(function(n) { return +n.toFixed(4); }).join(' ');
                }
              } else if (elation.utils.isString(val) && val.indexOf('blob:') == 0) {
                var xhr = new XMLHttpRequest();

/*
                xhr.open('GET', val, false);
                xhr.overrideMimeType('text\/plain; charset=x-user-defined');

                //xhr.responseType = 'ArrayBuffer';
                xhr.send(null);

                var bytes = new Uint8Array(xhr.responseText.length);
                for (var i = 0; i < bytes.length; i++) {
                  bytes[i] = xhr.responseText.charCodeAt(i);
                }
                var binary = '';
                var len = xhr.responseText.length;
                for (var i = 0; i < len; i++) {
                    binary += String.fromCharCode( bytes[ i ] );
                    //binary += String.fromCharCode( xhr.responseText.charCodeAt(i));
                }
                val = 'data:image/png;base64,' + btoa(binary);
*/
              }

              if (val !== null && val !== undefined && typeof val != 'function') {
                // If the property name matches the object type, use a text node rather than setting the property
                if (xmltype.toLowerCase() == k.toLowerCase()) {
                  xmlnode.appendChild(xmldoc.createTextNode(val));
                } else {
                  xmlnode.setAttribute(k, val);
                }
              }
            }
            editroot.appendChild(xmlnode);
          }
          delete this.changes[id];
        }));
        this.appliedchanges = {};
        var serializer = new XMLSerializer();
        changestr = serializer.serializeToString(xmldoc);
        changestr = changestr.replace(/^<edit\/?>/, '');
        changestr = changestr.replace(/<\/edit>\s*$/, '');
        return changestr;
      }
    }
    this.hasDeletions = function() {
      return this.deletions.length > 0;
    }
    this.getDeletions = function() {
      var deletions = '';
      while (this.deletions.length > 0) {
        var obj = this.deletions.pop();
        var type = this.getTypeFromClassname(obj.type);

        deletions += '<' + type + ' id="' + obj.janusid + '" js_id="' + obj.js_id + '" />';
      }
      return deletions;
    }
    this.getCustomElement = function(classname) {
      if (classname.substr(classname.length - this.roomid.length - 1, this.roomid.length + 1) == '_' + this.roomid) {
        classname = classname.substring(0, classname.length - this.roomid.length - 1);
      }
      if (this.customElements[classname]) {
        return this.customElements[classname];
      } else if (this.janus.customElements[classname]) {
        return this.janus.customElements[classname];
      }
      return null;
    }
    this.registerElement = function(tagname, classobj, extendclass) {
      tagname = tagname.toLowerCase();
      var classname = tagname + '_' + this.roomid;
      var fullextendclass = 'janusobject';
      if (extendclass) {
        extendclass = extendclass.toLowerCase();
        var customelement = this.getCustomElement(extendclass);
        if (customelement) {
          fullextendclass = customelement.classname;
        } else {
          // If we're extending an existing class but the class hasn't yet been defined, we listen for
          // the registerelement event so we know when the parent class has been defined, then we try again
          var func = (ev) => {
            if (ev.data == extendclass) {
              elation.events.remove(this, 'registerelement', func);
              this.registerElement(tagname, classobj, extendclass);
            }
          };
          elation.events.add(this, 'registerelement', func);

          // Bail out - we'll try again after the parent class has been defined
          return;
        }
      }

      this.customElements[tagname] = {
        tagname: tagname,
        classname: classname,
        class: classobj,
        extendclass: fullextendclass
      };

      // console.log('Register new ROOM tag type:', tagname, classname, classobj, fullextendclass);
      elation.component.add('engine.things.' + classname, classobj, elation.engine.things[fullextendclass]);

      elation.events.fire({type: 'registerelement', element: this, data: tagname});
      if (this.unknownElements[tagname]) {
        var unknownElements = this.unknownElements[tagname];
        // console.log('Now we know about ' + tagname + ', so make some!', unknownElements);
        for (var i = 0; i < unknownElements.length; i++) {
          this.createObject(tagname, unknownElements[i].args, unknownElements[i].parent);
        }
        delete this.unknownElements[tagname];
      }
    }
    this.extendElement = function(extendclass, tagname, classobj) {
      this.registerElement(tagname, classobj, extendclass);
    }
    this.handleEditorInput = function(ev) {
      console.log('editor changed', this.debugeditor.value);
    }
    this.handleEditorUpdate = function(ev) {
      console.log('set page source', this.debugeditor.value);
      this.applySourceChanges(this.debugeditor.value);
      //this.loadFromSource(this.debugeditor.value);
    }
    this.applySourceChanges = function(src) {
        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
        var roomdata = this.janus.parser.parse(src, this.baseurl, datapath);
      console.log('apply changes to existing world', roomdata);
      var exclude = ['#text', 'assets', 'room', 'source'];

      for (var k in roomdata) {
        if (exclude.indexOf(k) == -1) {
          var entities = roomdata[k];
          for (var i = 0; i < entities.length; i++) {
            var newentity = entities[i],
                oldentity = this.jsobjects[newentity.js_id];
            console.log(newentity, oldentity);
            var changed = false;
            if (oldentity) {
              for (var k in newentity) {
                var newval = newentity[k];
                if (newval !== null && newval !== undefined && newval != oldentity[k]) {
                  oldentity[k] = newentity[k];
                  changed = true;
                }
              }
              if (changed) oldentity.sync = true;
            }
          }
        }
      }
    }
    this.getRoomSource = function() {
      //console.log(this.jsobjects);
      var assetsrc = '  <Assets>\n';

      var typemap = {};
      for (var k in this.janus.typemap) {
        var n = this.janus.typemap[k];
        if (!typemap[n]) {
          typemap[n] = k;
        }
      }

      for (var type in this.roomassets) {
        for (var assetname in this.roomassets[type]) {
          var asset = this.roomassets[type][assetname];

          if (assetname != asset.src) {
            assetsrc += '    <asset' + type + ' id="' + assetname + '" src="' + asset.src + '" />\n';
          }
        }
      }
      assetsrc += '  </Assets>\n';

      var objectsrc = '  <Room>\n';
      for (var k in this.jsobjects) {
        var object = this.jsobjects[k];
        var obj = object._target;
        var markup = obj.summarizeXML();
        objectsrc += '    ' + markup.replace('<Object ', '<' + typemap[obj.type] + ' ') + '\n';
      }
      objectsrc += '  </Room>\n';
      var roomsrc = '<FireBoxRoom>\n';
      roomsrc += assetsrc;
      roomsrc += objectsrc;
      roomsrc += '<FireBoxRoom>\n';
      console.log(roomsrc);

      return roomsrc;
    }

    // FIXME - room should inherit from janusbase and get this automatically
    this.addEventListenerProxy = function(name, handler, bubble) {
      var eventobj = {
        target: handler,
        fn: function(ev) {
          var proxyev = elation.events.clone(ev, {
            target: ev.target.getProxyObject(),
          });
          // Bind stopPropagation and preventDefault functions to the real event
          proxyev.stopPropagation = elation.bind(ev, ev.stopPropagation),
          proxyev.preventDefault = elation.bind(ev, ev.preventDefault),
          handler(proxyev);
        }
      };
      if (!this.eventlistenerproxies[name]) this.eventlistenerproxies[name] = [];
      this.eventlistenerproxies[name].push(eventobj);

      elation.events.add(this, name, eventobj.fn, bubble);
    }
    this.removeEventListenerProxy = function(name, handler, bubble) {
      if (this.eventlistenerproxies[name]) {
        for (var i = 0; i < this.eventlistenerproxies[name].length; i++) {
          var evproxy = this.eventlistenerproxies[name][i];
          if (evproxy.target === handler) {
            elation.events.remove(this, name, evproxy.fn, bubble);
          }
        }
      }
    }
    this.getTypeFromClassname = function(classname) {
      var types = {};
      for (var k in this.customElements) {
        var el = this.customElements[k];
        if (el.classname == classname) {
          return k;
        }
      }
      for (var k in this.janus.customElements) {
        var el = this.janus.customElements[k];
        if (el.classname == classname) {
          return k;
        }
      }
      return 'object';
    }
    this.addClass = function(classname) {
      if (!this.hasClass(classname)) {
        this.classList.push(classname);
      }
      this.updateClassName();
    }
    this.removeClass = function(classname) {
      var idx = this.classList.indexOf(classname);
      if (idx != -1) {
        this.classList.splice(idx, 1);
      }
      this.updateClassName();
    }
    this.hasClass = function(classname) {
      return this.classList.indexOf(classname) != -1;
    }
    this.updateClassName = function() {
      this.className = this.classList.join(' ');
    }
    this.setClassName = function() {
      this.classList = this.className.split(' ');
    }
    this.raycast = (function() {
      var _pos = new THREE.Vector3(),
          _dir = new THREE.Vector3(0,0,-1),
          _ray = new THREE.Raycaster();
      return function(dir, pos, classname) {
        _ray.set(pos, dir);
        var intersections = _ray.intersectObject(this.colliders, true);
        var hits = intersections;
        if (classname) {
          hits = [];
          for (var i = 0; i < intersections.length; i++) {
            var obj = intersections[i].object,
                thing = this.getThingForObject(obj);
            if (thing.hasClass(classname)) {
              intersections[i].mesh = obj;
              intersections[i].object = thing.getProxyObject();
              hits.push(intersections[i]);
            }
          }
        } else {
          for (var i = 0; i < hits.length; i++) {
            var obj = hits[i].object,
                  thing = this.getThingForObject(obj);
            hits[i].mesh = hits[i].object;
            hits[i].object = thing.getProxyObject();
          }
        }
        return hits;
      }
    })();
    this.getThingForObject = function(obj) {
      while (obj) {
        if (obj.userData && obj.userData.thing) {
          return obj.userData.thing;
        }
        obj = obj.parent;
      }
      return null;
    }
    this.require = function(deps) {
      // Dynamically load components that are needed by this room from any registered repositories
      if (!elation.utils.isArray(deps)) {
        deps = deps.split(' ');
      }
      if (!this.pendingCustomElementsMap) {
        this.pendingCustomElementsMap = {};
      }
      let foundmap = this.pendingCustomElementsMap;
      function countMissing() {
        let missing = 0;
        for (let k in foundmap) {
          missing += (foundmap[k] ? 0 : 1);
        }
        return missing;
      }
      let finished = false,
          newdeps = [];

      deps.forEach(d => { if (!(d in foundmap)) { newdeps.push(d); foundmap[d] = false; } }); 

      this.pendingCustomElements = countMissing();

      // FIXME - This is a naive implementation which doesn't do proper dependency graph resolution.
      //         As a result, sometimes the components load out of order, or they try to load multiple times.
      //         Elation has some built-in functions for resolving complex dependency graphs which we
      //         should be using here
      let promise = new Promise((accept, reject) => {
        for (let i = 0; i < newdeps.length; i++) {
          let k = newdeps[i];
          if (!foundmap[k]) {
            // The requested element isn't registered yet, wait and see if it becomes available
            this.addEventListener('registerelement', (ev) => {
              if (ev.data in foundmap && !foundmap[ev.data]) {
                // Element was registered, update its map entry
                foundmap[ev.data] = true;

                this.pendingCustomElements = countMissing();
                if (this.pendingCustomElements == 0) {
                  // If all our required elements have been loaded, we're done here
                  finished = true;
                  elation.events.fire({element: this, type: 'room_load_complete_customelements'});
                  accept();
                }
              }
            });
            if (this.pendingScripts) {
              // We're still waiting for the room to finish loading, so wait for the room_load_complete event before checking if we need to load anything else
              this.addEventListener('room_load_complete', (ev) => {
                // Room and all of its assets have finished loading. If our required component still isn't available, check the master package list and autoload if possible
                if (!finished) {
                  this.loadComponentList().then(components => {
                    if (components[k]) {
                      this.loadNewAsset('script', { src: components[k].url });
                      this.loadScripts([{src: components[k].url}]);
                    }
                  });
                }
              });
            } else {
              // Room is already loaded and scripts are processed - we still don't know about this component, so load it up
              this.loadComponentList().then(components => {
                if (components[k]) {
                  this.loadNewAsset('script', { src: components[k].url });
                  this.loadScripts([{src: components[k].url}]);
                }
              });
            }
          }
        }
        if (countMissing() == 0) {
          accept();
        }
      });
      return promise;
    }
    this.loadComponentList = function() {
      return new Promise((accept, reject) => {
        if (this.componentrepository) {
          // Already loaded
          accept(this.componentrepository);
        } else {
          let url = 'https://baicoianu.com/~bai/janusweb/test/components.json'; // FIXME - dumb hack for prototype

          fetch(url)
            .then(d => d.json())
            .then(components => {
              this.componentrepository = components;
              accept(components);
            });
        }
      });
    }
    this.dispatchEvent = function(event, target) {
      let firedev = elation.events.fire(event);
/*
      if (!event.element) event.element = target || this;
      var handlerfn = 'on' + event.type;
      if (this[handlerfn]) {
        this.executeCallback(this[handlerfn], event);
      }
      let firedev = elation.events.fire(event);
      let returnValue = true;
      firedev.forEach(e => returnValue &= e.returnValue);
      if (returnValue && this.parent) {
console.log('dispatch to parent', event, this, event.target);
        this.parent.dispatchEvent(event, event.target);
      }
*/
    }
  }, elation.engine.things.generic);
});

