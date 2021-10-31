elation.elements.define('janus-voip-client', class extends elation.elements.base {
  create() {
    this.localuser = document.createElement('janus-voip-localuser');
    this.appendChild(this.localuser);

    this.rooms = {};

    this.setRoom(room);

    let datapath = elation.config.get('janusweb.datapath', '/media/janusweb'),
        assetpath = datapath + 'assets/webui/apps/comms/';


    janus.assetpack.loadJSON([
      { "assettype":"sound", "name":"voip_ui_enter", "src":"assets/webui/apps/comms/sounds/ui_casual_pops_confirm.wav" },
      { "assettype":"sound", "name":"voip_ui_mic", "src":"assets/webui/apps/comms/sounds/ui_casual_pops_back.wav" },
      { "assettype":"sound", "name":"voip_ui_leave", "src":"assets/webui/apps/comms/sounds/ui_casual_pops_error.wav" },
    ]);

    elation.events.add(janus._target, 'room_change', (ev) => {
      if (!room.loaded) {
        room.addEventListener('room_load_processed', async () => {
          console.log('changed room', room.voipid, ev);
          this.setRoom(room);
        });
      } else {
        setTimeout(() => {
          this.setRoom(room);
        }, 0);
      }
    });
    document.addEventListener('voip-picker-select', ev => {
      let localStream = ev.detail;
      for (let k in this.rooms) {
        this.rooms[k].setInputStream(localStream);
        this.localuser.setData(localStream);
      }
      this.inputstream = localStream;
    });

  }
  setRoom(newroom) {
    let roomid = newroom.voipid || newroom.id;

    if (this.currentroom) { // && this.rooms[roomid] !== this.currentroom) {
      if (this.currentroom.disconnect) {
        this.currentroom.disconnect();
      }
      this.removeChild(this.currentroom);
    }

    if (newroom.private) {
      console.log('Room is private, don\'t connect to VOIP server');
      this.currentroom = false;
      return;
    }
    // TODO - should pass voip server and range through to the actual VOIP adapter, and pick the right adapter based on our room's voip type
    if (!this.rooms[roomid]) {
      let voiptype = room.voip || 'janus';
      this.rooms[roomid] = elation.elements.create('janus-voip-client-' + voiptype, {
        append: this,
        roomid: roomid,
      });

      if (this.inputstream) {
        this.rooms[roomid].setInputStream(this.inputstream);
      }

      elation.events.add(this.rooms[roomid], 'init', ev => {
        // FIXME - shouldn't this just bubble?
        elation.events.fire({type: 'init', element: this});
      });
    } else {
      this.appendChild(this.rooms[roomid]);
      this.rooms[roomid].connect();
    }
    this.currentroom = this.rooms[roomid];
  }
});
elation.elements.define('janus-voip-client-janus', class extends elation.elements.base {
  create() {
    this.connect();
  }
  connect() {
    if (typeof NAF != 'undefined' && !('janus' in NAF.adapters.adapters)) {
      console.log('NAF adapter not found, load it');
      elation.file.get('js', janus.ui.apps.default.apps.comms.resolveFullURL('./external/naf-janus-adapter.js'), (ev) => {
        this.connect();
      });
      return;
    }
    let sfu = new JanusNAF(player.getNetworkUsername()); //'testclient-' + Math.floor(Math.random() * 1e6));
    this.sfu = sfu;

    let voipserver = room.voipserver || 'voip.janusxr.org';

    sfu.connect('wss://' + voipserver + '/', 'default', room.url, true);

    this.localuser = this.parentNode.localuser;
    //this.localuser = document.createElement('janus-voip-localuser');
    //this.appendChild(this.localuser);

    let remoteusers = {};
    sfu.addEventListener('voip-media-change', (ev) => {
      console.log('got some media', ev.detail);
      this.localuser.setData(ev.detail.stream);
    });
    sfu.addEventListener('voip-user-connect', (ev) => {
      console.log('new client', ev);
      let el = document.createElement('janus-voip-remoteuser');
      el.setUserData(ev.detail);
      this.appendChild(el);
      remoteusers[ev.detail.id] = el;
    });
    sfu.addEventListener('voip-user-disconnect', (ev) => {
      let userid = ev.detail.id,
          user = remoteusers[userid];
      if (user) {
        user.destroy();
        setTimeout(() => { if (user.parentNode === this) this.removeChild(user); }, 250);
      }
    });
    document.addEventListener('voip-picker-select', ev => {
      let localStream = ev.detail;
      sfu.adapter.setLocalMediaStream(localStream);
      sfu.dispatchEvent(new CustomEvent('voip-media-change', {detail: { stream: localStream }}));
    });
/*
    elation.events.add(janus._target, 'room_change', (ev) => {
      if (!sfu || !sfu.adapter) return;
      console.log('change SFU room', room.url, sfu.adapter.publisher, remoteusers, sfu.adapter.room, room);
      if (sfu.adapter.publisher) {
        let handle = sfu.adapter.publisher.handle;
console.log('leave room and remove all occupants', this.room);
        sfu.adapter.sendLeave(handle, {
          notifications: true,
          data: true
        });
        for (let k in remoteusers) {
          sfu.adapter.sendLeave(handle, {
            media: k
          });
        }
      }
      for (let k in remoteusers) {
        remoteusers[k].destroy();
        delete remoteusers[k];
      }
      sfu.adapter.removeAllOccupants()
      sfu.adapter.requestedOccupants = null;
      sfu.adapter.availableOccupants = [];
      sfu.connectedClients = {};
      if (room.loaded) {
        this.initRoom(room);
      } else {
        room.addEventListener('room_load_processed', (ev) => {
          this.initRoom(room);
        });
      }
    });
*/
    // FIXME - player proxy should expose .addEventListener()
    elation.events.add(player._target, 'username_change', (ev) => this.handleUsernameChange(ev));
    elation.events.fire({type: 'init', element: this});
  }
  disconnect() {
    if (this.sfu) {
      this.sfu.adapter.disconnect();
    }
  }
  initRoom(room) {
    let sfu = this.sfu;
    if (!room.private) {
      sfu.adapter.setRoom(room.url)
      console.log('room is now', sfu.adapter.room);
      sfu.adapter.reconnect();
/*
      let handle = sfu.adapter.publisher.handle;
      sfu.adapter.sendJoin(handle, {
          notifications: true,
          data: true
      });
*/
    } else {
      console.log('new room is private, disconnect');
      setTimeout(() => {
        sfu.adapter.disconnect();
      }, 0);
    }
  }
  handleUsernameChange(ev) {
    this.sfu.setClientId(ev.data);
  }
  setInputStream(stream) {
    this.sfu.adapter.setLocalMediaStream(stream);
  }
});
elation.elements.define('janus-voip-client-hifi', class extends elation.elements.base {
  create() {
    this.defineAttribute('roomid', { type: 'string' });
    this.remoteusers = {};
    let localuser = this.parentNode.localuser;
    this.remoteusers[localuser.userid] = localuser;

    elation.file.get('js', 'https://hifi-spatial-audio-api.s3.amazonaws.com/releases/latest/HighFidelityAudio-latest.js', (ev) => {
      this.connect();
      elation.events.fire({type: 'init', element: this});
    });
    this.roomid = room.voipid || '2bfa2bd1-9338-46c3-b740-e339303a1225';
  }
  async connect() {
    let currentPosition = new HighFidelityAudio.Point3D({ "x": 0, "y": 0, "z": 0 });
    let currentOrientation = new HighFidelityAudio.Quaternion({ x: 0, y: 0, z: 0, w: 1});

    let initialHiFiAudioAPIData = new HighFidelityAudio.HiFiAudioAPIData({
      position: currentPosition,
      orientation: currentOrientation,
      providedUserID: player.getNetworkUsername(),
     });
    let hifiCommunicator = new HighFidelityAudio.HiFiCommunicator({ initialHiFiAudioAPIData });
/*
    let audioMediaStream = await navigator.mediaDevices.getUserMedia({audio: HighFidelityAudio.getBestAudioConstraints(), video: false});
    await hifiCommunicator.setInputAudioMediaStream(audioMediaStream);
    this.parentNode.localuser.setData(audioMediaStream);
*/

/*
    document.addEventListener('voip-picker-select', ev => {
console.log('voip picker select?', ev);
      let localStream = ev.detail;
      hifiCommunicator.setInputAudioMediaStream(localStream);
      this.parentNode.localuser.setData(localStream);
      console.log('enabled user mic', localStream);
    });
*/

    if (this.inputstream) {
      hifiCommunicator.setInputAudioMediaStream(this.inputstream);
    }

    const jwt = await this.getJWT();
    try {
      await hifiCommunicator.connectToHiFiAudioAPIServer(jwt);
    } catch (e) {
      console.log('Error connecting to High Fidelity:', e);
      return false;
    }

    let outputAudioMediaStream = hifiCommunicator.getOutputAudioMediaStream();
    let audio = document.createElement('audio');
    this.appendChild(audio);
    audio.srcObject = outputAudioMediaStream;

    room.getAudioNodes().then(() => {
      // TODO - integrate with the room's sound graph
      console.log('Start playing High Fidelity audio now', audio);
      if (janus.engine.systems.sound.canPlaySound) {
        audio.play();
      }
    });

    elation.events.add(janus.engine, 'engine_frame', ev => this.handleFrameUpdate(ev))

    let newUserDataSubscription = new HighFidelityAudio.UserDataSubscription({
      components: [
        HighFidelityAudio.AvailableUserDataSubscriptionComponents.Position,
        HighFidelityAudio.AvailableUserDataSubscriptionComponents.Orientation,
        HighFidelityAudio.AvailableUserDataSubscriptionComponents.VolumeDecibels
      ],
      callback: audioDataArray => this.handleUserDataSubscription(audioDataArray)
    });
    hifiCommunicator.addUserDataSubscription(newUserDataSubscription);
    hifiCommunicator.onUsersDisconnected = (users) => this.handleUsersDisconnected(users);

/*
    this.userData = {
      position: currentPosition,
      orientation: currentOrientation,
      providedUserID: player.getNetworkUsername(),
    };
*/
    this.userData = initialHiFiAudioAPIData;
    this.hifiCommunicator = hifiCommunicator;
  }
  async disconnect() {
    if (this.hifiCommunicator) {
      console.log('Disconnecting from hifi audio api server');
      return this.hifiCommunicator.disconnectFromHiFiAudioAPIServer();
    }
  }
  async getJWT() {
    if (!this.jwt) {
      let space_id = this.roomid; // FIXME - should be linked to room.id, and created programatically if it doesn't exist
      this.jwt = await fetch('/api/user/hifijwt?user_id=' + player.getNetworkUsername() + '&space_id=' + space_id).then(res => res.text());
    }
    return this.jwt;
  }
  setInputStream(stream) {
    if (this.hifiCommunicator) {
      this.hifiCommunicator.setInputAudioMediaStream(stream);
    }
    this.inputstream = stream;
  }
  handleFrameUpdate() {
    if (this.userData) {
      let pos = player.head.localToWorld(V()),
          orientation = player.head.localToWorldOrientation(),
          scale = .1;
      this.userData.position.x = pos.x * scale;
      this.userData.position.y = pos.y * scale;
      this.userData.position.z = pos.z * scale;

      this.userData.orientation.x = orientation.x;
      this.userData.orientation.y = orientation.y;
      this.userData.orientation.z = orientation.z;
      this.userData.orientation.w = orientation.w;

      if (this.hifiCommunicator._currentHiFiAudioAPIData) {
        this.hifiCommunicator.updateUserDataAndTransmit(this.userData);
      }
    }
  }
  handleUserDataSubscription(data) {
    //console.log('got data', data);
    data.forEach(user => {
      if (!this.remoteusers[user.providedUserID]) {
        this.handleUsersConnected({detail: { id: user.providedUserID, media: {}}});
      } else {
        this.remoteusers[user.providedUserID].updateVolume(Math.pow(Math.E, user.volumeDecibels / 20));
      }
    });
  }
  handleUsersConnected(ev) {
    let userid = ev.detail.id;
    if (!this.remoteusers[userid]) {
      let el = document.createElement('janus-voip-remoteuser');
      this.appendChild(el);
      this.remoteusers[userid] = el;
    }
    this.remoteusers[userid].setUserData(ev.detail);

    let remoteuser3d = janus.network.remoteplayers[userid];
    if (remoteuser3d) {
      remoteuser3d.createObject('sound', { id: 'voip_ui_enter', pos: V(0,0,0), singleshot: true });
    }
  }
  handleUsersDisconnected(users) {
    if (users) {
      users.forEach(user => {
        if (this.remoteusers[user.providedUserID]) {
          let remoteuser = this.remoteusers[user.providedUserID];
          remoteuser.parentNode.removeChild(remoteuser);
          delete this.remoteusers[user.providedUserID];

          let remoteuser3d = janus.network.remoteplayers[user.providedUserID];
          if (remoteuser3d) {
            room.createObject('sound', { id: 'voip_ui_leave', pos: remoteuser.lastposition, singleshot: true });
          }
        }
      });
    }
  }
});

