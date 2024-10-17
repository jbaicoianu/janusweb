window.NAF = {
  adapters: {
    adapters: {},
    register: function(name, instance) {
      console.log('NAF registered adapter', name, instance);
      NAF.adapters.adapters[name] = instance;
    },
    make: function(name) {
      if (typeof NAF != 'undefined' && name in NAF.adapters.adapters) {
        return new NAF.adapters.adapters[name];
      }
      return null;
    }
  }
};
class JanusNAF extends EventTarget {
  constructor(clientId) {
    super();
    this.clientId = clientId;
    this.connectedClients = {};
    this.activeDataChannels = {};
  }
  connect(serverURL, appName, roomName) {
    let adapter = NAF.adapters.make('janus');
    if (!adapter) {
      console.error('Janus NAF adapter not found');
      return;
    }
    adapter.setServerUrl(serverURL);
    adapter.setApp(appName);
    adapter.setRoom(roomName);
    adapter.setClientId(this.clientId);
    adapter.setPeerConnectionConfig(this.getPeerConnectionConfig());
    //console.log('I have an adapter', adapter, this.clientId);

    var webrtcOptions = this.getMediaConstraints();
    adapter.setWebRtcOptions(webrtcOptions);

    adapter.setServerConnectListeners(
      this.connectSuccess.bind(this),
      this.connectFailure.bind(this)
    );
    adapter.setDataChannelListeners(
      this.dataChannelOpen.bind(this),
      this.dataChannelClosed.bind(this),
      this.receivedData.bind(this)
    );
    adapter.setRoomOccupantListener(this.occupantsReceived.bind(this));

    this.adapter = adapter;
    return this.adapter.connect();
  }
  getMediaConstraints() {
    return {
      audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
      },
      video: {
        width: 256,
        height: 256,
      },
/*
      audio: true,
      video: true,
*/
      datachannel: true
    };
  }
  connectSuccess(clientId) {
    console.log('connected', clientId);
    //adapter.clientId = clientId;
    this.adapter.session.verbose = true;


/*
    navigator.mediaDevices.getUserMedia(this.getMediaConstraints())
      .then(localStream => {
        console.log('got mic', localStream);
        this.adapter.setLocalMediaStream(localStream);
        this.dispatchEvent(new CustomEvent('voip-media-change', {detail: { stream: localStream }}));
      });
*/


  }
  connectFailure(id) {
console.log('connect failed', id);
  }
  dataChannelOpen(id) {
console.log('datachannel open', id);
    let ms = this.adapter.mediaStreams[id];
    if (ms) {
      this.dispatchEvent(new CustomEvent('voip-user-connect', {detail: { id: id, media: ms }}));
    }
  }
  dataChannelClosed(id) {
console.log('datachannel closed', id);
    this.dispatchEvent(new CustomEvent('voip-user-disconnect', {detail: { id: id }}));
  }
  receivedData(id) {
console.log('received data', id);
  }
  occupantsReceived(occupantList) {
console.log('occupants received', Object.keys(occupantList), Object.keys(this.connectedClients));
    var prevConnectedClients = Object.assign({}, this.connectedClients);
    this.connectedClients = occupantList;
    this.checkForDisconnectingClients(prevConnectedClients, occupantList);
    this.checkForConnectingClients(occupantList);
  }

  checkForDisconnectingClients(oldOccupantList, newOccupantList) {
    for (var id in oldOccupantList) {
      var clientFound = newOccupantList[id];
      if (!clientFound) {
        NAF.log.write('Closing stream to ', id);
        this.adapter.closeStreamConnection(id);
      }
    }
  }

  isNewClient(id) {
    return !(id in this.adapter.occupants);
  }
  // Some adapters will handle this internally
  checkForConnectingClients(occupantList) {
    for (var id in occupantList) {
      var startConnection = this.isNewClient(id) && this.adapter.shouldStartConnectionTo(occupantList[id]);
      if (startConnection) {
        //NAF.log.write('Opening datachannel to ', id);
        this.adapter.startStreamConnection(id);
      }
    }
  }

  getConnectedClients() {
    return this.connectedClients;
  }
  getPeerConnectionConfig() {
    return {
      'iceServers': [
        {
          'urls': [
            'stun:stun.l.google.com:19302',
          ]
        },
        {
          'username': 'turn',
          'credential': 'turn',
          'realm': 'turn',
          'urls': [
            'turns:voip.janusxr.org:3478',
          ]
        },
      ]
    };
  }
  setClientId(clientId) {
    if (clientId != this.clientId) {
      this.clientId = clientId;
      if (this.adapter) {
        this.adapter.setClientId(this.clientId);
        this.adapter.reconnect();
      }
    }
  }
  setRoom(roomId) {
    this.adapter.setRoom(roomId);
  }
}
