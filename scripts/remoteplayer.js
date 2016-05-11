elation.require(['engine.things.generic', 'engine.things.maskgenerator', 'janusweb.external.JanusVOIP'], function() {
elation.component.add('engine.things.remoteplayer', function() {
  this.postinit = function() {
    this.defineProperties({
      startposition: {type: 'vector3', default: new THREE.Vector3()},
      player_id: {type: 'string', default: 'UnknownPlayer'},
      player_name: {type: 'string', default: 'UnknownPlayer'},
    });
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
    this.torso = this.spawn('generic', this.properties.player_name + '_torso', {
      'position': [0,1,0],
    });
    this.neck = this.torso.spawn('generic', this.properties.player_name + '_neck', {
      'position': [0,0.6,0]
    });
    this.head = this.neck.spawn('generic', this.properties.player_name + '_head', {
      'position': [0,0,0],
    });
    this.face = this.head.spawn('maskgenerator', this.properties.player_name + '_mask', {
      'seed': this.properties.player_name,
      'position': [0,0,-0.125],
      collidable: false,
      'tilesize': 0.075,
      'player_id': this.properties.player_name
    });
    this.label = this.face.spawn('label', this.properties.player_name + '_label', {
      size: .1,
      align: 'center',
      collidable: false,
      text: this.properties.player_name,
      position: [0,0.35,0],
      orientation: [0,1,0,0]
    });
    this.mouth = this.face.spawn('sound', this.properties.player_name + '_voice', {
      //loop: true
    });
    this.mouth.createAudio();
    var context = this.mouth.audio.context;
    this.voip = new JanusVOIPPlayer();
    this.voip.start(context);
    this.audiobuffer = new THREE.AudioBuffer(this.mouth.audio.context);
    this.audiobuffer.buffer = this.voip.rawbuffer;

    //elation.events.add(this.voip, 'voip_player_data', elation.bind(this, this.handleVoipData));
    this.audiobuffer.ready = true;
    for ( var i = 0; i < this.audiobuffer.readyCallbacks.length; i ++ ) {

      this.audiobuffer.readyCallbacks[ i ]( this.voip.rawbuffer );

    }

    this.mouth.audio.setBuffer(this.audiobuffer);
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
}, elation.engine.things.generic);

});

