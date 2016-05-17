elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janussound', function() {
    this.postinit = function() {
      elation.engine.things.janussound.extendclass.postinit.call(this);
      this.defineProperties({
        id: { type: 'string' },
        src: { type: 'string' },
        rect: { type: 'string', default: "0 0 0 0" },
        loop: { type: 'boolean', default: false },
        autoplay: { type: 'boolean', default: true },
        play_once: { type: 'boolean', default: false },
        dist: { type: 'float', default: 1.0 },
        pitch: { type: 'float', default: 1.0 },
        gain: { type: 'float', default: 1.0 }
      });
      Object.defineProperty(this, 'playing', { get: function() { if (this.audio) return this.audio.isPlaying; return false; } });
    }
    this.createObject3D = function() {
      return new THREE.Object3D();
    }
    this.createChildren = function() {
      if (!this.audio) {
        this.createAudio(this.properties.src);
      }
    }
    this.createAudio = function() {
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
        this.audio.autoplay = this.properties.autoplay;
        this.audio.setLoop(this.properties.loop);
        this.audio.setVolume(this.properties.gain);
        if (this.properties.src) {
          this.audio.load(this.properties.src);
        }
        this.objects['3d'].add(this.audio);
console.log('MADE AUDIO', this.audio);
      }
    }
    this.load = function(url) {
      this.properties.src = url;
      if (this.audio.isPlaying) {
        this.audio.stop();
      }
      this.createAudio(url);
    }
    this.play = function() {
      if (this.audio && this.audio.source.buffer) {
        this.audio.play();
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
  }, elation.engine.things.janusbase);
});
