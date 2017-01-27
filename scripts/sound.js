elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janussound', function() {
    this.postinit = function() {
      elation.engine.things.janussound.extendclass.postinit.call(this);
      this.defineProperties({
        sound_id: { type: 'string' },
        rect: { type: 'string', default: "0 0 0 0" },
        loop: { type: 'boolean', default: false },
        auto_play: { type: 'boolean', default: true },
        play_once: { type: 'boolean', default: false },
        dist: { type: 'float', default: 1.0 },
        pitch: { type: 'float', default: 1.0, set: this.updateSound },
        gain: { type: 'float', default: 1.0, set: this.updateSound },
        starttime: { type: 'float', default: 0.0, set: this.updateSound },
        rect: { type: 'string', set: this.updateSound }
      });
      Object.defineProperty(this, 'playing', { get: function() { if (this.audio) return this.audio.isPlaying; return false; } });

      elation.events.add(this.engine, 'engine_frame', elation.bind(this, this.checkBounds));
    }
    this.createObject3D = function() {
      return new THREE.Object3D();
    }
    this.createChildren = function() {
      if (!this.audio) {
        var sound = elation.engine.assets.find('sound', this.sound_id);
        if (sound) {
          this.createAudio(sound.getProxiedURL(sound.src));
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
        if (this.rect) {
          this.audio = new THREE.Audio(listener);
        } else {
          this.audio = new THREE.PositionalAudio(listener);
          if (this.properties.distanceModel) {
            this.audio.panner.distanceModel = this.properties.distanceModel;
          }
          //this.audio.panner.maxDistance = this.properties.distance;
          if (this.dist) {
            this.audio.setRefDistance(this.dist);
          } else {
            //this.audio.panner.distanceModel = 'linear';
          }
        }
        this.audio.autoplay = this.auto_play;
        this.audio.setLoop(this.loop);
        this.audio.setVolume(this.gain);
        if (src) {
          var loader = new THREE.AudioLoader();
          loader.load(src, elation.bind(this, function(buffer) { this.audio.setBuffer(buffer); this.play(); }));
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
      if (this.audio && this.audio.source && this.audio.source.buffer) {
        this.audio.setVolume(this.gain);
        if (this.audio.isPlaying) {
          this.audio.source.currentTime = 0;
        } else {
          this.seek(this.starttime);
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
    this.seek = function(time) {
      this.audio.currentTime = time;
    }
    this.stop = function() {
      if (this.audio && this.audio.isPlaying) {
        this.audio.stop();
      }
    }
    this.updateSound = function() {
      if (this.audio) {
        //this.play();
        this.audio.setVolume(this.gain);
      }
      if (this.rect) {
        var parts = this.rect.split(' ');
        this.bounds = new THREE.Box3(new THREE.Vector3(parts[0], -Infinity, parts[1]), new THREE.Vector3(parts[2], Infinity, parts[3]));
      } else {
        this.bounds = false;
      }
    }
    this.checkBounds = (function() {
      var worldpos = new THREE.Vector3();
      return function() {
        if (this.bounds && this.audio) {
          var listener = this.engine.systems.sound.getRealListener();
          if (listener) {
            worldpos.set(0,0,0).applyMatrix4(listener.matrixWorld);
          }
          if (this.bounds.containsPoint(worldpos)) {
            if (!this.audio.isPlaying) {
              this.play();
            }
          } else if (this.audio.isPlaying) {
            this.pause();
          }
        }
      }
    })();
    this.getProxyObject = function() {
      var proxy = elation.engine.things.janussound.extendclass.getProxyObject.call(this);
      proxy._proxydefs = {
        gain:         [ 'property', 'gain'],
        play:         [ 'function', 'play'],
        pause:        [ 'function', 'pause'],
        stop:         [ 'function', 'stop'],
        seek:         [ 'function', 'seek'],
      };
      return proxy;
    }
  }, elation.engine.things.janusbase);
});
