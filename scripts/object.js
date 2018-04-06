elation.require(['janusweb.janusbase', 'janusweb.websurface'], function() {
  elation.component.add('engine.things.janusobject', function() {
    this.sidemap = {
      'back': THREE.FrontSide,
      'front': THREE.BackSide,
      'none': THREE.DoubleSide
    };
    this.postinit = function() {
      elation.engine.things.janusobject.extendclass.postinit.call(this);
      this.defineProperties({
        janusid: { type: 'string', refreshGeometry: true },
        image_id: { type: 'string', set: this.updateMaterial },
        lmap_id: { type: 'string', set: this.updateMaterial },
        video_id: { type: 'string', set: this.updateVideo },
        url: { type: 'string' },
        loop: { type: 'boolean' },
        websurface_id: { type: 'string', set: this.updateWebsurface },
        shadow: { type: 'boolean', default: false, set: this.updateMaterial },
        shadow_receive: { type: 'boolean', default: true, set: this.updateMaterial },
        shadow_cast: { type: 'boolean', default: true, set: this.updateMaterial },
        cull_face: { type: 'string', default: 'back', set: this.updateMaterial },
        blend_src: { type: 'string', default: 'src_alpha', set: this.updateMaterial },
        blend_dest: { type: 'string', default: 'one_minus_src_alpha', set: this.updateMaterial },
        envmap_id: { type: 'string', set: this.updateMaterial },
      });
      //elation.events.add(this, 'thing_init3d', elation.bind(this, this.assignTextures));

      this.handleFrameUpdates = elation.bind(this, this.handleFrameUpdates);
      if (this.anim_id) {
        this.setAnimation(this.anim_id);
      }

    }
    this.createObject3D = function() {
      if (this.properties.exists === false) return;

      var object = null, geometry = null, material = null;
      if (this.janusid) {
        var asset = this.getAsset('model', this.janusid, true);
        if (asset) {
          if (asset.loaded) {
            setTimeout(elation.bind(this, this.handleLoad), 0);
          } else {
            elation.events.add(asset, 'asset_load_complete', elation.bind(this, this.handleLoad));
          }
          object = asset.getInstance();
        }
      }
      if (!object) {
        object = new THREE.Object3D();
      }

      return object;
    }
    this.createChildren = function() {
      elation.engine.things.janusobject.extendclass.createChildren.call(this);

      //this.properties.collidable = false;

      //this.updateColliderFromGeometry(new THREE.BoxGeometry(1,1,1));
    }
    this.createForces = function() {
      elation.engine.things.janusobject.extendclass.createForces.call(this);
      if (!this.collidable) return;
      this.updateCollider();
    }
    this.createObjectDOM = function() {
/*
      if (this.websurface_id) {
        var websurface = this.room.websurfaces[this.properties.websurface_id];
        if (websurface) {
          var width = websurface.width || 1024,
              height = websurface.height || 768;

          var iframe = elation.html.create('iframe');
          iframe.src = this.url;
          var div = elation.html.create('div');
          div.className = 'janusweb_websurface ';
          div.appendChild(iframe);
          div.style.width = width + 'px';
          div.style.height = height + 'px';
          iframe.style.width = width + 'px';
          iframe.style.height = height + 'px';

          var obj = new THREE.CSS3DObject(div);
          obj.scale.set(1/width, 1/height, 1);
          this.objects['3d'].add(obj);
        }
      }
*/
    }
    this.handleLoad = function() {
      this.setTextureDirty();
      setTimeout(elation.bind(this, function() {
        elation.events.fire({type: 'load', element: this});
      }), 0);
    }
    this.updateMaterial = function() {
      this.setTextureDirty();
    }
    this.updateVideo = function() {
      if (!this.modelasset) return;
      if (!this.videoasset || this.videoasset.name != this.video_id) {
        if (this.video_id && this.video_id != '') {
          this.loadVideo(this.video_id);
          if (this.modelasset) {
            this.assignTextureParameters(texture, this.modelasset);
          }
        } else {
          this.videotexture = null;
        }
      }
      this.setTextureDirty();
    }
    this.loadVideo = function(videoid) {
      var videoasset = this.getAsset('video', videoid);
      if (videoasset) {
        this.videoasset = videoasset;
        texture = videoasset.getInstance();
        if (videoasset.sbs3d) {
          texture.repeat.x = 0.5;
        }
        if (videoasset.ou3d) {
          texture.repeat.y = 0.5;
        }
        if (videoasset.loop || this.properties.loop) {
          texture.image.loop = true;
        }
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        elation.events.add(texture, 'videoframe', elation.bind(this, this.refresh));
        elation.events.add(texture, 'autoplaystart', elation.bind(this, this.handleAutoplayStart));
        elation.events.add(texture, 'autoplayfailed', elation.bind(this, this.handleAutoplayFailed));
        this.videotexture = texture;

        // Refresh this object whenever the video has a new frame for us to display
        texture.onUpdate = (e) => this.refresh();

        if (videoasset.auto_play) {
          texture.image.addEventListener('canplaythrough', function() {
            texture.image.play();
          });
        }

        // Refresh this object whenever the video has a new frame for us to display
        texture.onUpdate = (e) => this.refresh();

        this.video = texture.image;
        elation.events.add(this, 'click', elation.bind(this, this.handleVideoClick));
        this.room.videos[videoid] = this;
      }
    }
    this.updateWebsurface = function() {
      if (this.websurface_id) {
        var websurface = this.room.websurfaces[this.websurface_id];
        //console.log('do a websurface: ' + this.websurface_id, websurface, this.room.baseurl);
        if (websurface) {
          var url = websurface.src;
          if (url && !url.match(/^(https?:)?\/\//)) {
            url = this.room.baseurl + url;
          }
          this.url = url;
        }
        this.pickable = false;
        this.collidable = false;

        if (this.objects['3d']) {
          if (!this.websurface) {
            this.createWebsurface();
          } else {
            this.websurface.websurface_id = this.websurface_id;
          }
        }
      }
    }
    this.createWebsurface = function() {
      this.websurface = this.spawn('januswebsurface', null, {janus: this.janus, room: this.room, websurface_id: this.websurface_id});
      elation.events.add(this, 'mouseover', elation.bind(this.websurface, this.websurface.hover));
      elation.events.add(this, 'mouseout', elation.bind(this.websurface, this.websurface.unhover));
      this.replaceWebsurfaceMaterial();
      this.websurface.start();
    }
    this.replaceWebsurfaceMaterial = function() {
      var blankmaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        opacity: 0,
        transparent: true,
        blending: THREE.NoBlending,
        side: THREE.DoubleSide
      });
      this.objects['3d'].traverse(function(n) {
        if (n.material) n.material = blankmaterial;
      });
    }
    this.setTextureDirty = function() {
      this.textureNeedsUpdate = true;
    }
    this.handleFrameUpdates = function(ev) {
      elation.engine.things.janusobject.extendclass.handleFrameUpdates.call(this, ev);
      if (this.textureNeedsUpdate) {
        this.assignTextures();
      }
    }
    this.assignTextures = function() {
      //console.log('assign textures', this.name, this.objects['3d']);
      if (!this.objects['3d']) return;
      var modelasset = this.modelasset,
          texture = false,
          textureLightmap = false,
          color = false,
          blend_src = false,
          blend_dest = false,
          side = this.sidemap[this.properties.cull_face],
          textureasset;

      this.textureNeedsUpdate = false;

      var image_id = this.image_id,
          normal_image_id = false,
          lightmap_image_id = this.lmap_id;
      if (this.janusid) {
        if (!modelasset || modelasset.name != this.janusid) {
          modelasset = this.getAsset('model', this.janusid, true);
          this.modelasset = modelasset;
        }
        if (modelasset.tex) {
          image_id = modelasset.tex;
        }
        if (modelasset.tex0) {
          image_id = modelasset.tex0;
        }
      }
      if (image_id) {
        textureasset = this.getAsset('image', image_id, true);
        if (textureasset) {
          texture = textureasset.getInstance();
          elation.events.add(texture, 'asset_load', elation.bind(this, this.setTextureDirty));
          elation.events.add(texture, 'update', elation.bind(this, this.refresh));

          if (textureasset.sbs3d) {
            texture.repeat.x = 0.5;
          }
          if (textureasset.ou3d) {
            texture.repeat.y = 0.5;
          }
          this.assignTextureParameters(texture, modelasset, textureasset);
        }
      }
      if (lightmap_image_id) {
        lightmaptextureasset = this.getAsset('image', lightmap_image_id);
        if (lightmaptextureasset) {
          textureLightmap = lightmaptextureasset.getInstance();
          elation.events.add(textureLightmap, 'asset_load', elation.bind(this, this.setTextureDirty));
          elation.events.add(textureLightmap, 'update', elation.bind(this, this.refresh));

          this.assignTextureParameters(textureLightmap, modelasset, lightmaptextureasset);
        }
      }
      if (this.video_id && this.video_id != '') {
        this.loadVideo(this.video_id);
        texture = this.videotexture;
        this.assignTextureParameters(texture, modelasset);
      }
      if (this.websurface_id) {
        this.replaceWebsurfaceMaterial();
        return;
      }
      if (this.properties.color !== this.defaultcolor) {
        color = this.properties.color;
      } else if (modelasset && modelasset.color) {
        color = modelasset.color;
      }
/*
      if (this.properties.col) {
        var col = this.properties.col;
        if (!col && modelasset && modelasset.col) {
          col = modelasset.col;
        }
        //color.setRGB(col.x, col.y, col.z);
      }
*/
      var srcfactors = {
        'zero': THREE.ZeroFactor,
        'one': THREE.OneFactor,
        'src_color': THREE.SrcColorFactor,
        'dst_color': THREE.DstColorFactor,
        'src_alpha': THREE.SrcAlphaFactor,
        'dst_alpha': THREE.DstAlphaFactor,
        'one_minus_src_color': THREE.OneMinusSrcColorFactor,
        'one_minus_src_alpha': THREE.OneMinusSrcAlphaFactor,
        'one_minus_dst_color': THREE.OneMinusDstColorFactor,
        'one_minus_dst_alpha': THREE.OneMinusDstAlphaFactor,
      }
      if (srcfactors[this.properties.blend_src]) {
        blend_src = srcfactors[this.properties.blend_src];
      }
      if (srcfactors[this.properties.blend_dest]) {
        blend_dest = srcfactors[this.properties.blend_dest];
      }

      this.extractAnimations(this.objects['3d']);

      var scene = this.engine.systems.world.scene['world-3d'];
      if (!this.hasalpha) this.hasalpha = {};
      var hasalpha = this.hasalpha;
      var remove = [];
      var cloneMaterial = true;//(texture !== false);

      this.objects['3d'].traverse(elation.bind(this, function(n) { 
        n.receiveShadow = this.shadow && this.shadow_receive;
        n.castShadow = this.shadow && this.shadow_cast;

        var useSkinning = n instanceof THREE.SkinnedMesh;
        if (n.material) {
          var materials = [];
          if (elation.utils.isArray(n.material)) {
            //materials = [n.material.materials[1]];
            for (var i = 0; i < n.material.length; i++) {
              if (cloneMaterial) {
                var m = this.copyMaterial(n.material[i]);
                materials.push(m); 
              } else {
                materials.push(n.material[i]);
              }
            }
            n.material = materials;
          } else {
            if (cloneMaterial) {
              var m = this.copyMaterial(n.material);
              materials.push(m); 
              n.material = m;
            } else {
              materials.push(n.material);
            }
          }

          for (var i = 0; i < materials.length; i++) {
            let m = materials[i];
            if (color) {
              m.color = color;
            }
            if (texture && texture.image) {
              if (!color) m.color.setHex(0xffffff);
              m.map = texture; 
              elation.events.add(texture, 'asset_update', (ev) => { m.map = ev.data; this.refresh(); });
              m.transparent = (textureasset && textureasset.hasalpha) || m.opacity < 1;
            } else if (m.map && m.map.sourceFile) {
              var imagesrc = m.map.sourceFile;
              var asset = this.getAsset('image', imagesrc, true);
              if (asset) {
                if (asset.hasalpha) {
                  m.transparent = true;
                  m.alphaTest = this.alphatest;
                }
                m.map = asset.getInstance();
                elation.events.add(m.map, 'asset_update', elation.bind(this, function(ev) { m.map = ev.data; }));
                elation.events.add(m.map, 'asset_load', elation.bind(this, function(m, asset, ev) {
                  if (asset.hasalpha && !m.transparent) {
                    m.transparent = true;
                    m.alphaTest = this.alphatest;
                    m.needsUpdate = true;
                  }
                  this.refresh();
                }, m, asset));
              }
              if (m.map) {
                this.assignTextureParameters(m.map, modelasset, asset);
              }
            }
            if (m.bumpMap) {
              var imagesrc = m.bumpMap.sourceFile;
              var asset = this.getAsset('image', imagesrc, {id: imagesrc, src: imagesrc, hasalpha: false});
              if (asset) {
                m.normalMap = asset.getInstance();
                elation.events.add(m.bumpMap, 'asset_update', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
                elation.events.add(m.bumpMap, 'asset_load', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
              }
            }
            if (m.normalMap) {
              var imagesrc = m.normalMap.sourceFile;
              var asset = this.getAsset('image', imagesrc, {id: imagesrc, src: imagesrc, hasalpha: false});
              if (asset) {
                m.normalMap = asset.getInstance();
                elation.events.add(m.normalMap, 'asset_update', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
                elation.events.add(m.normalMap, 'asset_load', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
              }
            }

            if (textureLightmap && textureLightmap.image) {
              if (lightmaptextureasset.loaded) {
                m.lightMap = textureLightmap; 
              } else {
              }
              elation.events.add(textureLightmap, 'asset_update', elation.bind(m, function(ev) { m.lightMap = ev.data; this.refresh(); }));
            } else if (m.lightMap) {
              var imagesrc = m.lightMap.sourceFile;
              var asset = this.getAsset('image', imagesrc, {id: imagesrc, src: imagesrc, hasalpha: false});
              if (asset) {
                m.lightMap = asset.getInstance();
                elation.events.add(m.lightMap, 'asset_load', elation.bind(this, function(ev) { m.lightMap = ev.data; this.refresh();}));
                elation.events.add(m.lightMap, 'asset_update', elation.bind(this, function(ev) { m.lightMap = ev.data; this.refresh(); }));
              }
            }

            if (this.isUsingPBR()) {
              m.envMap = this.getEnvmap();
            }

            //m.roughness = 0.75;
            m.side = side;

            if (blend_src || blend_dest) {
              if (blend_src) m.blendSrc = blend_src;
              if (blend_dest) m.blendDst = blend_dest;
              m.blending = THREE.CustomBlending;

              m.blendSrcAlpha = THREE.SrcAlphaFactor;
              m.blendDstAlpha = THREE.OneFactor;
              if (!blend_src == 'src_alpha' && blend_dest == 'one_minus_src_alpha') {
                m.transparent = true;
              }
            } else {
              m.blending = THREE.NormalBlending;
            }
            //m.needsUpdate = true;
            m.skinning = useSkinning;
          }
        } else if (n instanceof THREE.Light) {
          remove.push(n);
        }
      }));
      for (var i = 0; i < remove.length; i++) {
        remove[i].parent.remove(remove[i]);
      }
      this.refresh();
    }
    this.copyMaterial = function(oldmat) {
console.log('cloning material', oldmat);
      if (elation.utils.isArray(oldmat)) {
        var materials = [];
        for (var i = 0; i < oldmat.length; i++) {
          materials.push(this.copyMaterial(oldmat[i]));
        }
        var m = materials;
      } else if (oldmat instanceof THREE.PointsMaterial) {
        var m = oldmat.clone(); 
      } else {
        var m = this.allocateMaterial();
        m.anisotropy = 16;
        m.name = oldmat.name;
        m.map = oldmat.map;
        m.opacity = this.opacity; //(typeof oldmat.opacity != 'undefined' ? parseFloat(oldmat.opacity) : this.opacity);
        m.alphaTest = this.alphatest;
        m.aoMap = oldmat.aoMap;
        m.normalMap = oldmat.normalMap;
        m.bumpMap = oldmat.bumpMap;

        if (!(m instanceof THREE.MeshBasicMaterial)) {
          if (oldmat.emissiveMap) m.emissiveMap = oldmat.emissiveMap;
          if (oldmat.emissive) m.emissive = oldmat.emissive;
        }

        m.lightMap = oldmat.lightMap;
        if (oldmat.color) {
          m.color.copy(oldmat.color);
        }
        m.transparent = m.opacity < 1;
        m.alphaTest = oldmat.alphaTest;
        m.skinning = oldmat.skinning;

        if (oldmat.metalness !== undefined) m.metalness = oldmat.metalness;
        if (oldmat.metalnessMap !== undefined) m.metalnessMap = oldmat.metalnessMap;
        if (oldmat.roughness !== undefined) m.roughness = oldmat.roughness;
        if (oldmat.clearCoat !== undefined) m.clearCoat =  oldmat.clearCoar;
        if (oldmat.clearCoatRoughness !== undefined) m.clearCoatRoughness = oldmat.clearCoatRoughness;

        m.reflectivity = (oldmat.reflectivity !== undefined ? oldmat.reflectivity : .5);

        if (oldmat.roughnessMap !== undefined) {
          m.roughnessMap = oldmat.roughnessMap;
        } else if (oldmat.specularMap !== undefined) {
          m.roughnessMap = oldmat.specularMap;
        }
        if (oldmat.roughness !== undefined) {
          m.roughness = oldmat.roughness;
        } else if (oldmat.shininess !== undefined) {
          m.roughness = 1 - oldmat.shininess / 512;
        } else if (!m.roughnessMap) {
          m.roughness = 0.6;
        }
        if (this.isUsingPBR()) {
          m.envMap = this.getEnvmap();
        }

        /*
        if (oldmat.specular && oldmat.specular.b != 0 && oldmat.specular.g != 0 && oldmat.specular.b != 0) {
          m.color.copy(oldmat.specular);
        }
        */
      }

      return m;
    }
    this.isUsingPBR = function() {
      return this.lighting && elation.utils.any(this.room.pbr, elation.config.get('janusweb.materials.pbr'));
    }
    this.allocateMaterial = function() {
      if (!this.lighting) {
        return new THREE.MeshBasicMaterial();
      } else if (this.isUsingPBR()) {
        return new THREE.MeshPhysicalMaterial();
      }
      return new THREE.MeshPhongMaterial();
    }
    this.getEnvmap = function() {
      if (this.envmap_id) {
        if (this.envmap) return this.envmap;
        var envmapasset = this.getAsset('image', this.envmap_id);
        if (envmapasset) {
          this.envmap = envmapasset.getInstance();
          this.envmap.mapping = THREE.EquirectangularReflectionMapping;
          return this.envmap;
        }
      } else {
        var scene = this.engine.systems.world.scene['world-3d'];
        return scene.background;
      }
    }
    this.assignTextureParameters = function(texture, modelasset, textureasset) {
      var linear = (!modelasset || modelasset.tex_linear && modelasset.tex_linear !== 'false') && (!textureasset || textureasset.tex_linear && textureasset.tex_linear !== 'false');
      texture.minFilter = (linear && !this.video_id ? THREE.LinearMipMapLinearFilter : THREE.NearestFilter);
      texture.magFilter = (linear ? THREE.LinearFilter : THREE.NearestFilter);
      texture.anisotropy = (linear ? elation.config.get('engine.assets.image.anisotropy', 4) : 1);
      texture.generateMipmaps = linear;
    }
    this.start = function() {
      elation.engine.things.janusobject.extendclass.start.call(this);
      /*
      // TODO - should double check that gifs stop playing when you leave a room
      if (this.image_id) {
        var textureasset = this.getAsset('image', this.image_id);
        if (textureasset) {
          var texture = textureasset.getInstance();
          //console.log('start the image!', texture);
        }
      }
      */
      if (this.video_id) {
        if (this.videoasset && this.videotexture) {
          var texture = this.videotexture;
          var video = texture.image;
          if (!video.playing && this.videoasset.auto_start) {
            video.play();
            //console.log('start the video!', texture);
          } else if (video.muted) {
            video.muted = false;
            video.play();
          }
        }
      }
      if (this.websurface_id) {
        if (!this.websurface) {
          this.createWebsurface();
        }
        this.websurface.start();
      }
    }
    this.stop = function() {
      elation.engine.things.janusobject.extendclass.stop.call(this);
      if (this.image_id) {
        var texture = elation.engine.assets.find('image', this.image_id);
        console.log('stop the image!', texture);
      }
      if (this.video_id) {
        //var texture = elation.engine.assets.find('video', this.video_id);
        //texture.image.pause();
        //console.log('stop the video!', texture);
        this.pause();
        // FIXME - this stops the video from loading any more data, but means we can't easily restart
        //         so we're hackishly working around that
        this.video.originalSrc = this.video.src;
        this.video.src = '';
      }
      if (this.websurface_id && this.websurface) {
        this.websurface.stop();
      }
    }
    this.handleVideoClick = function() {
      if (this.videotexture) {
        var video = this.videotexture.image;
        if (video.currentTime > 0 && !video.paused && !video.ended) {
          video.pause();
        } else {
          video.play();
        }
      }
    }
    this.handleAutoplayStart = function() {
      if (this.playbutton) {
        this.remove(this.playbutton);
      }
    }
    this.handleAutoplayFailed = function() {
      if (!this.playbutton) {
        this.playbutton = this.spawn('janustext', null, {
          janus: this.janus,
          room: this.room,
          text: 'play'
        });
        elation.events.add(this.playbutton, 'click', elation.bind(this, this.play));
      }
    }
    this.play = function() {
      if (!this.isPlaying()) {
        this.video.play();
      }
    }
    this.pause = function() {
      if (this.isPlaying()) {
        this.video.pause();
      }
    }
    this.isPlaying = function() {
      var video = this.video;
      return (video.currentTime > 0 && !video.paused && !video.ended);
    }
    this.seek = function(time) {
      if (this.video) this.video.currentTime = time;
    }
    this.getCurrentTime = function() {
      if (this.video) {
        return this.video.currentTime;
      }
      return 0;
    }
    this.getTotalTime = function() {
      if (this.video) {
        return this.video.duration;
      }
      return 0;
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusobject.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          id:  [ 'property', 'janusid'],
          url:  [ 'property', 'url'],
          image_id:  [ 'property', 'image_id'],
          video_id:  [ 'property', 'video_id'],
          lmap_id:  [ 'property', 'lmap_id'],
          envmap_id:  [ 'property', 'envmap_id'],
          websurface_id:  [ 'property', 'websurface_id'],

          lighting: [ 'property', 'lighting' ],
          shadow: [ 'property', 'shadow' ],
          shadow_receive: [ 'property', 'shadow_receive' ],
          shadow_cast: [ 'property', 'shadow_cast' ],
          cull_face: [ 'property', 'cull_face' ],
          blend_src: [ 'property', 'blend_src' ],
          blend_dest: [ 'property', 'blend_dest' ],

          // vide properties/functions
          current_time: [ 'accessor', 'getCurrentTime'],
          total_time: [ 'accessor', 'getTotalTime'],
          isPlaying: [ 'function', 'isPlaying'],
          play:    [ 'function', 'play'],
          pause:   [ 'function', 'pause'],
          toggle:  [ 'function', 'togglePlay'],
          seek:    [ 'function', 'seek'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusbase);
});
