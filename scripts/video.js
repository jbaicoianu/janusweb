elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusvideo', function() {
    this.postinit = function() {
      elation.engine.things.janusvideo.extendclass.postinit.call(this);
      this.defineProperties({
        //src: { type: 'string' },
        video_id: { type: 'string', set: this.updateVideo },
        loop: { type: 'boolean', default: false },
        sbs3d: { type: 'boolean', default: false },
        hasalpha: { type: 'boolean', default: true },
        ou3d: { type: 'boolean', default: false },
        color: { type: 'color', default: 0xffffff },
        lighting: { type: 'boolean', default: true },
        gain: { type: 'float', default: 1.0, set: this.updateSound },
      });
      this.audionodes = false;
      elation.events.add(this, 'click', elation.bind(this, this.click));
    }
    this.createObject3D = function() {
      this.asset = this.getAsset('video', this.video_id);
      if (this.asset) {
        var geo = this.createGeometry();
        var mat = this.createMaterial();
        this.video = this.texture.image;
        elation.events.add(this.texture, 'asset_load', elation.bind(this, this.imageloaded));
        elation.events.add(this.video, 'loadeddata', elation.bind(this, this.videoloaded));
        elation.events.add(this.video, 'playing', elation.bind(this, this.videoStartedPlaying));

        var mesh = new THREE.Mesh(geo, mat);
        if (this.sbs3d || this.ou3d || this.asset.sbs3d || this.asset.ou3d) {
          mesh.onBeforeRender = (renderer, scene, camera) => {
            if (camera.name) {
              texture.setEye(camera.name);
            }
          }
        }
        return mesh;
      } else {
        console.log('ERROR - could not find video ' + this.properties.video_id);
      }
      return new THREE.Object3D();
    }
    this.createMaterial = function() {
      if (this.asset) {
        var texture = this.texture = this.asset.getInstance();
        if (this.asset.sbs3d || this.sbs3d) {
          texture.repeat.x = 0.5;
        }
        if (this.asset.ou3d || this.ou3d) {
          texture.repeat.y = 0.5;
        }
        if (this.properties.loop) {
          texture.image.loop = true;
        }
        if (this.asset.auto_play) {
          texture.image.addEventListener('canplaythrough', function() {
            texture.image.play();
          });
        }
        texture.minFilter = THREE.LinearFilter;
        // Refresh this object whenever the video has a new frame for us to display
        this.texture.onUpdate = (e) => this.refresh();
      }

      this.texture.minFilter = THREE.LinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
      this.texture.format = THREE.RGBFormat;
      this.texture.generateMipmaps = false;

      var matargs = {
        map: this.texture,
        color: this.properties.color,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
      };
      //plane.applyMatrix(new THREE.Matrix4().makeTranslation(.5,-.5,0));
      var mat = (this.properties.lighting ? new THREE.MeshPhongMaterial(matargs) : new THREE.MeshBasicMaterial(matargs));
      return mat;
    }
    this.videoStartedPlaying = function(ev) {
      if (!this.audionodes) {
        this.initSound();
      }
      this.adjustAspectRatio();
    }
    this.initSound = async function() {
      return new Promise(async (resolve, reject) => {
        let roomaudionodes = await this.room.getAudioNodes(),
            ctx = roomaudionodes.listener.context;
        this.audionodes = {
          listener: roomaudionodes.listener,
          ctx: ctx
        };

        var source = this.getSoundSource();

        this.soundobj = new THREE.PositionalAudio(roomaudionodes.listener);
        this.objects['3d'].add(this.soundobj);
        this.soundobj.isPlaying = true;
        source.connect(this.soundobj.panner);

        this.audionodes.source = source;
        this.audionodes.gain = this.soundobj.gain;
        this.audionodes.panner = this.soundobj.panner;
        this.audionodes.gain.value = this.gain;

        this.audionodes.gain.connect(roomaudionodes.gain);
      });
    }
    this.getSoundSource = function() {
      if (!this.video._audiosource) {
        var ctx = this.audionodes.ctx;
        var source = ctx.createMediaElementSource(this.video);
        this.video._audiosource = source;
      }
      return this.video._audiosource;
    }
    this.updateVideo = function() {
      if (this.video) {
        if (this.asset.name != this.video_id) {
          var newasset = this.getAsset(this.video_id);
          if (newasset) {
            this.texture.image = newasset.getInstance();
            this.dispatchEvent({type: 'janusweb_video_change', data: this.texture.image});
          }
        }
      }
    }
    this.updateSound = function() {
      if (this.audionodes && this.audionodes.gain) {
        this.audionodes.gain.gain.value = this.gain;
      }
    }
    this.getSize = function(image) {
      return {width: image.videoWidth, height: image.videoHeight};
    }
    this.click = function(ev) {
      if (ev.button == 0) {
        this.togglePlay();
      }
    }
    this.togglePlay = function() {
      //var texture = this.asset.getInstance();
      if (this.isPlaying()) {
        this.pause();
      } else {
        this.play();
      }
    }
    this.isPlaying = function() {
      var video = this.video;
      return (video && video.currentTime > 0 && !video.paused && !video.ended);
    }
    this.play = function() {
      if (!this.engine.systems.sound.canPlaySound) {
        if (!this.playDelayed) {
          this.playDelayed = true;
          elation.events.add(this.engine.systems.sound, 'sound_enabled', (ev) => { this.play(); });
          this.dispatchEvent({type: 'sound_delayed'});
        }
      } else {
        if (!this.isPlaying()) {
          this.video.play();
        }
      }
    }
    this.pause = function() {
      if (this.isPlaying()) {
        this.video.pause();
      }
    }
    this.start = function() {
      if (this.video) {
        if (this.video.originalSrc) {
          this.video.src = this.video.originalSrc;
        }
        if (this.video.muted) {
          this.video.muted = false;
          this.play();
        }
      }
    }
    this.stop = function() {
      if (this.video) {
        this.pause();
        // FIXME - this stops the video from loading any more data, but means we can't easily restart
        //         so we're hackishly working around that
        this.video.originalSrc = this.video.src;
        this.video.src = '';
      }
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
        this._proxyobject = elation.engine.things.janusvideo.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          loop:    [ 'property', 'loop'],
          video:   [ 'property', 'video'],
          gain:    [ 'property', 'gain'],
          current_time: [ 'accessor', 'getCurrentTime'],
          total_time: [ 'accessor', 'getTotalTime'],
          sbs3d:    [ 'property', 'sbs3d'],
          ou3d:    [ 'property', 'ou3d'],

          isPlaying: [ 'function', 'isPlaying'],
          play:    [ 'function', 'play'],
          pause:   [ 'function', 'pause'],
          toggle:  [ 'function', 'togglePlay'],
          seek:    [ 'function', 'seek'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusimage);
});

