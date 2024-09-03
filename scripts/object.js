elation.require(['janusweb.janusbase', 'janusweb.websurface'], function() {
  elation.component.add('engine.things.janusobject', function() {
    this.sidemap = {
      'back': THREE.FrontSide,
      'front': THREE.BackSide,
      'none': THREE.DoubleSide
    };
    this.depthFuncMap = {
      'never': THREE.NeverDepth,
      'always': THREE.AlwaysDepth,
      'equal': THREE.EqualDepth,
      'less': THREE.LessDepth,
      'lessequal': THREE.LessEqualDepth,
      'greaterequal': THREE.GreaterEqualDepth,
      'greater': THREE.GreaterDepth,
      'notequal': THREE.NotEqualDepth,
    };
    this.blendModeMap = {
      'normal': THREE.NormalBlending,
      'no': THREE.NoBlending,
      'additive': THREE.AdditiveBlending,
      'subtractive': THREE.SubtractiveBlending,
      'multiply': THREE.MultiplyBlending,
      'custom': THREE.CustomBlending,
    };
    this.blendFactorsMap = {
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
    };
    this.postinit = function() {
      elation.engine.things.janusobject.extendclass.postinit.call(this);
      this.defineProperties({
        janusid: { type: 'string', refreshGeometry: true },
        image_id: { type: 'string', set: this.updateMaterial, comment: 'Diffuse texture ID' },
        anim_id: { type: 'string', set: this.updateAnimation, comment: 'Current animation ID' },
        lmap_id: { type: 'string', set: this.updateMaterial, comment: 'Lightmap texture ID' },
        video_id: { type: 'string', set: this.updateVideo, comment: 'Video texture ID' },
        shader_id: { type: 'string', set: this.updateMaterial, comment: 'Shader ID' },
        shader_chunk_replace: { type: 'object' },
        url: { type: 'string', set: this.updateWebsurfaceURL },
        loop: { type: 'boolean' },
        websurface_id: { type: 'string', set: this.updateWebsurface, comment: 'WebSurface ID' },
        shadow: { type: 'boolean', default: true, set: this.updateMaterial },
        shadow_receive: { type: 'boolean', default: true, set: this.updateMaterial, comment: 'Receive shadows from self and other objects' },
        shadow_cast: { type: 'boolean', default: true, set: this.updateMaterial, comment: 'Cast shadows onto self and other objects' },
        shadow_side: { type: 'string', default: '', set: this.updateMaterial, comment: 'Cast shadows onto front, back, both, or auto (empty)' },
        wireframe: { type: 'boolean', default: false, set: this.updateMaterial, comment: 'Wireframe rendering' },
        fog: { type: 'boolean', default: true, set: this.updateMaterial, comment: 'Object is affected by fog' },
        lights: { type: 'boolean', default: false, comment: 'Load lights from model' },
        lighting: { type: 'boolean', default: true, set: this.updateMaterial, comment: 'Object reacts to scene lighting' },
        cull_face: { type: 'string', default: 'back', set: this.updateMaterial, comment: 'Hide face sides (back, front, or none)' },
        blend_src: { type: 'string', set: this.updateMaterial, comment: 'Blend mode (source)' },
        blend_dest: { type: 'string', set: this.updateMaterial, comment: 'Blend mode (destination)' },
        blend_mode: { type: 'string', default: null, set: this.updateMaterial, comment: 'Blend mode' },
        depth_write: { type: 'boolean', default: null, set: this.updateMaterial },
        depth_test: { type: 'boolean', default: null, set: this.updateMaterial },
        depth_offset: { type: 'float', default: null, set: this.updateMaterial },
        depth_func: { type: 'string', default: null, set: this.updateMaterial },
        color_write: { type: 'boolean', default: null, set: this.updateMaterial },
        envmap_id: { type: 'string', set: this.updateMaterial, comment: 'Environment map texture ID (overrides skybox reflections)' },
        normalmap_id: { type: 'string', set: this.updateMaterial, comment: 'Normal map texture ID' },
        bumpmap_id: { type: 'string', set: this.updateMaterial, comment: 'Bumpmap texture ID' },
        bumpmap_scale: { type: 'float', default: 1.0, set: this.updateMaterial, comment: 'Bumpmap scale' },
        alphamap_id: { type: 'string', set: this.updateMaterial, comment: 'Alpha map texture ID' },
        displacementmap_id: { type: 'string', set: this.updateMaterial, comment: 'Displacement map texture ID' },
        displacementmap_scale: { type: 'float', default: 1, set: this.updateMaterial, comment: 'Displacement map height scale' },
        texture_offset: { type: 'vector2', default: [0, 0], set: this.updateTextureOffsets },
        texture_repeat: { type: 'vector2', default: [1, 1], set: this.updateTextureOffsets },
        texture_rotation: { type: 'float', default: 0, set: this.updateMaterial },
        emissive_id: { type: 'string', set: this.updateMaterial, comment: 'Emissive map texture ID' },
        roughness_id: { type: 'string', set: this.updateMaterial, comment: 'Roughness map texture ID' },
        metalness_id: { type: 'string', set: this.updateMaterial, comment: 'Metalness map texture ID' },
        emissive: { type: 'color', default: null, set: this.updateMaterial, comment: 'Material emissive color' },
        emissive_intensity: { type: 'float', default: 1, set: this.updateMaterial, comment: 'Intensity of material emissive color' },
        roughness: { type: 'float', default: null, min: 0, max: 1, set: this.updateMaterial, comment: 'Material roughness value' },
        metalness: { type: 'float', default: null, set: this.updateMaterial, comment: 'Material metalness value' },
        transmission: { type: 'float', default: 0, set: this.updateMaterial, comment: 'Material transmission value' },
        usevertexcolors: { type: 'boolean', default: true, set: this.updateMaterial },
        gain: { type: 'float', default: 1.0, set: this.updateAudioNodes },
        onloadstart: { type: 'callback' },
        onloadprogress: { type: 'callback' },
        onload: { type: 'callback' },
        onbeforerender: { type: 'callback', set: this.setupOnBeforeRenderListener },
      });
      //elation.events.add(this, 'thing_init3d', elation.bind(this, this.assignTextures));

      this.handleFrameUpdates = elation.bind(this, this.handleFrameUpdates);
      this.refresh = elation.bind(this, this.refresh);
      if (this.anim_id) {
        this.setAnimation(this.anim_id);
      }

    }
    this.createObject3D = function() {
      if (this.properties.exists === false) return;

      var object = null, geometry = null, material = null;
      if (this.object && this.object instanceof THREE.Object3D) {
        this.properties.position.copy(this.object.position);
        this.properties.orientation.copy(this.object.quaternion);
        object = this.object;
        setTimeout(() => { this.handleLoad(); this.assignTextures(); }, 100);
      } else if (this.janusid) {
        var asset = this.getAsset('model', this.janusid, true);
        this.dispatchEvent({type: 'loadstart'});
        if (asset) {
          if (asset.loaded) {
            setTimeout(elation.bind(this, this.handleLoad), 0);
          } else {
            //this.loadingindicator = this.createObject('object', {});
/*
            this.loadingindicator = this.createObject('particle', {
              col: 'green',
              scale: V(.025),
              vel: V(-1, 0, -1),
              accel: V(0, -5, 0),
              rand_vel: V(2, 2, 2),
              count: 25,
              rate: 50,
              duration: .5,
              collidable: false,
              collision_trigger: true,
              loop: true,
            });
*/
            //elation.events.add(asset, 'asset_load_queued,asset_load_start,asset_load_progress,asset_load_processing,asset_load_complete', ev => { console.log(ev.type, this, ev); });
            elation.events.add(asset, 'asset_load_complete', elation.bind(this, this.handleLoad));
            elation.events.add(asset, 'asset_load_progress', (ev) => { this.dispatchEvent({type: 'loadprogress', data: ev.data}); });
          }
          object = asset.getInstance();
        }
      }
      if (!object) {
        object = new THREE.Object3D();
      }
      if (this.renderorder) object.renderOrder = this.renderorder;

      return object;
    }
    this.createChildren = function() {
      elation.engine.things.janusobject.extendclass.createChildren.call(this);

      //this.properties.collidable = false;

      //this.updateColliderFromGeometry(new THREE.BoxGeometry(1,1,1));

      elation.events.add(this.room, 'skybox_update', ev => this.updateSkybox());
    }
    this.createForces = function() {
      elation.engine.things.janusobject.extendclass.createForces.call(this);
      if (!(this.collidable || this.pickable)) return;
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
      if (!this.assetloaded) {
        this.setTextureDirty();
        setTimeout(elation.bind(this, function() {
          this.dispatchEvent({type: 'load'});
        }), 0);
        this.jsparts.updateParts();
        this.assetloaded = true;
        if (this.modelasset) {
          this.initAnimations(this.modelasset.animations);
          if (this.animations && this.anim_id && this.animations[this.anim_id]) {
            //console.log('start animation', this);
            this.animations[this.anim_id].play();
            this.activeanimation = this.animations[this.anim_id];
          }
        }
        if (this.loadingindicator) {
          this.loadingindicator.die();
        }
      }
    }
    this.updateMaterial = function() {
      this.setTextureDirty();
    }
    this.updateVideo = function() {
      if (!this.modelasset) return;
      if (this.videotexture) {
        if (this.videotexture.image) {
          this.videotexture.image.pause();
        }
      }
      if (!this.videoasset || this.videoasset.name != this.video_id) {
        if (this.video_id && this.video_id != '' && !this.image_id) {
          this.loadVideo(this.video_id);
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
        let texture = videoasset.getInstance();
        if (!texture.image) {
          videoasset.load();
        }
        if (videoasset.sbs3d) {
          //texture.repeat.set(0.5, 1);
          this.texture_repeat.set(0.5, 1);
        } else if (videoasset.ou3d) {
          //texture.repeat.set(1, 0.5);
          this.texture_repeat.set(1, 0.5);
        } else {
          //this.texture_repeat.set(1, 1);
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

        if (videoasset.auto_play && texture.image) {
          texture.image.addEventListener('canplaythrough', function() {
            if (texture.image) {
              texture.image.play();
            }
          });
        }

        // Refresh this object whenever the video has a new frame for us to display
        texture.onUpdate = (e) => this.refresh();

        this.video = texture.image;
        this.video.volume = this.gain;

        elation.events.add(this, 'click', elation.bind(this, this.handleVideoClick));
        this.room.videos[videoid] = this;
        if (this.modelasset && texture) {
          this.assignTextureParameters(texture, this.modelasset, videoasset);
        }
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
        } else {
          this.url = this.websurface_id;
        }
/*
        this.pickable = false;
        this.collidable = false;
*/
        if (!this.collision_id) {
          this.collision_id = this.janusid;
        }

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
      elation.events.add(this, 'click', elation.bind(this.websurface, this.websurface.click));
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
      this.traverseObjects(function(n) {
        if (n.material) n.material = blankmaterial;
      });
    }
    this.updateWebsurfaceURL = function() {
      if (this.websurface) {
        this.websurface.url = this.url;
      }
    }
    this.setTextureDirty = function() {
      this.textureNeedsUpdate = true;
    }
    this.handleFrameUpdates = function(ev) {
      elation.engine.things.janusobject.extendclass.handleFrameUpdates.call(this, ev);
      if (this.textureNeedsUpdate) {
        this.assignTextures();
      }
      if (this.shader) {
        if (this.shader.uniforms.time) {
          this.shader.uniforms.time.value = performance.now() / 1000;
          this.refresh();
        }
      }
      if (this.animationmixer) {
        //this.animationmixer.setTime(new Date().getTime() / 1000);
        this.animationmixer.update(ev.data);
        this.refresh();
      }
    }
    this.assignTextures = function() {
      //console.log('assign textures', this.name, this.objects['3d']);
      if (!this.objects['3d']) return;
      if (!this.assetloadhandlers) {
        this.assetloadhandlers = {};
      }
      var modelasset = this.modelasset,
          shadermaterial = false,
          texture = null,
          textureLightmap = null,
          textureNormal = null,
          textureBump = null,
          textureAlpha = null,
          textureDisplacement = null,
          textureEmissive = null,
          textureRoughness = null,
          textureMetalness = null,
          color = false,
          blend_src = false,
          blend_dest = false,
          side = this.sidemap[this.properties.cull_face],
          shadowside = this.sidemap[this.properties.shadow_side || this.properties.cull_face],
          textureasset,
          lightmaptextureasset,
          emissivetextureasset,
          roughnesstextureasset,
          metalnesstextureasset;

      this.textureNeedsUpdate = false;

      var image_id = this.image_id,
          normal_image_id = this.normalmap_id,
          bump_image_id = this.bumpmap_id,
          alpha_image_id = this.alphamap_id,
          displacement_image_id = this.displacementmap_id,
          lightmap_image_id = this.lmap_id,
          emissive_image_id = this.emissive_id,
          roughness_image_id = this.roughness_id,
          metalness_image_id = this.metalness_id,
          image_linear = true;
      if (this.janusid) {
        if (!modelasset || modelasset.name != this.janusid) {
          modelasset = this.getAsset('model', this.janusid, true);
          this.modelasset = modelasset;

          if (modelasset.animations) {
            this.initAnimations(modelasset.animations);
            if (this.anim_id) {
              if (modelasset && modelasset.loaded) {
                this.setAnimation(this.anim_id);
              } else {
                elation.events.add(modelasset, 'asset_load', () => this.setAnimation(this.anim_id));
              }
            }
          }

        }
        if (modelasset.tex) {
          image_id = modelasset.tex;
        }
        if (modelasset.tex0) {
          image_id = modelasset.tex0;
          image_linear = (modelasset.tex_linear != 'false');
        }
      }
      if (image_id) {
        textureasset = this.getAsset('image', image_id, {tex_linear: image_linear});
        if (!textureasset) { // no image found, try video
          textureasset = this.getAsset('video', image_id, {tex_linear: image_linear});
        }
        if (textureasset) {
          texture = textureasset.getInstance();
          this.textureasset = textureasset;
          if (!this.assetloadhandlers[texture.uuid]) {
            this.assetloadhandlers[texture.uuid] = true;
            elation.events.add(textureasset, 'asset_load', this.refresh);
            elation.events.add(texture, 'asset_update', this.refresh);
          }

          //texture.offset.copy(this.texture_offset);
          //texture.repeat.copy(this.texture_repeat);
          //texture.rotation = this.texture_rotation * THREE.MathUtils.DEG2RAD;

          if (texture) {
            this.assignTextureParameters(texture, modelasset, textureasset);
            if (textureasset.sbs3d) {
              texture.repeat.set(0.5, 1);
              this.texture_repeat.set(0.5, 1);
            } else if (textureasset.ou3d) {
              texture.repeat.set(1, 0.5);
              this.texture_repeat.set(1, 0.5);
            } else {
              //texture.repeat.set(1, 1);
              //this.texture_repeat.set(1, 1);
            }
          }
        }
      }
      if (normal_image_id) {
        let normaltextureasset = this.getAsset('image', normal_image_id, false);
        if (!normaltextureasset) { // no image found, try video
          normaltextureasset = this.getAsset('video', normal_image_id);
        }
        if (normaltextureasset) {
          textureNormal = normaltextureasset.getInstance();
          if (!this.assetloadhandlers[textureNormal.uuid]) {
            this.assetloadhandlers[textureNormal.uuid] = true;
            elation.events.add(textureNormal, 'asset_load', elation.bind(this, this.refresh));
            elation.events.add(textureNormal, 'asset_update', elation.bind(this, this.refresh));
          }

          if (normaltextureasset.sbs3d) {
            textureNormal.repeat.set(0.5, 1);
          } else if (normaltextureasset.ou3d) {
            textureNormal.repeat.set(1, 0.5);
          } else {
            textureNormal.repeat.set(1, 1);
          }
          if (textureNormal) {
            //this.assignTextureParameters(textureNormal, modelasset, textureasset);
          }
        }
      }
      if (bump_image_id) {
        let bumptextureasset = this.getAsset('image', bump_image_id, true);
        if (bumptextureasset) {
          textureBump = bumptextureasset.getInstance();
          if (!this.assetloadhandlers[textureBump.uuid]) {
            this.assetloadhandlers[textureBump.uuid] = true;
            elation.events.add(bumptextureasset, 'asset_load', elation.bind(this, this.refresh));
            elation.events.add(textureBump, 'asset_update', elation.bind(this, this.refresh));
          }
          if (bumptextureasset.sbs3d) {
            textureBump.repeat.set(0.5, 1);
          } else if (bumptextureasset.ou3d) {
            textureBump.repeat.set(1, 0.5);
          } else {
            textureBump.repeat.set(1, 1);
          }
          if (textureBump) {
            //this.assignTextureParameters(textureNormal, modelasset, textureasset);
          }
        }
      }
      if (alpha_image_id) {
        let alphatextureasset = this.getAsset('image', alpha_image_id, true);
        if (alphatextureasset) {
          textureAlpha = alphatextureasset.getInstance();
          if (!this.assetloadhandlers[textureAlpha.uuid]) {
            this.assetloadhandlers[textureAlpha.uuid] = true;
            elation.events.add(alphatextureasset, 'asset_load', elation.bind(this, this.refresh));
            elation.events.add(textureAlpha, 'asset_update', elation.bind(this, this.refresh));
          }
          if (alphatextureasset.sbs3d) {
            textureAlpha.repeat.set(0.5, 1);
          } else if (alphatextureasset.ou3d) {
            textureAlpha.repeat.set(1, 0.5);
          } else {
            textureAlpha.repeat.set(1, 1);
          }
        }
      }
      if (displacement_image_id) {
        let displacementtextureasset = this.getAsset('image', displacement_image_id);
        if (!displacementtextureasset) { // no image found, try video
          displacementtextureasset = this.getAsset('video', displacement_image_id);
        }
        if (displacementtextureasset) {
          textureDisplacement = displacementtextureasset.getInstance();
          if (!this.assetloadhandlers[textureDisplacement.uuid]) {
            this.assetloadhandlers[textureDisplacement.uuid] = true;
            elation.events.add(displacementtextureasset, 'asset_load', elation.bind(this, this.refresh));
            elation.events.add(textureDisplacement, 'asset_update', elation.bind(this, this.refresh));
          }
          if (displacementtextureasset.sbs3d) {
            textureDisplacement.repeat.set(0.5, 1);
          } else if (displacementtextureasset.ou3d) {
            textureDisplacement.repeat.set(1, 0.5);
          } else {
            textureDisplacement.repeat.set(1, 1);
          }
          if (textureDisplacement) {
            this.assignTextureParameters(textureDisplacement, modelasset, textureasset);
          }
        }
      }
      if (lightmap_image_id) {
        lightmaptextureasset = this.getAsset('image', lightmap_image_id);
        if (lightmaptextureasset) {
          textureLightmap = lightmaptextureasset.getInstance();
          if (!this.assetloadhandlers[textureLightmap.uuid]) {
            this.assetloadhandlers[textureLightmap.uuid] = true;
            elation.events.add(lightmaptextureasset, 'asset_load', elation.bind(this, this.setTextureDirty));
            elation.events.add(textureLightmap, 'asset_update', elation.bind(this, this.refresh));
          }

          if (textureLightmap) {
            this.assignTextureParameters(textureLightmap, modelasset, lightmaptextureasset);
          }
        }
      }
      if (emissive_image_id) {
        emissivetextureasset = this.getAsset('image', emissive_image_id);
        if (!emissivetextureasset) { // no image found, try video
          emissivetextureasset = this.getAsset('video', emissive_image_id);
        }
        if (emissivetextureasset) {
          textureEmissive = emissivetextureasset.getInstance();
          if (!this.assetloadhandlers[textureEmissive.uuid]) {
            this.assetloadhandlers[textureEmissive.uuid] = true;
            elation.events.add(emissivetextureasset, 'asset_load', elation.bind(this, this.setTextureDirty));
            elation.events.add(textureEmissive, 'asset_update', elation.bind(this, this.refresh));
          }

          if (textureEmissive) {
            this.assignTextureParameters(textureEmissive, modelasset, emissivetextureasset);
          }
        }
      }
      if (roughness_image_id) {
        roughnesstextureasset = this.getAsset('image', roughness_image_id);
        if (roughnesstextureasset) {
          textureRoughness = roughnesstextureasset.getInstance();
          if (!this.assetloadhandlers[textureRoughness.uuid]) {
            this.assetloadhandlers[textureRoughness.uuid] = true;
            elation.events.add(roughnesstextureasset, 'asset_load', elation.bind(this, this.setTextureDirty));
            elation.events.add(textureRoughness, 'asset_update', elation.bind(this, this.refresh));
          }

          if (textureRoughness) {
            this.assignTextureParameters(textureRoughness, modelasset, roughnesstextureasset);
          }
        }
      }
      if (metalness_image_id) {
        metalnesstextureasset = this.getAsset('image', metalness_image_id);
        if (metalnesstextureasset) {
          textureMetalness = metalnesstextureasset.getInstance();
          if (!this.assetloadhandlers[textureMetalness.uuid]) {
            this.assetloadhandlers[textureMetalness.uuid] = true;
            elation.events.add(metalnesstextureasset, 'asset_load', elation.bind(this, this.setTextureDirty));
            elation.events.add(textureMetalness, 'asset_update', elation.bind(this, this.refresh));
          }

          if (textureMetalness) {
            this.assignTextureParameters(textureMetalness, modelasset, metalnesstextureasset);
          }
        }
      }
      if (this.video_id && this.video_id != '' && !this.image_id) {
        this.loadVideo(this.video_id);
        texture = this.videotexture;
        if (texture) {
          this.assignTextureParameters(texture, modelasset, this.videoasset);
          if (this.videoasset.sbs3d) {
            texture.repeat.set(.5, 1);
          } else if (this.videoasset.ou3d) {
            texture.repeat.set(1, .5);
          } else {
            texture.repeat.set(1, 1);
          }
        }
      }
      if (this.websurface_id && this.websurface) {
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
      let srcfactors = this.blendFactorsMap;
      if (srcfactors[this.properties.blend_src]) {
        blend_src = srcfactors[this.properties.blend_src];
      }
      if (srcfactors[this.properties.blend_dest]) {
        blend_dest = srcfactors[this.properties.blend_dest];
      }

      var scene = this.engine.systems.world.scene['world-3d'];
      if (!this.hasalpha) this.hasalpha = {};
      var hasalpha = this.hasalpha;
      var remove = [];

      if (this.shader_id) {
        let shader = this.getAsset('shader', this.shader_id);
        if (shader) {
          shadermaterial = shader.getInstance();
          shadermaterial.uniforms = this.room.parseShaderUniforms(shader.uniforms);
          shadermaterial.side = this.sidemap[this.properties.cull_face];
          shadermaterial.shadowSide = shadowside
          shadermaterial.receiveShadow = this.shadow && this.shadow_receive;
          shadermaterial.castShadow = this.shadow && this.shadow_cast;
          shadermaterial.renderOrder = this.renderorder;
          if (blend_src || blend_dest) {
            if (blend_src) shadermaterial.blendSrc = blend_src;
            if (blend_dest) shadermaterial.blendDst = blend_dest;
            shadermaterial.blending = THREE.CustomBlending;

            shadermaterial.blendSrcAlpha = THREE.SrcAlphaFactor;
            shadermaterial.blendDstAlpha = THREE.OneFactor;
            if (!(this.blend_src == 'src_alpha' && this.blend_dest == 'one_minus_src_alpha')) {
              shadermaterial.transparent = true;
            }
          } else {
            shadermaterial.blending = THREE.NormalBlending;
          }
          if (this.depth_write !== null) {
            shadermaterial.depthWrite = this.depth_write;
          }
          if (this.depth_test !== null) {
            shadermaterial.depthTest = this.depth_test;
          }
          if (this.color_write !== null) {
            shadermaterial.colorWrite = this.color_write;
          }
          this.traverseObjects((n) => {
            if (n.material) {
              if (Array.isArray(n.material)) {
                for (let i = 0; i < n.material.length; i++) {
                  n.material[i] = shadermaterial;
                }
              } else {
                n.material = shadermaterial;
              }
            }
          });
          this.shader = shadermaterial;
          return;
        }
      } 

      if (!this.materialclones) {
        this.materialclones = {};
      }
      let materialclones = this.materialclones;

      this.traverseObjects(elation.bind(this, function(n) { 
        n.receiveShadow = this.shadow && this.shadow_receive;
        n.castShadow = this.shadow && this.shadow_cast;
        n.renderOrder = this.renderorder;

        var useSkinning = n instanceof THREE.SkinnedMesh;
        var useVertexColors = this.usevertexcolors && (n instanceof THREE.Mesh && n.geometry instanceof THREE.BufferGeometry && n.geometry.attributes.color);
        if (n.material) {
          var materials = [];
          if (elation.utils.isArray(n.material)) {
            //materials = [n.material.materials[1]];
            for (var i = 0; i < n.material.length; i++) {
              let m = n.material[i];
              let cloneMaterial = this.materialNeedsCopy(m);
              if (cloneMaterial) {
                let newm = this.copyMaterial(m);
                materialclones[m.uuid] = newm;
              } else {
                materialclones[m.uuid] = m;
              }
              materials.push(materialclones[m.uuid]);
            }
            n.material = materials;
          } else {
            let m = n.material;
            let cloneMaterial = this.materialNeedsCopy(m);
            if (cloneMaterial) {
              let newm = this.copyMaterial(m);
              materialclones[m.uuid] = newm;
            } else {
              materialclones[m.uuid] = m;
            }
            materials.push(materialclones[m.uuid]);
            n.material = materialclones[m.uuid];
          }

          for (var i = 0; i < materials.length; i++) {
            let m = materials[i];
            if (color) {
              m.color = color;
            }
            if (texture) {
              //if (!color) m.color.setHex(0xffffff);
              m.map = texture;
              texture.encoding = THREE.sRGBEncoding;
              if (false && !this.assetloadhandlers[texture.uuid]) {
                this.assetloadhandlers[texture.uuid] = true;
                elation.events.add(texture, 'asset_update', (ev) => {
                  m.map = ev.data;
                  this.updateTextureOffsets();
                  this.refresh();
                });
              }

              m.transparent = (this.transparent !== null ? this.transparent : (textureasset && textureasset.hasalpha) || m.opacity < 1);
            } else if (m.map && m.map.sourceFile) {
              var imagesrc = m.map.sourceFile;
              var asset = this.getAsset('image', imagesrc, true);
              if (asset) {
                if (asset.hasalpha) {
                  m.transparent = true;
                  m.alphaTest = this.alphatest;
                }
                m.map = asset.getInstance();
                m.map.encoding = THREE.sRGBEncoding;
                if (!this.assetloadhandlers[m.map.uuid]) {
                  this.assetloadhandlers[m.map.uuid] = true;
                  elation.events.add(m.map, 'asset_update', elation.bind(this, function(ev) {
                    m.map = ev.data;
                    this.updateTextureOffsets();
                  }));
                  elation.events.add(asset, 'asset_load', elation.bind(this, function(m, asset, ev) {
                    if (asset.hasalpha && !m.transparent) {
                      m.transparent = true;
                      m.alphaTest = this.alphatest;
                      //m.needsUpdate = true;
                    }
                    this.refresh();
                  }, m, asset));
                }
              }
              if (m.map) {
                this.assignTextureParameters(m.map, modelasset, asset);
              }
            }
            if (m.normalMap) {
              var imagesrc = m.normalMap.sourceFile;
              var asset = this.getAsset('image', imagesrc, {id: imagesrc, src: imagesrc, hasalpha: false, srgb: false});
              if (asset) {
                m.normalMap = asset.getInstance();
                if (!this.assetloadhandlers[m.normalMap.uuid]) {
                  this.assetloadhandlers[m.normalMap.uuid] = true;
                  elation.events.add(m.normalMap, 'asset_update', elation.bind(this, function(ev) {
                    m.normalMap = ev.data; this.refresh();
                    this.updateTextureOffsets();
                  }));
                  elation.events.add(asset, 'asset_load', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
                }
              }
            } else if (textureBump) {
              m.bumpMap = textureBump;
              m.bumpScale = this.bumpmap_scale;
            } else if (m.bumpMap) {
              var imagesrc = m.bumpMap.sourceFile;
              var asset = this.getAsset('image', imagesrc, {id: imagesrc, src: imagesrc, hasalpha: false, srgb: false});
              if (asset) {
                m.normalMap = asset.getInstance();
                if (!this.assetloadhandlers[m.normalMap.uuid]) {
                  this.assetloadhandlers[m.normalMap.uuid] = true;
                  elation.events.add(m.bumpMap, 'asset_update', elation.bind(this, function(ev) {
                    m.normalMap = ev.data; this.refresh();
                    m.normalMap.offset.copy(this.texture_offset);
                    m.normalMap.repeat.copy(this.texture_repeat);
                    m.normalMap.rotation = this.texture_rotation * THREE.MathUtils.DEG2RAD;
                  }));
                  elation.events.add(asset, 'asset_load', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
                }
              }
            }
            if (textureNormal) {
              m.normalMap = textureNormal;
            } else if (m.normalMap) {
              var imagesrc = m.normalMap.sourceFile;
              var asset = this.getAsset('image', imagesrc, {id: imagesrc, src: imagesrc, hasalpha: false, srgb: false});
              if (asset) {
                m.normalMap = asset.getInstance();
                if (!this.assetloadhandlers[m.normalMap.uuid]) {
                  this.assetloadhandlers[m.normalMap.uuid] = true;
                  elation.events.add(m.normalMap, 'asset_update', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
                  elation.events.add(asset, 'asset_load', elation.bind(this, function(ev) { m.normalMap = ev.data; this.refresh(); }));
                }
              }
            }

            if (textureLightmap && textureLightmap.image) {
              if (lightmaptextureasset.loaded) {
                m.lightMap = textureLightmap; 
                if (!this.assetloadhandlers[m.lightMap.uuid]) {
                  this.assetloadhandlers[m.lightMap.uuid] = true;
                  elation.events.add(textureLightmap, 'asset_update', elation.bind(m, function(ev) { m.lightMap = ev.data; this.refresh(); }));
                }
              }
            } else if (m.lightMap) {
              var imagesrc = m.lightMap.sourceFile;
              if (!this.assetloadhandlers[m.lightMap.uuid]) {
                this.assetloadhandlers[m.lightMap.uuid] = true;
                var asset = this.getAsset('image', imagesrc, {id: imagesrc, src: imagesrc, hasalpha: false});
                if (asset) {
                  m.lightMap = asset.getInstance();
                  elation.events.add(asset, 'asset_load', elation.bind(this, function(ev) { m.lightMap = ev.data; this.refresh();}));
                  elation.events.add(m.lightMap, 'asset_update', elation.bind(this, function(ev) { m.lightMap = ev.data; this.refresh(); }));
                }
              }
            }
            if (textureDisplacement) {
              m.displacementMap = textureDisplacement;
              m.displacementScale = this.displacementmap_scale;
            }
            if (this.lighting) {
              if (textureEmissive) {
                m.emissiveMap = textureEmissive;
                textureEmissive.encoding = THREE.sRGBEncoding;
                m.emissive = new THREE.Color(0xffffff);
              } else if (m.emissiveMap) {
                m.emissiveMap.encoding = THREE.sRGBEncoding;
              } else if (this.emissive) {
                //m.emissive = this.emissive.clone();
                m.emissive.copy(this.emissive)
              }
              m.emissiveIntensity = this.emissive_intensity;
            } else {
              if (textureEmissive) {
                m.map = textureEmissive;
                textureEmissive.encoding = THREE.sRGBEncoding;
                m.color = new THREE.Color(0xffffff);
              }
            }
            if (textureAlpha) {
              m.alphaMap = textureAlpha;
              m.transparent = true;
            }
            if (textureRoughness) {
              m.roughnessMap = textureRoughness;
            } else if (this.roughness !== null) {
              m.roughness = this.roughness;
            }
            if (textureMetalness) {
              m.metalnessMap = textureMetalness;
            } else if (this.metalness !== null) {
              m.metalness = this.metalness;
            }
            if (this.transmission !== null) {
              m.transmission = this.transmission;
            }

            if (this.isUsingPBR() && !this.isUsingToonShader()) {
              m.envMap = this.getEnvmap();
              m.envMapIntensity = room.skybox_intensity;
            }

            //m.roughness = 0.75;
            m.side = side;
            m.shadowSide = shadowside;

            if (blend_src || blend_dest) {
              if (blend_src) m.blendSrc = blend_src;
              if (blend_dest) m.blendDst = blend_dest;
              m.blending = THREE.CustomBlending;

              m.blendSrcAlpha = THREE.SrcAlphaFactor;
              m.blendDstAlpha = THREE.OneFactor;
              if (!(this.blend_src == 'src_alpha' && this.blend_dest == 'one_minus_src_alpha')) {
                m.transparent = true;
              }
            } else if (this.blend_mode) {
              m.blending = this.blendModeMap[this.blend_mode];
            }
            if (this.depth_write !== null) {
              m.depthWrite = this.depth_write;
            }
            if (this.depth_test !== null) {
              m.depthTest = this.depth_test;
            }
            if (this.depth_func !== null) {
              m.depthFunc = this.depthFuncMap[this.depth_func];
            } else {
              m.depthFunc = this.depthFuncMap['lessequal'];
            }
            if (this.depth_offset !== null) {
              m.polygonOffset = true;
              m.polygonOffsetUnits = 1;
              m.polygonOffsetFactor = -this.depth_offset;
            } else {
              m.polygonOffset = false;
            }
            if (this.color_write !== null) {
              m.colorWrite = this.color_write;
            }
            // If our diffuse texture has an alpha channel, set up a customDepthMaterial / customDistanceMaterial to allow shadows to work
            if (m.map) { //this.shadow && m.transparent && m.map) {
              if (!n.customDepthMaterial) {
                n.customDepthMaterial = new THREE.MeshDepthMaterial({
                  depthPacking: THREE.RGBADepthPacking,
                  map: m.map,
                  alphaTest: 0.5
                });
              }
              if (!n.customDistanceMaterial) {
                n.customDistanceMaterial = new THREE.MeshDistanceMaterial({
                  //depthPacking: THREE.RGBADepthPacking,
                  map: m.map,
                  alphaTest: 0.5
                });
              }
            }
            //m.needsUpdate = true;
            m.skinning = useSkinning;
            if (useVertexColors) {
              m.vertexColors = true;
            } else {
              m.vertexColors = false
            }
            m.fog = this.fog;
            m.wireframe = this.wireframe;
          }
        } else if (n instanceof THREE.Light && !this.lights) {
          remove.push(n);
        }
      }));
      for (var i = 0; i < remove.length; i++) {
        remove[i].parent.remove(remove[i]);
      }
      this.updateTextureOffsets();
      this.refresh();
    }
    this.materialNeedsCopy = function(m) {
      let cloneMaterial = false;
      let materialclones = this.materialclones;
      if (!materialclones[m.uuid] || !m.cloned) {
        cloneMaterial = true;
      } else if (texture !== m.map ||
                 textureLightmap !== m.lightMap ||
                 textureNormal !== m.normalMap ||
                 textureBump !== m.bumpMap ||
                 textureDisplacement !== m.displacementMap ||
                 textureEmissive !== m.emissiveMap ||
                 textureRoughness !== m.roughnessMap ||
                 textureMetalness !== m.metalnessMap) {
        cloneMaterial = true;
      } else {
        // Check to see if any parameters have changed which would require a new material
        if ((this.lighting && m instanceof THREE.MeshBasicMaterial) || (!this.lighting && !(m instanceof THREE.MeshBasicMaterial))) {
          // The lighting flag changed since the material was created, so let's start fresh
          cloneMaterial = true;
        }
      }
      return cloneMaterial;
    }
    this.copyMaterial = function(oldmat) {
      if (elation.utils.isArray(oldmat)) {
        var materials = [];
        for (var i = 0; i < oldmat.length; i++) {
          materials.push(this.copyMaterial(oldmat[i]));
        }
        var m = materials;
      } else if (oldmat instanceof THREE.PointsMaterial ||
                 oldmat instanceof THREE.LineBasicMaterial ||
                 oldmat instanceof THREE.LineDashedMaterial ||
                 oldmat instanceof THREE.ShaderMaterial
                ) {
        var m = oldmat;
      } else {
        var m = this.allocateMaterial();
        m.dithering = true;
        m.anisotropy = 16;
        m.name = oldmat.name;
        m.map = oldmat.map;
        m.cloned = true;
        m.opacity = (typeof oldmat.opacity != 'undefined' ? parseFloat(oldmat.opacity) : 1) * this.opacity;
        m.alphaTest = this.alphatest;
        m.aoMap = oldmat.aoMap;
        if (!(m instanceof THREE.MeshBasicMaterial)) {
          m.normalMap = oldmat.normalMap;
          m.bumpMap = oldmat.bumpMap;

          if (oldmat.emissiveMap) {
            m.emissiveMap = oldmat.emissiveMap;
            m.emissive.setRGB(1,1,1);
          } else if (oldmat.emissive) {
            m.emissive = oldmat.emissive.clone();

            // FIXME - this logic needs some work, we shouldn't apply the object's emissive property unless it's a non-default value
            if (this.emissive) {
              m.emissive.copy(this.emissive);
            }
          }
          if (oldmat.emissiveIntensity !== undefined) m.emissiveIntensity = oldmat.emissiveIntensity;
        } else {
          if (oldmat.emissiveMap && !oldmat.map) {
            m.map = oldmat.emissiveMap;
            oldmat.color.setRGB(1,1,1);
          }
        }

        m.lightMap = oldmat.lightMap;
        if (oldmat.color) {
          m.color.copy(oldmat.color);
        }
        m.transmission = oldmat.transmission;
        m.transmissionMap = oldmat.transmissionMap;
        m.transparent = oldmat.transparent || m.opacity < 1;
        m.alphaTest = oldmat.alphaTest;
        m.skinning = oldmat.skinning;

        if (oldmat.metalness !== undefined) m.metalness = oldmat.metalness;
        if (oldmat.metalnessMap !== undefined) m.metalnessMap = oldmat.metalnessMap;
        if (oldmat.roughness !== undefined) m.roughness = oldmat.roughness;
        if (oldmat.roughnessMap !== undefined) m.roughnessMap = oldmat.roughnessMap;
        if (oldmat.clearcoat !== undefined) m.clearcoat =  oldmat.clearcoat;
        if (oldmat.clearcoatMap !== undefined) m.clearcoatMap = oldmat.clearcoatMap;
        if (oldmat.clearcoatRoughness !== undefined) m.clearcoatRoughness = oldmat.clearcoatRoughness;
        if (oldmat.clearcoatRoughnessMap !== undefined) m.clearcoatRoughnessMap = oldmat.clearcoatRoughnessMap;
        if (oldmat.clearcoatNormalMap !== undefined) m.clearcoatNormalMap = oldmat.clearcoatNormalMap;
        if (oldmat.clearcoatNormalScale !== undefined) m.clearcoatNormalScale = oldmat.clearcoatNormalScale;
        if (oldmat.attenuationTint !== undefined) m.attenuationTint = oldmat.attenuationTint;
        if (oldmat.attenuationColor !== undefined) m.attenuationColor = oldmat.attenuationColor;
        if (oldmat.attenuationDistance !== undefined) m.attenuationDistance = oldmat.attenuationDistance;
        if (oldmat.thickness !== undefined) m.thickness = oldmat.thickness;
        if (oldmat.thicknessMap !== undefined) m.thicknessMap = oldmat.thicknessMap;
        if (oldmat.transmission !== undefined) m.transmission = oldmat.transmission;
        if (oldmat.transmissionMap !== undefined) m.transmissionMap = oldmat.transmissionMap;

        //m.reflectivity = (oldmat.reflectivity !== undefined ? oldmat.reflectivity : .5);

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

        if (this.shader_chunk_replace) {
          let chunkreplace = (elation.utils.isString(this.shader_chunk_replace) ? JSON.parse(this.shader_chunk_replace) : this.shader_chunk_replace);
          m.onBeforeCompile = function(shader) {
            for (let oldchunkname in chunkreplace) {
              let newchunkname = chunkreplace[oldchunkname];
              shader.vertexShader = shader.vertexShader.replace('#include <' + oldchunkname + '>', '#include <' + newchunkname + '>');
              shader.fragmentShader = shader.fragmentShader.replace('#include <' + oldchunkname + '>', '#include <' + newchunkname + '>');
            }
          };
        }
      }
      return m;
    }
    this.updateSkybox = function() {
      let envMap = (this.isUsingPBR() ? this.getEnvmap() : null);
      this.traverseObjects(n => {
        if (n.material) {
          let materials = (elation.utils.isArray(n.material) ? n.material : [n.material]);
          materials.forEach(m => {
            m.envMap = envMap;
            m.envMapIntensity = room.skybox_intensity;
          });
        }
      });
    }
    this.updateColor = function() {
      elation.engine.things.janusobject.extendclass.updateColor.call(this);

      let textureasset = this.textureasset;

      if (this.objects['3d']) {
        this.traverseObjects(n => {
          if (n.material) {
            var m = (elation.utils.isArray(n.material) ? n.material : [n.material]);
            for (var i = 0; i < m.length; i++) {
              m[i].color = this.properties.color;
              m[i].opacity = this.opacity;
              m[i].transparent = (textureasset && textureasset.hasalpha) || m[i].opacity < 1;
              if (m[i].transparent) {
                m[i].alphaTest = this.alphatest;
              }
            }
          }
        });
      }
    }
    this.isUsingPBR = function() {
      return this.lighting && elation.utils.any(this.room.pbr, elation.config.get('janusweb.materials.pbr'));
    }
    this.isUsingToonShader = function() {
      return this.lighting && elation.utils.any(this.room.toon, elation.config.get('janusweb.materials.toon'));
    }
    this.allocateMaterial = function() {
      if (this.shader_id) {
      } else if (!this.lighting) {
        return new THREE.MeshBasicMaterial();
      } else if (this.isUsingToonShader()) {
        return new THREE.MeshToonMaterial();
      } else if (this.isUsingPBR()) {
        return new THREE.MeshPhysicalMaterial();
      }
      return new THREE.MeshPhongMaterial();
    }
    this.getEnvmap = function() {
      if (this.envmap_id) {
        if (this.envmap) return this.envmap;
        var envmapasset = this.getAsset('image', this.envmap_id);
        if (!envmapasset) {
          // try video as a fallback
          envmapasset = this.getAsset('video', this.envmap_id);
        }
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
      texture.minFilter = (linear && !this.video_id ? THREE.LinearMipMapLinearFilter : (linear && this.video_id ? THREE.LinearFilter : THREE.NearestFilter));
      texture.magFilter = (linear ? THREE.LinearFilter : THREE.NearestFilter);
      texture.anisotropy = (linear ? elation.config.get('engine.assets.image.anisotropy', 4) : 1);
      texture.generateMipmaps = linear && !(texture instanceof THREE.VideoTexture || texture instanceof THREE.SBSVideoTexture) && (textureasset && textureasset.detectImageType() != 'basis');
      texture.offset.copy(this.texture_offset);
      texture.repeat.copy(this.texture_repeat);
      texture.rotation = this.texture_rotation * THREE.MathUtils.DEG2RAD;
      if (texture.repeat.x > 1 || texture.repeat.y > 1) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    }
    this.updateTextureOffsets = function() {
      // FIXME - should cache textures instead of iterating each time
      if (this.objects['3d']) {
        if (!this.objectMeshes || this.objectMeshes.length == 0) {
          this.objectMeshes = [];
          this.traverseObjects(n => {
            if (n.material) {
/*
            let materials = (n.material instanceof THREE.Material ? [n.material] : n.material);
            materials.forEach(m => {
              if (m.map) {
                m.map.offset.copy(this.texture_offset);
                m.map.repeat.copy(this.texture_repeat);
                m.map.rotation = this.texture_rotation * THREE.MathUtils.DEG2RAD;
              }
              if (m.normalMap) {
                m.normalMap.offset.copy(this.texture_offset);
                m.normalMap.repeat.copy(this.texture_repeat);
                m.normalMap.rotation = this.texture_rotation * THREE.MathUtils.DEG2RAD;
              }
              // TODO - all maps which use uv layer 0 should be changed here
            });
*/
              this.objectMeshes.push(n)
            }
          });
        }
        let applyTextureOffset = (texture) => {
          texture.offset.copy(this.properties.texture_offset);
          texture.repeat.copy(this.properties.texture_repeat);
          texture.rotation = this.properties.texture_rotation;
        }
        let texpos = this.properties.texture_offset,
            texrep = this.properties.texture_repeat,
            texrot = this.properties.texture_rotation,
            is3d = (this.videoasset && (this.videoasset.ou3d || this.videoasset.sbs3d));

        if (!(texpos.x == 0 && texpos.y == 0) ||
            !(texrep.x == 1 && texrep.y == 1) ||
            !(texrot == 0) ||
            is3d) {
          this.objectMeshes.forEach(n => {
            n.onBeforeRender = (renderer, scene, camera) => {
              let materials = (elation.utils.isArray(n.material) ? n.material : [n.material]);
              materials.forEach(m => {
                if (m.map) applyTextureOffset(m.map);
                if (m.normalMap) applyTextureOffset(m.normalMap);
                if (m.bumpMap) applyTextureOffset(m.bumpMap);
                if (m.emissiveMap) applyTextureOffset(m.emissiveMap);
                if (m.roughnessMap) applyTextureOffset(m.roughnessMap);
                if (m.metalnessMap) applyTextureOffset(m.metalnessMap);
                if (m.displacementMap) applyTextureOffset(m.displacementMap);

                if (!this.vrlayer) {
                  this.vrlayer = new THREE.Layers();
                  this.vrlayer.set(2);
                }
                if (m.map === this.videotexture && this.videoasset) {
                  if (this.videoasset.ou3d) {
                    if (camera.layers.test(this.vrlayer)) {
                      m.map.offset.y = (this.videoasset.reverse3d ? .5 : 0);
                    } else {
                      m.map.offset.y = (this.videoasset.reverse3d ? 0 : .5);
                    }
                  } else if (this.videoasset.sbs3d) {
                    if (camera.layers.test(this.vrlayer)) {
                      m.map.offset.x = (this.videoasset.reverse3d ? 0 : .5);
                    } else {
                      m.map.offset.x = (this.videoasset.reverse3d ? .5 : 0);
                    }
                  }
                }
              });
            };
          });
        }
      }
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
        if (this.videoasset && this.videotexture && !this.image_id) {
          var texture = this.videotexture;
          var video = texture.image;
/*
          if (video && !video.playing) {
            video.src = this.videoasset.src;
            if (this.lastVideoTime) {
              video.currentTime = this.lastVideoTime;
            }
          }
*/
          //this.videoasset.play();
          //console.log('reload video', video.src, this.videoasset.hls, this.videoasset.auto_play);
          if (video.paused) {
            if (this.videoasset.auto_play) {
              video.play()
                .then(() => console.log('Video autoplay start', video))
                .catch(e => {
                  var strerr = e.toString();
                  if (strerr.indexOf('NotSupportedError') == 0 && this.hls !== false) {
                    console.log('Attempting to init hls', this.videoasset)
                    this.videoasset.initHLS();
                  } else {
                    console.error(e);
                  }
                });
            }
          } else if (video.muted) {
            video.muted = false;
            video.play();
          }
        }
      }
      if (this.websurface_id) {
        elation.events.add(this, 'click', elation.bind(this, this.handleWebsurfaceClick));
        if (!this.websurface && !this.image_id) {
          this.createWebsurface();
        }
        if (this.websurface) {
          this.websurface.start();
        }
      }
    }
    this.stop = function() {
      elation.engine.things.janusobject.extendclass.stop.call(this);
      if (this.image_id) {
        var texture = this.getAsset('image', this.image_id);
        //console.log('stop the image!', texture);
      }
      if (this.video_id && this.video) {
        //var texture = this.getAsset('video', this.video_id);
        //texture.image.pause();
        //console.log('stop the video!', texture);
        this.pause();
        // Stop the video from loading any more data, and store current timestamp so we can resume
        this.lastVideoTime = this.video.currentTime;
        this.video.removeAttribute('src');
        this.video.load();
        if (this.videoasset && this.videoasset.hls) {
          // If this is a livestream, shut it down gracefully
          this.videoasset.hls.destroy();
          this.videoasset.hls = null;
        }
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
    this.handleWebsurfaceClick = function() {
      if (this.websurface_id && !this.websurface) {
        this.createWebsurface();
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
      return (video && video.currentTime > 0 && !video.paused && !video.ended);
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
    this.setupOnBeforeRenderListener = function(type, args, arg2, arg3) {
      if (this.onbeforerender) {
        elation.events.add(this, 'load', ev => {
          this.objects['3d'].onBeforeRenderx = this.onbeforerender;
        });
      }
    }
    this.updateAudioNodes = function() {
      if (this.video) {
        this.video.volume = this.gain;
      }
    }
    this.extractMorphTargets = function() {
        this.objects['3d'].traverse(n => {
          if (n.morphTargetDictionary && n.morphTargetInfluences && n.morphTargetInfluences.length > 0) {
            this.morphtargets = n.morphTargetDictionary;
            this.morphtargetInfluences = n.morphTargetInfluences;
          }
        });
      }
    this.setMorphTargetInfluence = function(name, value) {
      if (typeof this.morphtargets == 'undefined') {
        this.extractMorphTargets();
      }

      if (this.morphtargets && name in this.morphtargets) {
        this.morphtargetInfluences[this.morphtargets[name]] = value;
      }
    }
    this.applyPosition = function(pos) {
      if (!this.modelasset) this.assignTextures();

      let mat4 = new THREE.Matrix4().makeTranslation(+pos.x, +pos.y, +pos.z);
      if (this.modelasset && this.modelasset.loaded) {
        // FIXME - should we handle the case where the object is already loaded and we want to modify its origin?
        //         Currently we do nothing, so we don't double-apply
      } else {
        elation.events.add(this.modelasset, 'asset_load', ev => {
          this.objects['3d'].traverse(n => {
            if (n instanceof THREE.Mesh) {
              n.geometry.applyMatrix4(mat4);
            }
          });
        });
      }

    }
    this.cloneAnimations = function(object) {
      if (object.animations && this.animationmixer) {
        for (let k in object.animations) {
          let action = this.animationmixer.clipAction(object.animations[k]._clip);
          this.animations[k] = action;
        }
      }
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusobject.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          id:  [ 'property', 'janusid'],
          url:  [ 'property', 'url'],
          image_id:  [ 'property', 'image_id'],
          video_id:  [ 'property', 'video_id'],
          shader_id:  [ 'property', 'shader_id'],
          lmap_id:  [ 'property', 'lmap_id'],
          envmap_id:  [ 'property', 'envmap_id'],
          websurface_id:  [ 'property', 'websurface_id'],
          normalmap_id:  [ 'property', 'normalmap_id'],
          alphamap_id:  [ 'property', 'alphamap_id'],
          displacementmap_id:  [ 'property', 'displacementmap_id'],
          displacementmap_scale:  [ 'property', 'displacementmap_scale'],
          emissive_id:  [ 'property', 'emissive_id'],
          roughness_id:  [ 'property', 'roughness_id'],
          metalness_id:  [ 'property', 'metalness_id'],

          lighting: [ 'property', 'lighting' ],
          shadow: [ 'property', 'shadow' ],
          shadow_receive: [ 'property', 'shadow_receive' ],
          shadow_cast: [ 'property', 'shadow_cast' ],
          shadow_side: [ 'property', 'shadow_side' ],
          cull_face: [ 'property', 'cull_face' ],
          blend_src: [ 'property', 'blend_src' ],
          blend_dest: [ 'property', 'blend_dest' ],
          blend_mode: [ 'property', 'blend_mode' ],
          depth_write: [ 'property', 'depth_write' ],
          depth_test: [ 'property', 'depth_test' ],
          depth_offset: [ 'property', 'depth_offset' ],
          depth_func: [ 'property', 'depth_func' ],
          color_write: [ 'property', 'color_write' ],

          wireframe: [ 'property', 'wireframe'],
          fog: [ 'property', 'fog'],
          lights: [ 'property', 'lights'],
          emissive: [ 'property', 'emissive'],
          emissive_intensity: [ 'property', 'emissive_intensity'],
          roughness: [ 'property', 'roughness'],
          metalness: [ 'property', 'metalness'],
          transmission: [ 'property', 'transmission'],
          usevertexcolors: [ 'property', 'usevertexcolors'],

          texture_offset: [ 'property', 'texture_offset'],
          texture_repeat: [ 'property', 'texture_repeat'],
          texture_rotation: [ 'property', 'texture_rotation'],


          // video properties/functions
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
