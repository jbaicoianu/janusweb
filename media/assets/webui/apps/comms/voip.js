elation.elements.define('janus-voip-client', class extends elation.elements.base {
  create() {
    this.connect();
  }
  connect() {
    let sfu = new JanusNAF(player.getNetworkUsername()); //'testclient-' + Math.floor(Math.random() * 1e6));
    this.sfu = sfu;

    sfu.connect('wss://voip.janusxr.org/', 'default', room.url, true);

    this.localuser = document.createElement('janus-voip-localuser');
    this.appendChild(this.localuser);

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
    elation.events.add(janus._target, 'room_change', (ev) => {
      if (!sfu || !sfu.adapter) return;
      console.log('change SFU room', room.url, sfu.adapter.publisher, remoteusers, sfu.adapter.room);
      if (sfu.adapter.publisher) {
        let handle = sfu.adapter.publisher.handle;
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
      sfu.adapter.setRoom(room.url)
console.log('room is now', sfu.adapter.room);
      sfu.adapter.reconnect();
    });
    // FIXME - player proxy should expose .addEventListener()
    elation.events.add(player._target, 'username_change', (ev) => this.handleUsernameChange(ev));
  }
  handleUsernameChange(ev) {
    this.sfu.setClientId(ev.data);
  }
});

elation.elements.define('janus-voip-localuser', class extends elation.elements.base {
  create() {
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

    if (this.video) {
      this.removeChild(this.video);
    }

    if (!this.label) {
      // label
      let label = document.createElement('h2');
      label.innerText = player.getNetworkUsername();
      this.appendChild(label);
      this.label = label;
    }


    // video
    if (data.getVideoTracks().length > 0) {
      let video = document.createElement('video');
      video.srcObject = data;
      this.appendChild(video);
      video.muted = true;
console.log('local user call play', video);
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

/*
    player.createObject('object', {
      id: 'cone',
      col: '#4cb96f',
      scale: V(.2),
      pos: V(0, 1.8, 0),
      autosync: true
    });
*/
  }
  toggleMute() {
    this.muted = !this.muted;
    this.stream.getAudioTracks().forEach(track => track.enabled = !this.muted);
    if (this.muted) {
      this.mutebutton.addclass('muted');
    } else {
      this.mutebutton.removeclass('muted');
    }
  }
  
});
elation.elements.define('janus-voip-remoteuser', class extends elation.elements.base {
  create() {
    this.defineAttributes({
      'muted': { type: 'boolean', default: false },
      'hasvideo': { type: 'boolean', default: false },
    });
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
    let audio = document.createElement('audio');
    audio.srcObject = data.media.audio;
    this.audio = audio;
    this.appendChild(audio);

    let remoteuser = janus.network.remoteplayers[this.id];

    if (!this.controlpanel) {
      this.controlpanel = elation.elements.create('ui-panel', { bottom: 1, append: this });
      this.mutebutton = elation.elements.create('ui-button', { label: 'Mute', name: "mutebutton", append: this.controlpanel });
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
      remoteuser.addVoice(data.media.audio);
      this.audio.muted = true;

      let label = remoteuser.getElementsByTagName('playerlabel')[0];
      if (label) {
        label.setAudioSource(audio);
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
});
elation.elements.define('janus-voip-picker', class extends elation.elements.base {
  create() {
    this.elements = elation.elements.fromString(`
       <ul>
         <li><button name="none">Just observing</button></li>
         <li><button name="audio">With my microphone</button></li>
         <!-- li><button name="video" disabled="1">With my webcam</button></li -->
       </ul>
    `, this);

    this.elements.none.addEventListener('click', (ev) => this.handleSelectNone());
    this.elements.audio.addEventListener('click', (ev) => this.handleSelectAudio(ev));
    //this.elements.video.addEventListener('click', (ev) => this.handleSelectVideo());
  }
  handleSelectNone() {
    console.log('selected none');
    janus.engine.systems.sound.enableSound();
    this.dispatchEvent(new CustomEvent('select', { detail: false }));
  }
  handleSelectAudio(ev) {
    console.log('selected audio', ev.detail);
    janus.engine.systems.sound.enableSound();
    if (!this.subpicker) {
      this.subpicker = elation.elements.create('janus-voip-picker-audio');
      this.appendChild(this.subpicker);
      elation.events.add(this.subpicker, 'select', ev => {
        document.dispatchEvent(new CustomEvent('voip-picker-select', { detail: ev.detail }));
        this.dispatchEvent(new CustomEvent('select', { detail: ev.detail }));
      });
    }
  }
  handleSelectVideo() {
    console.log('selected video');
    this.dispatchEvent(new CustomEvent('select', { detail: 'video' }));
  }
});
elation.elements.define('janus-voip-picker-audio', class extends elation.elements.base {
  create() {
    this.elements = elation.elements.fromString(`
      <div class="permissions" name="permissions">
        <ui-spinner></ui-spinner>
        Waiting for permission to be granted
      </div>
      <janus-voip-picker-mictest name="mictest"></janus-voip-picker-mictest>
      <h3>Microphone</h3>
      <ul>
        <li><ui-select name="inputDevice" label="Mic Input"></ui-select></li>
        <!-- li><ui-select name="outputDevice" label="Output"></ui-select></li -->
        <li><ui-toggle name="echoCancellation" label="Echo Cancellation"></ui-toggle></li>
        <li><ui-toggle name="noiseSuppression" label="Noise Filter"></ui-toggle></li>
      </ul>
      <h3>Video Input</h3>
      <ul>
        <li><ui-toggle name="webcamEnabled" label="Webcam"></ui-toggle></li>
        <li><ui-select name="videoDevice" label="Webcam" hidden="1"></ui-select></li>
      </ul>
      <ui-label name="error" hidden></ui-label>
      <ui-button name="submit">Continue</ui-button>
    `, this);

    janus.engine.systems.sound.enableSound();
    this.getUserMedia();

    this.elements.inputDevice.addEventListener('change', (ev) => this.getUserMedia());
    this.elements.videoDevice.addEventListener('change', (ev) => this.getUserMedia());
    //this.elements.outputDevice.addEventListener('change', (ev) => this.getUserMedia());
    elation.events.add(this.elements.echoCancellation, 'toggle', (ev) => this.getUserMedia());
    elation.events.add(this.elements.noiseSuppression, 'toggle', (ev) => this.getUserMedia());
    //elation.events.add(this.elements.webcam, 'toggle', (ev) => this.getUserMedia());
    elation.events.add(this.elements.submit, 'click', (ev) => { 
      if (!this.elements.submit.disabled) {
        this.dispatchEvent(new CustomEvent('select', {detail: this.stream})); 
      }
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
        cameras.select.innerHTML = '';
        //outputs.select.innerHTML = '';

        let hasWebcamPermission = true;
        let webcamDisabled = elation.elements.create('option', {innerHTML: 'Disabled', value: 'none', append: cameras.select});
        devices.forEach(d => {
          if (d.kind == 'audioinput') {
            elation.elements.create('option', {innerHTML: d.label, value: d.deviceId, append: inputs.select});
          } else if (cameras && d.kind == 'videoinput') {
console.log('got a videoinput', d);
            if (d.deviceId == '') {
              hasWebcamPermission = false;
            } else {
              elation.elements.create('option', {innerHTML: d.label, value: d.deviceId, append: cameras.select});
            }
          } else if (outputs && d.kind == 'audiooutput') {
            elation.elements.create('option', {innerHTML: d.label, value: d.deviceId, append: outputs.select});
          }
        });        
        if (hasWebcamPermission && this.elements.videoDevice.hidden ) {
          this.elements.webcamEnabled.hide();
          this.elements.videoDevice.show();
console.log(this.elements.videoDevice.select.childNodes);
          let option = this.elements.videoDevice.select.childNodes[0];
          option.selected = true;
          this.elements.videoDevice.select.value = option.value;
        } else {
          console.log('NO WEBCAM PERMISSION');
          this.elements.webcamEnabled.show();
          this.elements.videoDevice.hide();
        }
        this.elements.permissions.style.display = 'none';
      });

  }

  getUserMediaConstraints(args={}) {
    let constraints = {
      audio: args.audio || {},
      video: args.video || false,
    };
    constraints.audio.echoCancellation = { exact: this.elements.echoCancellation.checked };
    constraints.audio.noiseSuppression = { exact: this.elements.noiseSuppression.checked };
    constraints.audio.autoGainControl = { exact: false };

    if (this.elements.inputDevice.value && this.elements.inputDevice.value != 'default') {
      console.log('input!', this.elements.inputDevice.value);
      constraints.audio.deviceId = { exact: this.elements.inputDevice.value };
    }
    if (this.elements.videoDevice.value && this.elements.videoDevice.value != 'none') {
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

    this.elements.submit.disabled = true;
    let constraints = this.getUserMediaConstraints(overrideconstraints);
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        this.elements.submit.disabled = false;
        this.elements.mictest.setStream(stream);
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
      }).catch(err => {
        console.log('OH NO!', err);
        this.elements.error.innerHTML = err;
        this.elements.error.show();
      });
  }
});
elation.elements.define('janus-voip-picker-mictest', class extends elation.elements.base {
  create() {
    let canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 50;
    this.canvas = canvas;
    this.appendChild(canvas);
  }
  setStream(stream) {
    let listener = player.engine.systems.sound.getRealListener();
    let context = listener.context;
    console.log('my mic stream', stream, context);
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

    for (var i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i];
      
      var g = 255; //barHeight + (25 * (i/bufferLength));
      //var r = 250 * (i/bufferLength);
      var r = barHeight + (25 * (i/bufferLength));
      var b = 50;

      //ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillStyle = '#4cb96f';
      ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight);

      x += barWidth + 1;
    }
    this.drawWaveform();

    requestAnimationFrame(() => this.drawFrequencies());
  }
});
