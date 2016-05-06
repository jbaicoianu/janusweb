(function() {
  // event dispatcher by mrdoob https://github.com/mrdoob/eventdispatcher.js
  var EventDispatcher = function () {}

  EventDispatcher.prototype = {

    constructor: EventDispatcher,

    apply: function ( object ) {

      object.addEventListener = EventDispatcher.prototype.addEventListener;
      object.hasEventListener = EventDispatcher.prototype.hasEventListener;
      object.removeEventListener = EventDispatcher.prototype.removeEventListener;
      object.dispatchEvent = EventDispatcher.prototype.dispatchEvent;

    },

    addEventListener: function ( type, listener ) {

      if ( this._listeners === undefined ) this._listeners = {};

      var listeners = this._listeners;

      if ( listeners[ type ] === undefined ) {

        listeners[ type ] = [];

      }

      if ( listeners[ type ].indexOf( listener ) === - 1 ) {

        listeners[ type ].push( listener );

      }

    },

    hasEventListener: function ( type, listener ) {

      if ( this._listeners === undefined ) return false;

      var listeners = this._listeners;

      if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {

        return true;

      }

      return false;

    },

    removeEventListener: function ( type, listener ) {

      if ( this._listeners === undefined ) return;

      var listeners = this._listeners;
      var listenerArray = listeners[ type ];

      if ( listenerArray !== undefined ) {

        var index = listenerArray.indexOf( listener );

        if ( index !== - 1 ) {

          listenerArray.splice( index, 1 );

        }

      }

    },

    dispatchEvent: function ( event ) {
        
      if ( this._listeners === undefined ) return;

      var listeners = this._listeners;
      var listenerArray = listeners[ event.type ];

      if ( listenerArray !== undefined ) {

        event.target = this;

        var array = [];
        var length = listenerArray.length;

        for ( var i = 0; i < length; i ++ ) {

          array[ i ] = listenerArray[ i ];

        }

        for ( var i = 0; i < length; i ++ ) {

          array[ i ].call( this, event );

        }

      }

    }

  };
  JanusVOIPRecorder = function(args) {
    if (!args) var args = {};
    this.sampleRate = args.sampleRate || 11000;
  }
  EventDispatcher.prototype.apply(JanusVOIPRecorder.prototype);

  JanusVOIPRecorder.prototype.start = function() {
    if (!this.context) {
      this.createContext();
    }
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.getUserMedia) {
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }

    navigator.getUserMedia({audio: true}, this.attachContext.bind(this), this.handleFailure.bind(this));
  }
  JanusVOIPRecorder.prototype.stop = function() {
    if (this.voipsource) {
      var tracks = this.voipsource.getAudioTracks();
      tracks.forEach(function(track) { 
        track.stop(); 
      });
      this.voipsource = false;
      this.dispatchEvent({type: 'voip_stop'});
    }
  }
  JanusVOIPRecorder.prototype.createContext = function() {
    var audioContext = window.AudioContext || window.webkitAudioContext;
    if (!this.context) {
      this.context = new audioContext();
    }
    var context = this.context;

    // retrieve the current sample rate to be used for WAV packaging
    var sampleRate = context.sampleRate;

    // creates a gain node
    this.volume = context.createGain();

    /* From the spec: This value controls how frequently the audioprocess event is 
    dispatched and how many sample-frames need to be processed each call. 
    Lower values for buffer size will result in a lower (better) latency. 
    Higher values will be necessary to avoid audio breakup and glitches */
    var bufferSize = 4096;
    this.recorder = context.createScriptProcessor(bufferSize, 1, 1);
    var recorder = this.recorder;
    // we connect the recorder
    this.volume.connect (recorder);
    recorder.connect (context.destination); 

    this.recorder = recorder;
    this.dispatchEvent({type: 'voip_init'});
  }
  JanusVOIPRecorder.prototype.attachContext = function(audiostream) {
    this.voipsource = audiostream;

    // creates an audio node from the microphone incoming stream
    var audioInput = this.context.createMediaStreamSource(audiostream);

    // connect the stream to the gain node
    audioInput.connect(this.volume);

    var recorder = this.recorder,
        context = this.context;
    recorder.onaudioprocess = this.processAudio.bind(this, context);
    var tracks = this.voipsource.getTracks();
    tracks.forEach(function(track) { 
      track.addEventListener('ended', function() { recorder.onaudioprocess = null; });
    }.bind(this))

    this.dispatchEvent({type: 'voip_start', element: this});
  }
  JanusVOIPRecorder.prototype.processAudio = function(context, e){
    var left = e.inputBuffer.getChannelData(0);
    var resampler = new Resampler(context.sampleRate, this.sampleRate, 1, left);
    var what = resampler.resampler(left.length);
    var newbuf = new Uint16Array(resampler.outputBuffer.length);
    for (var i = 0; i < newbuf.length; i++) {
      newbuf[i] = Math.floor(resampler.outputBuffer[i] * 32767);
    }
    this.dispatchEvent({type: 'voip_data', element: this, data: newbuf});
  }
  JanusVOIPRecorder.prototype.handleFailure = function(err) {
    this.dispatchEvent({type: 'voip_error', element: this, data: err});
  }


  JanusVOIPPlayer = function(args) {
    if (!args) var args = {};
    this.sampleRate = args.sampleRate || 11000;
    this.bufferTime = args.bufferTime || 1.0;
    this.audioScale = args.audioScale || 32768;

    this.bufferLength = this.sampleRate * this.bufferTime;
  }
  EventDispatcher.prototype.apply(JanusVOIPPlayer.prototype);

  JanusVOIPPlayer.prototype.start = function(context) {
    this.rawbuffer = context.createBuffer(2, this.bufferLength, this.sampleRate);
    this.readoffset = 0;
    this.writeoffset = 0;

    this.dispatchEvent({type: 'voip_player_init', element: this});
  }
  JanusVOIPPlayer.prototype.speak = function(noise) {
    var binary_string = window.atob(noise);
    var len = binary_string.length;

    // Even though this is a mono source, we treat it as stereo so it can be used as poitional audio
    var bufferLeft = this.rawbuffer.getChannelData(0);
    var bufferRight = this.rawbuffer.getChannelData(1);

    // Decode the binary string into an unsigned char array
    var audiodata = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      audiodata[i] = binary_string.charCodeAt(i);
    }

    // Create a new view into the decoded data which gives us the data as int16_t instead of unsigned chars
    var audiodata16 = new Int16Array(audiodata.buffer);

    var startoffset = this.writeoffset;
    // Write the scaled data into our buffer, treating it as a looping ring buffer
    for (var i = 0; i < audiodata16.length; i++) {
      var idx = (startoffset + i) % this.bufferLength;
      bufferLeft[idx] = bufferRight[idx] = (audiodata16[i] / this.audioScale);
    }
    this.writeoffset += audiodata16.length;

    this.dispatchEvent({type: 'voip_player_data', element: this, data: {buffer: bufferLeft, start: startoffset, end: this.writeoffset}});
    if (this.talktimer) { 
      clearTimeout(this.talktimer);
    }
    this.talktimer = setTimeout(elation.bind(this, this.stop), this.bufferLength * 500);
  }
  JanusVOIPPlayer.prototype.stop = function() {
    this.dispatchEvent({type: 'voip_player_stop', element: this});
  }
  JanusVOIPPlayer.prototype.silence = function() {
    var bufferLeft = this.rawbuffer.getChannelData(0);
    var bufferRight = this.rawbuffer.getChannelData(1);
    for (var i = 0; i < bufferLeft.length; i++) {
      bufferLeft[i] = bufferRight[i] = 0;
    }
    this.writeoffset = 0;
  }






  //JavaScript Audio Resampler
  //Copyright (C) 2011-2015 Grant Galitz
  //Released to Public Domain
  function Resampler(fromSampleRate, toSampleRate, channels, inputBuffer) {
      //Input Sample Rate:
      this.fromSampleRate = +fromSampleRate;
      //Output Sample Rate:
      this.toSampleRate = +toSampleRate;
      //Number of channels:
      this.channels = channels | 0;
      //Type checking the input buffer:
      if (typeof inputBuffer != "object") {
          throw(new Error("inputBuffer is not an object."));
      }
      if (!(inputBuffer instanceof Array) && !(inputBuffer instanceof Float32Array) && !(inputBuffer instanceof Float64Array)) {
          throw(new Error("inputBuffer is not an array or a float32 or a float64 array."));
      }
      this.inputBuffer = inputBuffer;
      //Initialize the resampler:
      this.initialize();
  }
  Resampler.prototype.initialize = function () {
    //Perform some checks:
    if (this.fromSampleRate > 0 && this.toSampleRate > 0 && this.channels > 0) {
      if (this.fromSampleRate == this.toSampleRate) {
        //Setup a resampler bypass:
        this.resampler = this.bypassResampler;		//Resampler just returns what was passed through.
              this.ratioWeight = 1;
              this.outputBuffer = this.inputBuffer;
      }
      else {
              this.ratioWeight = this.fromSampleRate / this.toSampleRate;
        if (this.fromSampleRate < this.toSampleRate) {
          /*
            Use generic linear interpolation if upsampling,
            as linear interpolation produces a gradient that we want
            and works fine with two input sample points per output in this case.
          */
          this.compileLinearInterpolationFunction();
          this.lastWeight = 1;
        }
        else {
          /*
            Custom resampler I wrote that doesn't skip samples
            like standard linear interpolation in high downsampling.
            This is more accurate than linear interpolation on downsampling.
          */
          this.compileMultiTapFunction();
          this.tailExists = false;
          this.lastWeight = 0;
        }
        this.initializeBuffers();
      }
    }
    else {
      throw(new Error("Invalid settings specified for the resampler."));
    }
  }
  Resampler.prototype.compileLinearInterpolationFunction = function () {
    var toCompile = "var outputOffset = 0;\
      if (bufferLength > 0) {\
          var buffer = this.inputBuffer;\
          var weight = this.lastWeight;\
          var firstWeight = 0;\
          var secondWeight = 0;\
          var sourceOffset = 0;\
          var outputOffset = 0;\
          var outputBuffer = this.outputBuffer;\
          for (; weight < 1; weight += " + this.ratioWeight + ") {\
              secondWeight = weight % 1;\
              firstWeight = 1 - secondWeight;";
              for (var channel = 0; channel < this.channels; ++channel) {
                  toCompile += "outputBuffer[outputOffset++] = (this.lastOutput[" + channel + "] * firstWeight) + (buffer[" + channel + "] * secondWeight);";
              }
          toCompile += "}\
          weight -= 1;\
          for (bufferLength -= " + this.channels + ", sourceOffset = Math.floor(weight) * " + this.channels + "; sourceOffset < bufferLength;) {\
              secondWeight = weight % 1;\
              firstWeight = 1 - secondWeight;";
              for (var channel = 0; channel < this.channels; ++channel) {
                  toCompile += "outputBuffer[outputOffset++] = (buffer[sourceOffset" + ((channel > 0) ? (" + " + channel) : "") + "] * firstWeight) + (buffer[sourceOffset + " + (this.channels + channel) + "] * secondWeight);";
              }
              toCompile += "weight += " + this.ratioWeight + ";\
              sourceOffset = Math.floor(weight) * " + this.channels + ";\
          }";
          for (var channel = 0; channel < this.channels; ++channel) {
              toCompile += "this.lastOutput[" + channel + "] = buffer[sourceOffset++];";
          }
          toCompile += "this.lastWeight = weight % 1;\
      }\
      return outputOffset;";
    this.resampler = Function("bufferLength", toCompile);
  }
  Resampler.prototype.compileMultiTapFunction = function () {
    var toCompile = "var outputOffset = 0;\
      if (bufferLength > 0) {\
          var buffer = this.inputBuffer;\
          var weight = 0;";
          for (var channel = 0; channel < this.channels; ++channel) {
              toCompile += "var output" + channel + " = 0;"
          }
          toCompile += "var actualPosition = 0;\
          var amountToNext = 0;\
          var alreadyProcessedTail = !this.tailExists;\
          this.tailExists = false;\
          var outputBuffer = this.outputBuffer;\
          var currentPosition = 0;\
          do {\
              if (alreadyProcessedTail) {\
                  weight = " + this.ratioWeight + ";";
                  for (channel = 0; channel < this.channels; ++channel) {
                      toCompile += "output" + channel + " = 0;"
                  }
              toCompile += "}\
              else {\
                  weight = this.lastWeight;";
                  for (channel = 0; channel < this.channels; ++channel) {
                      toCompile += "output" + channel + " = this.lastOutput[" + channel + "];"
                  }
                  toCompile += "alreadyProcessedTail = true;\
              }\
              while (weight > 0 && actualPosition < bufferLength) {\
                  amountToNext = 1 + actualPosition - currentPosition;\
                  if (weight >= amountToNext) {";
                      for (channel = 0; channel < this.channels; ++channel) {
                          toCompile += "output" + channel + " += buffer[actualPosition++] * amountToNext;"
                      }
                      toCompile += "currentPosition = actualPosition;\
                      weight -= amountToNext;\
                  }\
                  else {";
                      for (channel = 0; channel < this.channels; ++channel) {
                          toCompile += "output" + channel + " += buffer[actualPosition" + ((channel > 0) ? (" + " + channel) : "") + "] * weight;"
                      }
                      toCompile += "currentPosition += weight;\
                      weight = 0;\
                      break;\
                  }\
              }\
              if (weight <= 0) {";
                  for (channel = 0; channel < this.channels; ++channel) {
                      toCompile += "outputBuffer[outputOffset++] = output" + channel + " / " + this.ratioWeight + ";"
                  }
              toCompile += "}\
              else {\
                  this.lastWeight = weight;";
                  for (channel = 0; channel < this.channels; ++channel) {
                      toCompile += "this.lastOutput[" + channel + "] = output" + channel + ";"
                  }
                  toCompile += "this.tailExists = true;\
                  break;\
              }\
          } while (actualPosition < bufferLength);\
      }\
      return outputOffset;";
    this.resampler = Function("bufferLength", toCompile);
  }
  Resampler.prototype.bypassResampler = function (upTo) {
      return upTo;
  }
  Resampler.prototype.initializeBuffers = function () {
    //Initialize the internal buffer:
      var outputBufferSize = (Math.ceil(this.inputBuffer.length * this.toSampleRate / this.fromSampleRate / this.channels * 1.000000476837158203125) * this.channels) + this.channels;
    try {
      this.outputBuffer = new Float32Array(outputBufferSize);
      this.lastOutput = new Float32Array(this.channels);
    }
    catch (error) {
      this.outputBuffer = [];
      this.lastOutput = [];
    }
  }
})();
