elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janussound', function() {
    this.postinit = function() {
      elation.engine.things.janussound.extendclass.postinit.call(this);
      this.defineProperties({
        sound_id: { type: 'string' },
        rect: { type: 'string', default: "0 0 0 0" },
        loop: { type: 'boolean', default: false },
        auto_play: { type: 'boolean', default: false },
        play_once: { type: 'boolean', default: false },
        dist: { type: 'float', default: 1.0 },
        pitch: { type: 'float', default: 1.0, set: this.updateSound },
        gain: { type: 'float', default: 1.0, set: this.updateSound }
      });
      Object.defineProperty(this, 'playing', { get: function() { if (this.audio) return this.audio.isPlaying; return false; } });
    }
    this.createObject3D = function() {
      return new THREE.Object3D();
    }
    this.createChildren = function() {
      if (!this.audio) {
        var sound = elation.engine.assets.find('sound', this.sound_id);
        if (sound) {
          this.createAudio(sound.getProxiedURL());
        }
      }
    }
    this.createAudio = function(src) {
      if (this.audio) {
        if (this.audio.isPlaying) {
          this.audio.stop();
        }
        this.objects['3d'].remove(this.audio);
      }
      var listener = this.engine.systems.sound.getRealListener();
      if (listener) {
        this.audio = new THREE.PositionalAudio(listener);
        if (this.properties.distanceModel) {
          this.audio.panner.distanceModel = this.properties.distanceModel;
        }
        //this.audio.panner.maxDistance = this.properties.distance;
        if (this.properties.distance) {
          this.audio.setRefDistance(this.properties.distance);
        } else {
          this.audio.panner.distanceModel = 'linear';
        }
        this.audio.autoplay = this.auto_play;
        this.audio.setLoop(this.loop);
        this.audio.setVolume(this.gain);
        if (src) {
          this.audio.load(src);
        } else {
        }
        this.objects['3d'].add(this.audio);
      }
    }
    this.load = function(url) {
      this.src = url;
      if (this.audio.isPlaying) {
        this.audio.stop();
      }
      this.createAudio(url);
    }
    this.play = function() {
      if (this.audio && this.audio.source.buffer) {
        if (this.audio.isPlaying) {
          this.audio.source.currentTime = 0;
        } else {
          this.audio.play();
        }
      }
    }
    this.pause = function() {
      if (this.audio && this.audio.isPlaying) {
        this.audio.pause();
      }
    }
    this.start = function() {
      this.play();
    }
    this.stop = function() {
      if (this.audio && this.audio.isPlaying) {
        this.audio.stop();
      }
    }
    this.updateSound = function() {
      if (this.audio) {
        this.play();
        this.audio.setVolume(this.gain);
      }
    }
    this.getProxyObject = function() {
      var proxy = elation.engine.things.janussound.extendclass.getProxyObject.call(this);
      proxy._proxydefs = {
        gain:         [ 'property', 'gain'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