elation.elements.define('janus-voip-localuser', class extends elation.elements.base {
  init() {
    super.init();
    this.defineAttribute('userid', { type: 'string', });
    this.defineAttribute('muted', { type: 'boolean', default: true, });
    this.defineAttribute('speaking', { type: 'boolean', default: false });
    this.defineAttribute('threshold', { type: 'float', default: .2 });
  }
  create() {
    this.userid = player.getNetworkUsername();
    window.addEventListener('keypress', (ev) => {
      if (ev.key == 'm') {
        if (player.enabled) {
          this.toggleMute();
        }
      }
    });
  }
  setData(data) {
    this.muted = false;

    if (this.video && this.video.parentNode === this) {
      this.removeChild(this.video);
    }

    if (!data) {
      this.stream = false;
      elation.events.fire({type: 'update', element: this});
      return;
    }

    this.userid = player.getNetworkUsername();

    if (!this.label) {
      // label
      let label = document.createElement('h2');
      label.innerText = this.userid;
      this.appendChild(label);
      this.label = label;
    }


    // video
    if (data.getVideoTracks().length > 0) {
      let video = document.createElement('video');
      video.srcObject = data;
      this.appendChild(video);
      video.muted = true;
      video.play().then(() => console.log('playing', video));
      this.video = video;
    }

    if (!this.mutebutton) {
      let mute = elation.elements.create('ui-button', {label: 'Mute', name: 'mutebutton'});
      this.appendChild(mute);
      mute.addEventListener('click', (ev) => this.toggleMute());
      this.mutebutton = mute;
    }
    // audio
/*
    let audio = document.createElement('audio');
    audio.srcObject = data.media.audio;
    this.appendChild(video);
    audio.play();
    this.audio = audio;
*/
    this.stream = data;

    let listener = player.engine.systems.sound.getRealListener();
    let context = listener.context;
    let analyser = context.createAnalyser();
    let source = context.createMediaStreamSource(this.stream);
    source.connect(analyser);

    analyser.fftSize = 32;
    this.analyser = analyser;
    this.audiobuffer = new Uint8Array(analyser.frequencyBinCount);

    if (this.updateVolumeInterval) {
      clearInterval(this.updateVolumeInterval);
      this.updateVolumeInterval = false;
    }
    this.updateVolumeInterval = setInterval(() => {
      analyser.getByteFrequencyData(this.audiobuffer);
      let sum = 0;
      for (let i = 0; i < this.audiobuffer.length; i++) {
        sum += this.audiobuffer[i];
      }
      let avg = sum / this.audiobuffer.length;
      this.updateVolume(avg / 100);
    }, 20);

/*
    player.createObject('object', {
      id: 'cone',
      col: '#4cb96f',
      scale: V(.2),
      pos: V(0, 1.8, 0),
      autosync: true
    });
*/
    elation.events.fire({type: 'update', element: this});
  }
  unsetData() {
    elation.events.fire({type: 'update', element: this});
  }
  toggleMute() {
    this.muted = !this.muted;
    this.stream.getAudioTracks().forEach(track => track.enabled = !this.muted);
    if (this.muted) {
      this.mutebutton.addclass('muted');
      elation.events.fire({type: 'mute', element: this});
    } else {
      this.mutebutton.removeclass('muted');
      elation.events.fire({type: 'unmute', element: this});
    }
  }
  updateVolume(percent) {
    this.averagevolume = (percent * .6 + this.averagevolume * .4)
    if (isNaN(this.averagevolume)) this.averagevolume = 0;
    //this.style.opacity = percent;
    if (this.averagevolume > this.threshold) {
      this.speaking = true;
      player.defaultanimation = 'speak';
      if (this.colorreset) {
        clearTimeout(this.colorreset);
      } 
      this.colorreset = setTimeout(() => {
        this.speaking = false;
        this.colorreset = false;
        player.defaultanimation = 'idle';
      }, 200);
      if (player.ghost) {
        player.ghost.setSpeakingVolume(this.averagevolume);
      }
    } else {
      if (player.ghost) {
        player.ghost.setSpeakingVolume(0);
      }
    }
  }
  
});
elation.elements.define('janus-voip-remoteuser', class extends elation.elements.base {
  create() {
    this.defineAttributes({
      'muted': { type: 'boolean', default: false },
      'hasaudio': { type: 'boolean', default: false },
      'hasvideo': { type: 'boolean', default: false },
      'hasvideo': { type: 'boolean', default: false },
      'averagevolume': { type: 'float', default: 0 },
      'speaking': { type: 'boolean', default: false },
      'threshold': { type: 'float', default: .2 },
    });
    this.lastposition = V();
    setTimeout(() => this.setAttribute('active', true), 100);
  }
  setUserData(data) {
    this.id = data.id;

    if (!this.label) {
      let label = document.createElement('h2');
      label.innerText = this.id;
      this.appendChild(label);
      this.label = label;
    }

    if (data.media.video) {
      let track = data.media.video.getVideoTracks()[0];
      data.media.video.addEventListener('addtrack', (ev) => console.log('a track was added', ev));
      data.media.video.addEventListener('removetrack', (ev) => console.log('a track was added', ev));
      let video = document.createElement('video');
      video.muted = true;
      video.srcObject = data.media.video;
      this.appendChild(video);
      console.log('remote user call play', video);
      video.play()
        .then(() => { console.log('remote user video playing', video, this); })
        .catch(e => { console.log('failed to play remote video', video, e, this); });
      this.video = video;
      video.addEventListener('resize', (ev) => { console.log('video resized', video, this); this.updateVideo(); });
      this.updateVideo();
      this.hasvideo = true;
    } else {
      this.hasvideo = false;
    }

    // audio
    if (data.media.audio) {
      let audio = document.createElement('audio');
      audio.srcObject = data.media.audio;
      this.audio = audio;
      this.appendChild(audio);
      this.hasaudio = true;

      let listener = player.engine.systems.sound.getRealListener();
      let context = listener.context;
      let analyser = context.createAnalyser();
      let source = context.createMediaStreamSource(audio.srcObject);
      source.connect(analyser);

      analyser.fftSize = 32;
      this.analyser = analyser;
      this.audiobuffer = new Uint8Array(analyser.frequencyBinCount);

      if (this.updateVolumeInterval) {
        clearInterval(this.updateVolumeInterval);
        this.updateVolumeInterval = false;
      }
      this.updateVolumeInterval = setInterval(() => {
        analyser.getByteFrequencyData(this.audiobuffer);
        let sum = 0;
        for (let i = 0; i < this.audiobuffer.length; i++) {
          sum += this.audiobuffer[i];
        }
        let avg = sum / this.audiobuffer.length;
        this.updateVolume(avg / 100);
      }, 20);
    }

    let remoteuser = janus.network.remoteplayers[this.id];

    if (!this.controlpanel) {
      this.controlpanel = elation.elements.create('ui-panel', { bottom: 1, append: this });
      this.mutebutton = elation.elements.create('ui-button', { label: 'Mute', name: "mutebutton", append: this.controlpanel });
/*
      this.volume = elation.elements.create('ui-slider', { name: "volume", min: 0, max: 2, value: this.video.volume, append: this.controlpanel });

      elation.events.add(this.volume, 'change', (ev) => {
        remoteuser.setVolume(ev.data);
        this.muted = (ev.data == 0);
        if (this.muted && !this.mutebutton.hasclass('muted')) {
          this.mutebutton.addclass('muted');
        } else if (!this.muted && this.mutebutton.hasclass('muted')) {
          this.mutebutton.removeclass('muted');
        }
      });
*/
      elation.events.add(this.mutebutton, 'click', (ev) => {
/*
        remoteuser.setVolume(0);
        this.volume.handles[0].value = 0;
        this.volume.handles[0].render();
*/
        this.toggleMute();
      });
    }

    if (remoteuser) {
      if (this.hasaudio) {
        remoteuser.addVoice(data.media.audio);
        this.audio.muted = true;

        let label = remoteuser.getElementsByTagName('playerlabel')[0];
        if (label) {
          label.setAudioSource(this.audio);
        }
      }

      // FIXME - this is pretty unreliable right now, probably some race conditions about loading the avatar vs when we get the video stream
      //         it also breaks if the avatar changes their avatar after initializing their webcam
/*
      setTimeout(() => {
        let screenid = 'screen_Cube.004';
        if (this.video) {
          let face = remoteuser.face;
  console.log('video guy has a face', face, this.video);
          if (face && face.parts) {
            let screen = this.screen;
            if (face !== this.face) {
              this.face = remoteuser.face;
              screen = false;
            }
            if (!screen) {
              screen = face.parts[screenid];
            }
  console.log('face has a screen', screen);
            if (screen) {
              let videoid = this.id + '_video';
              room.loadNewAsset('video', { id: videoid, video: this.video });
              screen.video_id = videoid;
              screen.lighting = false;
            }
          }
        }
      }, 2000);
*/
      if (this.video) {
        remoteuser.setRemoteVideo(this.video);
      }
      this.remoteuser = remoteuser;
      this.label3d = remoteuser.getElementsByTagName('playerlabel')[0];


      elation.events.add(this.remoteuser, 'update', ev => {
        // Store user's last known position so we know where they were once they leave
        if (this.lastposition) {
          this.remoteuser.localToWorld(this.lastposition.set(0,0,0));
        }
      });
    }

    console.log('got remote media', data, remoteuser);
  }
  destroy() {
    console.log('stop media', this.id);
    if (this.video) {
      //this.video.pause();
    }
    if (this.audio) {
      //this.audio.pause();
      let tracks = this.audio.srcObject.getTracks();
      //tracks.forEach(track => { console.log('stop track', track); track.stop(); });
    }
    this.removeAttribute('active');
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }
  updateVideo() {
    let video = this.video;
    if (video) {
      let hasclass = elation.html.hasclass(video, 'active');
      if (video.videoWidth > 0 && video.videoHeight > 0 && !hasclass) {
        this.hasvideo = true;
        elation.html.addclass(video, 'active');
      } else if (hasclass && (video.videoWidth == 0 || video.videoHeight == 0)) {
        this.hasvideo = false;
        elation.html.removeclass(video, 'active');
      }
    }
  }
  toggleMute() {
    this.muted = !this.muted;
    let remoteuser = janus.network.remoteplayers[this.id];
    if (this.muted) {
      this.mutebutton.addclass('muted');
      this.lastvolume = this.volume.handles[0].value;
      remoteuser.setVolume(0);
      this.volume.handles[0].value = 0;
      this.volume.handles[0].render();
    } else {
      this.mutebutton.removeclass('muted');
      remoteuser.setVolume(this.lastvolume);
      this.volume.handles[0].value = this.lastvolume;
      this.volume.handles[0].render();
    }
  }
  updateVolume(percent) {
    this.averagevolume = (percent * .6 + this.averagevolume * .4)
    if (isNaN(this.averagevolume)) this.averagevolume = 0;
    //this.style.opacity = percent;
//console.log('update volume', percent, this);
    if (this.averagevolume > this.threshold) {
      this.speaking = true;
      if (this.colorreset) {
        clearTimeout(this.colorreset);
      } 
      this.colorreset = setTimeout(() => {
        this.speaking = false;
        this.colorreset = false;
      }, 200);
    }

    if (this.label3d) {
      this.label3d.setAudioVolume(this.averagevolume);
      this.remoteuser.setSpeakingVolume(this.averagevolume);
    }
  }
});
elation.elements.define('janus-voip-picker', class extends elation.elements.base {
  create() {
    this.elements = elation.elements.fromString(`
       <ul>
         <li><ui-togglebutton name="none" active>Just observing</ui-togglebutton></li>
         <li><ui-togglebutton name="audio">With a mic</ui-togglebutton></li>
         <!-- li><ui-togglebutton name="video" disabled="1">With my webcam</ui-togglebutton></li -->
       </ul>
    `, this);
    this.defineAttributes({
      'showvideo': { type: 'boolean', default: true },
    });

    elation.events.add(this.elements.none, 'click', (ev) => this.handleSelectNone());
    elation.events.add(this.elements.audio, 'click', (ev) => this.handleSelectAudio(ev));
    //this.elements.video.addEventListener('click', (ev) => this.handleSelectVideo());

    this.voipconfig = player.getSetting('voip');
    if (this.voipconfig) {
      // FIXME - starting the audio without explicitly asking the user within this session is bad, but we want to resume across refreshes
      //         We should use a session cookie-based timeout in addition to the localStorage settings
      this.handleSelectAudio({detail: 1});
    }
    console.log('voip picker loaded config', this.voipconfig);
  }
  handleSelectNone() {
    console.log('selected none');
    //janus.engine.systems.sound.enableSound();
    if (this.subpicker && this.subpicker.parentNode) {
      this.subpicker.parentNode.removeChild(this.subpicker);
    }
    this.dispatchEvent(new CustomEvent('select', { detail: false }));
    document.dispatchEvent(new CustomEvent('voip-picker-select', { detail: false }));
    player.setSetting('voip', false);
    this.subpicker.stopUserMedia();
    if (!this.elements.none.active) this.elements.none.activate();
    this.elements.audio.deactivate();
  }
  handleSelectAudio(ev) {
    console.log('selected audio', ev.detail, this.voipconfig);
    //janus.engine.systems.sound.enableSound();
    if (!this.subpicker) {
      this.subpicker = elation.elements.create('janus-voip-picker-audio', { config: (this.voipconfig ? JSON.stringify(this.voipconfig) : false), showvideo: this.showvideo });
      elation.events.add(this.subpicker, 'select', ev => {
console.log('SELECTED', ev.detail);
        document.dispatchEvent(new CustomEvent('voip-picker-select', { detail: ev.detail }));
        this.dispatchEvent(new CustomEvent('select', { detail: ev.detail }));
        let voipsettings = this.subpicker.getSettings();
        console.log('update voip settings', voipsettings);
        player.setSetting('voip', voipsettings);
      });
    }
    this.appendChild(this.subpicker);
    this.subpicker.getUserMedia();
    if (!this.elements.audio.active) this.elements.audio.activate();
    this.elements.none.deactivate();
  }
  handleSelectVideo() {
    console.log('selected video');
    this.dispatchEvent(new CustomEvent('select', { detail: 'video' }));
  }
});
elation.elements.define('janus-voip-picker-audio', class extends elation.elements.base {
  create() {
    this.defineAttributes({
      'config': { type: 'object', default: false },
      'showvideo': { type: 'boolean', default: true },
    });
    let tplstr = `
      <div class="permissions" name="permissions">
        <ui-spinner></ui-spinner>
        Waiting for permission to be granted
      </div>
      <h3>Voice</h3>
      <ul>
        <li class="micselect">
          <ui-select name="inputDevice"></ui-select>
          <janus-voip-picker-mictest name="mictest" width="75" height="25"></janus-voip-picker-mictest>
        </li>
        <!-- li><ui-select name="outputDevice" label="Output"></ui-select></li -->
        <li><ui-toggle name="echoCancellation" label="Echo Cancellation" checked></ui-toggle></li>
        <li><ui-toggle name="noiseSuppression" label="Noise Reduction" checked></ui-toggle></li>
      </ul>
    `;
  
    if (this.showvideo && this.showvideo != 'false') {
       tplstr += `<h3>Video</h3>
        <ul>
          <li><ui-toggle name="webcamEnabled" label="Webcam"></ui-toggle></li>
          <li>
            <ui-select name="videoDevice" label="Webcam" hidden="1"></ui-select>
            <janus-voip-picker-videotest name="videotest" width="150" height="150"></janus-voip-picker-videotest>
          </li>
        </ul>
      `;
    }
    tplstr += `
      <ui-label name="error" hidden></ui-label>
      <ui-button name="submit">Continue</ui-button>
    `;
    this.elements = elation.elements.fromString(tplstr, this);

    if (this.config) {
      console.log('I have a config!', this.config);
      this.setSettings(JSON.parse(this.config));
    }

    //janus.engine.systems.sound.enableSound();
    //this.getUserMedia();

    this.elements.inputDevice.addEventListener('change', (ev) => this.getUserMedia());
    if (this.elements.videoDevice) {
      this.elements.videoDevice.addEventListener('change', (ev) => this.getUserMedia());
    }
    //this.elements.outputDevice.addEventListener('change', (ev) => this.getUserMedia());
    elation.events.add(this.elements.echoCancellation, 'toggle', (ev) => this.getUserMedia());
    elation.events.add(this.elements.noiseSuppression, 'toggle', (ev) => this.getUserMedia());
    //elation.events.add(this.elements.webcam, 'toggle', (ev) => this.getUserMedia());
    elation.events.add(this.elements.submit, 'click', (ev) => { 
      if (!this.elements.submit.disabled) {
        this.currentsettings = this.getSettings();
        this.dispatchEvent(new CustomEvent('select', {detail: this.stream})); 
      }
      this.updateButton();
    });
    elation.events.add(this.elements.webcamEnabled, 'toggle', (ev) => {
      console.log('toggled', ev.data, ev);
      if (ev.data) {
        this.getUserMedia({video: true});
      }
    });
  }
  updateDevices() {
    this.elements.submit.disabled = true;
    this.elements.permissions.style.display = 'block';
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        this.elements.submit.disabled = false;
        this.devices = devices;
        let inputs = this.elements.inputDevice,
            cameras = this.elements.videoDevice,
            outputs = this.elements.outputDevice;

        // FIXME - I'm not really using these UI elements properly here, I shouldn't be mucking with the HTML elements directly
        inputs.select.innerHTML = '';
        let hasWebcamPermission = true;
        let webcamDisabled;
        if (cameras) {
          cameras.select.innerHTML = '';
          //outputs.select.innerHTML = '';

          webcamDisabled = elation.elements.create('option', {innerHTML: 'Disabled', value: 'none', append: cameras.select});
        }
        devices.forEach(d => {
          if (d.kind == 'audioinput') {
            elation.elements.create('option', {innerHTML: d.label, value: d.deviceId, append: inputs.select});
          } else if (cameras && d.kind == 'videoinput') {
            if (d.deviceId == '') {
              hasWebcamPermission = false;
            } else {
              elation.elements.create('option', {innerHTML: d.label, value: d.deviceId, append: cameras.select});
            }
          } else if (outputs && d.kind == 'audiooutput') {
            elation.elements.create('option', {innerHTML: d.label, value: d.deviceId, append: outputs.select});
          }
        });        
        if (this.elements.videoDevice) {
          if (hasWebcamPermission && this.elements.videoDevice.hidden ) {
            this.elements.webcamEnabled.hide();
            this.elements.videoDevice.show();
            let option = this.elements.videoDevice.select.childNodes[0];
            option.selected = true;
            this.elements.videoDevice.select.value = option.value;
          } else {
            console.log('NO WEBCAM PERMISSION');
            this.elements.webcamEnabled.show();
            this.elements.videoDevice.hide();
          }
        }
        this.elements.permissions.style.display = 'none';

        if (this.config) {
          let voipconfig = JSON.parse(this.config);
          if (voipconfig.inputDevice) {
            //this.elements.inputDevice.select.value = this.voipconfig.inputDevice;
            this.elements.inputDevice.setSelected(voipconfig.inputDevice);
          }
          if (voipconfig.videoDevice && this.elements.videoDevice) {
            this.elements.videoDevice.setSelected(voipconfig.videoDevice);
          }
          //this.dispatchEvent(new CustomEvent('select', {detail: this.stream})); 
        }
      });

  }

  getUserMediaConstraints(args={}) {
    let constraints = {
      audio: args.audio || {},
      video: args.video || false,
    };
    constraints.audio.echoCancellation = { ideal: this.elements.echoCancellation.checked };
    constraints.audio.noiseSuppression = { ideal: this.elements.noiseSuppression.checked };
    constraints.audio.autoGainControl = { ideal: false };

    if (this.elements.inputDevice.value && this.elements.inputDevice.value != 'default') {
      console.log('input!', this.elements.inputDevice.value);
      constraints.audio.deviceId = { exact: this.elements.inputDevice.value };
    }
    if (this.elements.videoDevice && this.elements.videoDevice.value && this.elements.videoDevice.value != 'none') {
      console.log('video!', this.elements.videoDevice.value);
      constraints.video = {
        deviceId: { exact: this.elements.videoDevice.value },
        height: 256,
        width: 256
      };
    }

    return constraints;
  }
  getUserMedia(overrideconstraints) {
    if (!this.elements) {
      // Element not initialized yet. try again shortly
      setTimeout(() => this.getUserMedia(overrideconstraints), 0);
      return;
    }
    this.elements.submit.disabled = true;
    let constraints = this.getUserMediaConstraints(overrideconstraints);
    this.updateButton();
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        this.elements.submit.disabled = false;
        this.elements.mictest.setStream(stream);
        if (this.elements.videotest) {
          this.elements.videotest.setStream(stream);
        }
        if (this.stream) {
          let tracks = this.stream.getTracks();
          tracks.forEach(t => {
            t.stop();
          });
        }
        this.stream = stream;

        if (!this.devices || overrideconstraints) {
          this.updateDevices();
        }
        this.elements.error.innerHTML = '';
        this.elements.error.hide();
        this.updateButton();
      }).catch(err => {
        console.log('OH NO!', err);
        this.elements.error.innerHTML = err;
        this.elements.error.show();
      });
  }
  stopUserMedia() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
  getSettings() {
    let settings = {}
    let keys = [
        "inputDevice",
        "echoCancellation",
        "noiseSuppression",
        "webcamEnabled",
        "videoDevice",
    ];
    keys.forEach(k => {
      let el = this.elements[k];
      if (this.elements[k]) {
        if (el instanceof elation.elements.ui.toggle) {
          settings[k] = this.elements[k].checked;
        } else {
          settings[k] = this.elements[k].value;
        }
      }
    });
    return settings;
  }
  settingsHaveChanged() {
    let changed = false;
    if (this.currentsettings) {
      let settings = this.getSettings();
      for (let k in settings) {
        if (settings[k] != this.currentsettings[k]) {
          changed = true;
          break;
        }
      }
    }
    return changed;
  }
  setSettings(settings) {
    if (settings) {
      if ('inputDevice' in settings) this.elements['inputDevice'].setSelected(settings['inputDevice']);
      if ('echoCancellation' in settings) this.elements['echoCancellation'].checked = settings['echoCancellation'];
      if ('noiseSuppression' in settings) this.elements['noiseSuppression'].checked = settings['noiseSuppression'];
      if ('webcamEnabled' in settings && this.elements['webcamEnabled']) this.elements['webcamEnabled'].checked = settings['webcamEnabled'];
      if ('videoDevice' in settings && this.elements['videoDevice']) this.elements['videoDevice'].setSelected(settings['videoDevice']);

      this.currentsettings = settings;
    }
  }
  updateButton() {
    let client = document.querySelector('janus-voip-client');
    if (client) {
      if (client.inputstream) {
        if (this.settingsHaveChanged()) {
          this.elements.submit.innerHTML = 'Update';
          this.elements.submit.disabled = false;
        } else {
          this.elements.submit.innerHTML = '✔️ Connected';
          this.elements.submit.disabled = true;
        }
      } else {
        this.elements.submit.innerHTML = 'Join Audio';
          this.elements.submit.disabled = false;
      }
    }
  }
});
elation.elements.define('janus-voip-picker-mictest', class extends elation.elements.base {
  init() {
    this.defineAttributes({
      width: { type: 'integer', default: 150 },
      height: { type: 'integer', default: 50 },
    });
  }
  create() {
    let canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    this.canvas = canvas;
    this.appendChild(canvas);
  }
  setStream(stream) {
    let listener = player.engine.systems.sound.getRealListener();
    let context = listener.context;
    let source = context.createMediaStreamSource(stream);
    let analyser = context.createAnalyser();
    source.connect(analyser);

    this.stream = stream;
    this.analyser = analyser;

    analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    this.drawFrequencies();
  }
  drawWaveform() {
    let canvas = this.canvas,
        ctx = canvas.getContext('2d'),
        bufferLength = this.dataArray.length;
    this.analyser.getByteTimeDomainData(this.dataArray);

    //ctx.fillStyle = 'rgb(0, 0, 0)';
    //ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0,255,0, .6)';
    ctx.beginPath();


    let slicewidth = this.canvas.width / bufferLength;
    for (let i = 0, x = 0; i < bufferLength; i++) {
      let y = this.canvas.height / 2 + 1.5 * (this.dataArray[i] - 128);
      if (i == 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += slicewidth;
    }

    ctx.lineTo(this.canvas.width, this.canvas.height/2);
    ctx.stroke();

    //requestAnimationFrame(() => this.drawWaveform());
  }
  drawFrequencies() {
    let canvas = this.canvas,
        ctx = canvas.getContext('2d'),
        dataArray = this.dataArray,
        bufferLength = dataArray.length,
        analyser = this.analyser;;

    analyser.getByteFrequencyData(this.dataArray);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let barWidth = (canvas.width / bufferLength) * 2.5,
        x = 0;

    ctx.fillStyle = '#4cb96f';
    for (var i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i];
      
      var g = 255; //barHeight + (25 * (i/bufferLength));
      //var r = 250 * (i/bufferLength);
      var r = barHeight + (25 * (i/bufferLength));
      var b = 50;

      //ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight);

      x += barWidth + 1;
    }
    this.drawWaveform();

    requestAnimationFrame(() => this.drawFrequencies());
  }
});
elation.elements.define('janus-voip-picker-videotest', class extends elation.elements.base {
  init() {
    this.defineAttributes({
      width: { type: 'integer', default: 150 },
      height: { type: 'integer', default: 150 },
    });
  }
  setStream(stream) {
    let video = this.video;
    if (stream.getVideoTracks().length > 0) {
      if (!video) {
        this.video = document.createElement('video');
        video = this.video;
        video.width = this.width;
        video.height = this.height;
        this.appendChild(video);
      } else if (video.parentNode !== this) {
        this.appendChild(video);
      }
      video.srcObject = stream;
      video.muted = true;
      video.play().then(() => console.log('playing', video));
    } else if (video && video.parentNode) {
      video.parentNode.removeChild(video);
    }
  }
});
