elation.require(['janusweb.janusbase'], function() {
  var soundcache = {};

  elation.component.add('engine.things.janussound', function() {
    this.postinit = function() {
      elation.engine.things.janussound.extendclass.postinit.call(this);
      this.defineProperties({
        sound_id: { type: 'string', set: this.updateSound },
        singleshot: { type: 'boolean', default: false },
        positional: { type: 'boolean', default: null },
        loop: { type: 'boolean', default: false },
        auto_play: { type: 'boolean', default: false },
        play_once: { type: 'boolean', default: false },
        dist: { type: 'float', default: 1.0, set: this.updateSound },
        pitch: { type: 'float', default: 1.0, set: this.updateSound },
        gain: { type: 'float', default: 1.0, set: this.updateSound },
        starttime: { type: 'float', default: 0.0, set: this.updateSound },
        distancemodel: { type: 'string', default: 'inverse', set: this.updateSound },
        rolloff: { type: 'float', default: 1.0, set: this.updateSound },
        rect: { type: 'string', set: this.updateSound },
        stream: { type: 'boolean', default: false}
      });
      this.playing = false;
      //Object.defineProperty(this, 'playing', { get: function() { if (this.audio) return this.audio.isPlaying; return false; } });
      this.playStarted = false;
      this.playDelayed = false;
      elation.events.add(this.room, 'janusweb_script_frame', elation.bind(this, this.checkBounds));
    }
    this.createObject3D = function() {
      return new THREE.Object3D();
    }
    this.createChildren = function() {
      elation.engine.things.janussound.extendclass.createChildren.call(this);

      this.updateSound();
      if (this.auto_play) {
        this.play();
      }
    }
    this.createAudio = async function(src, audionodes) {
      var sound = this.getAsset('sound', this.sound_id, true);
      if (!src) {
        this.currentsound = this.sound_id;
        if (sound && sound.src) {
          src = sound.getProxiedURL(sound.src);
        }
      }
      if (this.audio) {
        if (this.audio.isPlaying) {
          this.audio.stop();
        }
        this.objects['3d'].remove(this.audio);
      }
      //let listener = this.listener = this.engine.systems.sound.getRealListener();
      return new Promise(async (resolve, reject) => {
        if (!audionodes) {
          audionodes = await this.room.getAudioNodes();
        }
        if (!this.hasposition && this.positional !== true) {
          this.audio = new THREE.Audio(audionodes.listener);
        } else {
          this.audio = new THREE.PositionalAudio(audionodes.listener);
          if (this.properties.distancemodel) {
            this.audio.panner.distanceModel = this.properties.distancemodel;
          }
          //this.audio.panner.maxDistance = this.properties.distance;
          if (this.dist) {
            this.audio.setRefDistance(this.dist);
          } else {
            //this.audio.panner.distanceModel = 'linear';
          }
          this.audio.panner.panningModel = 'HRTF';
        }
        if (audionodes.gain) {
          // Route object's audio through the room's gain element
          //this.audio.disconnect();
          this.audio.gain.disconnect(audionodes.listener.getInput());
          //this.audio.setFilters([this.audio.gain, audionodes.gain]);
          this.audio.gain.connect(audionodes.gain);
        }
        this.audio.autoplay = this.auto_play || this.singleshot || this.playStarted;
        this.audio.setLoop(this.loop);
        this.audio.setVolume(this.gain);
        this.audio.setPlaybackRate(this.pitch);
        this.audio.offset = this.starttime;
        //this.seek(this.starttime);
        this.audio.onEnded = elation.bind(this, this.updatePlaying);
        elation.events.add(this.audio.buffer, 'playing,pause,ended', elation.bind(this, this.updatePlaying));
        if (src) {
          if (this.stream) {
            let audio = new Audio(src);
            audio.src = src;
            let source = audio.captureStream();
            audio.addEventListener('playing', ev => {
              this.audio.setMediaStreamSource(source);
              console.log('ahh', audio, this.audio);
              this.audio.connect();
              //this.audio.play();
            });
            if (this.auto_play || sound.auto_play) {
              audio.play();
            }
          } else {
            if (soundcache[src]) {
              this.audio.setBuffer(soundcache[src]);
              if (this.auto_play || this.singleshot || this.playStarted) {
                this.play();
              }
            } else {
              var loader = new THREE.AudioLoader();
              loader.load(src, elation.bind(this, function(buffer) {
                if (buffer) {
                  soundcache[src] = buffer;
                  this.audio.setBuffer(buffer);
                  if ((this.auto_play || this.singleshot || this.playStarted) && this.room == this.janus.currentroom) {
                    this.play();
                  }
                }
              }));
            }
          }
        } else if (sound && sound.buffer) {
          soundcache[src] = sound.buffer;
          this.audio.setBuffer(sound.buffer);
        }
        this.objects['3d'].add(this.audio);
        this.updateSound();
        resolve(this.audio);
      });
    }
    this.load = function(url) {
      this.src = url;
      if (this.audio.isPlaying) {
        this.audio.stop();
      }
      this.createAudio(url);
    }
    this.play = async function() {
      if (!this.engine.systems.sound.canPlaySound) {
        if (!this.playDelayed) {
          this.playDelayed = true;
          elation.events.add(this.engine.systems.sound, 'sound_enabled', (ev) => { this.play(); });
          this.dispatchEvent({type: 'sound_delayed'});
        }
      } else {
        this.playStarted = true;
        if (!this.audio) {
          await this.createAudio();
        }
        if (this.audio && this.audio.buffer) { //this.audio.source && this.audio.source.buffer) {
          if (this.audio.source) {
            this.audio.stop();
          }
          this.audio.setVolume(this.gain);
          if (this.audio.isPlaying) {
            this.audio.source.currentTime = 0;
          } else {
            this.seek(this.starttime);
            this.audio.play();
          }
        }
      }
    }
    this.pause = function() {
      if (this.audio && this.audio.isPlaying) {
        this.audio.pause();
      }
    }
    this.start = function() {
      if (this.auto_play || this.playStarted) {
        this.play();
      }
    }
    this.seek = function(time) {
      if (this.audio && this.audio.source) {
        this.audio.source.currentTime = time;
      }
    }
    this.stop = function() {
      if (this.audio && this.audio.isPlaying) {
        this.audio.stop();
      }
    }
    this.updateSound = async function() {
      if (!this.objects['3d']) return;
      if (this.canPlay() && this.currentsound != this.sound_id) {
        await this.createAudio();
      }
      if (this.audio) {
        //this.play();
        this.audio.setVolume(this.gain);
        this.audio.setPlaybackRate(this.pitch);
        if (this.audio instanceof THREE.PositionalAudio) {
          this.audio.setRolloffFactor(this.rolloff);
          this.audio.setRefDistance(this.dist);
          this.audio.setDistanceModel(this.distancemodel);
        }
      }
      if (this.rect) {
        var parts = this.rect.split(' '),
            minx = Math.min(parts[0], parts[2]),
            maxx = Math.max(parts[0], parts[2]),
            minz = Math.min(parts[1], parts[3]),
            maxz = Math.max(parts[1], parts[3]);
        this.bounds = new THREE.Box3(new THREE.Vector3(minx, -Infinity, minz), new THREE.Vector3(maxx, Infinity, maxz));
      } else {
        this.bounds = false;
      }
    }
    this.checkBounds = (function() {
      var worldpos = new THREE.Vector3();
      return function() {
        if (this.bounds && !this.playing && !(this.play_once && this.playStarted)) {
          var listener = this.listener;
          if (listener) {
            worldpos.set(0,0,0).applyMatrix4(listener.matrixWorld);
          }
          if (!this.playDelayed && this.bounds.containsPoint(worldpos)) {
            this.play();
          }
        }
      }
    })();
    this.canPlay = function() {
      return this.engine.systems.sound.canPlaySound;
    }
    this.updatePlaying = function(ev) {
      this.playing = (this.audio ? this.audio.isPlaying : false);
      if (ev.type == 'ended') {
        this.dispatchEvent({type: 'sound_ended'});
        if (this.singleshot)  {
          this.die();
        }
      }
      return this.playing;
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janussound.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          id:           [ 'property', 'sound_id'],
          gain:         [ 'property', 'gain'],
          playing:      [ 'property', 'playing', 'sound.isPlaying'],
          pitch:        [ 'property', 'pitch'],
          auto_play:    [ 'property', 'auto_play'],
          positional:   [ 'property', 'positional'],
          play:         [ 'function', 'play'],
          pause:        [ 'function', 'pause'],
          stop:         [ 'function', 'stop'],
          seek:         [ 'function', 'seek'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusbase);
});
