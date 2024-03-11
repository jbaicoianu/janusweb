elation.require(['janusweb.janusghost', 'engine.things.maskgenerator', 'engine.things.sound', 'janusweb.external.JanusVOIP'], function() {
elation.component.add('engine.things.remoteplayer', function() {
  this.postinit = function() {
    elation.engine.things.remoteplayer.extendclass.postinit.call(this);
    this.defineProperties({
      startposition: {type: 'vector3', default: new THREE.Vector3()},
      pickable: {type: 'boolean', default: false},
      collidable: {type: 'boolean', default: false},
      player_id: {type: 'string', default: 'UnknownPlayer'},
      player_name: {type: 'string', default: 'UnknownPlayer'},
    });
    this.properties.ghost_id = this.properties.player_name;
  };

/*
  this.createObject3D = function() {
    var geo = new THREE.CylinderGeometry(1, 1, 4, 8),
        mat = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.7 }),
        mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }; 
*/
  
  this.createChildren = function() {
    elation.engine.things.remoteplayer.extendclass.createChildren.call(this);
    this.torso = this.spawn('janusbase', this.properties.player_name + '_torso', {
      'position': [0,1,0],
      'parent': this,
      'janus': this.janus,
      'room': this.room
    });
    this.shoulders = this.torso.spawn('janusbase', this.properties.player_id + '_shoulders', {
      'position': [0,0.6,-0.0],
      'parent': this,
      'janus': this.janus,
      'room': this.room
    });
    this.neck = this.torso.spawn('janusbase', this.properties.player_name + '_neck', {
      'position': [0,0.4,0],
      'parent': this,
      'janus': this.janus,
      'room': this.room
    });
    this.head = this.spawn('janusbase', this.properties.player_name + '_head', {
      'position': [0,1.4,0],
      'parent': this,
      'janus': this.janus,
      'room': this.room
    });
/*
    this.face = this.head.spawn('maskgenerator', this.properties.player_name + '_mask', {
      'seed': this.properties.player_name,
      'position': [0,0,-0.025],
      collidable: false,
      'tilesize': 0.05,
      'player_id': this.properties.player_name,
      pickable: false,
      collidable: false
    });
*/
/*
    this.label = this.createObject('text', {
      size: .1,
      thickness: .002,
      align: 'center',
      collidable: false,
      text: this.player_name,
      position: [0,2,0],
      orientation: [0,1,0,0],
      pickable: false,
      collidable: false,
      billboard: 'y'
    });
*/
  };
  this.speak = function(noise) {
    this.voip.speak(noise);

    if (!this.mouth.audio.playing) {
      this.mouth.audio.play();
    }
    this.label.material.color.setHex(0x00ff00);
    if (this.talktimer) { 
      clearTimeout(this.talktimer);
    }
    this.talktimer = setTimeout(elation.bind(this, this.shutup), this.bufferlength * 500);
    
  }
  this.shutup = function() {
    this.voip.silence();
/*
    if (this.mouth.audio.playing) {
      this.mouth.audio.stop(); 
    }
    var bufferLeft = this.rawbuffer.getChannelData(0);
    var bufferRight = this.rawbuffer.getChannelData(1);
    for (var i = 0; i < bufferLeft.length; i++) {
      bufferLeft[i] = bufferRight[i] = 0;
    }
    this.bufferoffset = 0;
*/
    this.label.material.color.setHex(0xcccccc);
  }
  this.handleVoipData = function(ev) {
    //this.mouth.audio.source.loopEnd = ev.data.end;
    if (!this.mouth.audio.isPlaying) {
      //this.mouth.audio.play(ev.data.start, ev.data.end);
    } else {
      //console.log('already playing');
    }
  }
  this.addVoice = async function(stream) {
    this.mouth = this.createObject('sound', {
      pos: V(0, 0, 0),
      distancemodel: 'exponential',
      dist: 1,
      gain: 2,
      rolloff: .4,
    });
    this.head.add(this.mouth._target);


    if (this.engine.systems.sound.canPlaySound) {
      this.createVoiceAudio(stream);
    } else {
      elation.events.add(this.engine.systems.sound, 'sound_enabled', async (ev) => {
        this.createVoiceAudio(stream);
      });
    }
  }
  this.createVoiceAudio = async function(stream) {
    let listener = this.engine.systems.sound.getRealListener();
    await this.mouth.createAudio(null, {listener});
    let panner = this.mouth.audio.panner,
        context = panner.context,
        source = context.createMediaStreamSource(stream);
    source.connect(panner);
    this.audionodes = { listener, panner, context, source };
    this.mouth.audio.play();
  }
  this.setVolume = async function(volume) {
    if (this.mouth) {
      if (!this.mouth.audio) {
        await this.mout.createAudio(null, listener);
      }
      this.mouth.audio.gain.gain.value = volume;
    }
  }
}, elation.engine.things.janusghost);

});

