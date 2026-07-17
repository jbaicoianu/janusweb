// this maps XDG events to XDG mp3-files
// elation.events.fire({
//   element: this, type: 'action-button-pressed', data: this
// }) // will trigger media/assets/webui/apps/xdgsoundtheme/audio/action/button-pressed.mp3

elation.require([], function() {

  elation.extend('janusweb.soundtheme', class {
    constructor(object) {
      // default soundtheme path
      this.path = document.location.origin + document.location.pathname
      this.path += 'media/assets/webui/apps/xdgsoundtheme/audio/'
      this.assets = {}

      this.init()
      player.soundtheme = this
    }

    init(){
      this.initXDGEvents()
      this.initJanusEvents()
      this.initLoader()
    }

    // note: sounds kill other sounds (no audio-pooling on purpose)
    //       for polyphony (see usage in loadingSound())
    play(name, opts){ 
      opts = opts || {}
      let xdgpart  = name.split("-")
      let category = xdgpart.shift()
      let audiofile = `${this.path}${category}/${xdgpart.join('-')}.mp3`
      if( !this.assets[name] ){
        room.loadNewAsset("sound", {id: audiofile, src: audiofile, proxy:false})
        this.assets[name] = true
        console.log(audiofile)
      }
      if( this.sound ){
        room.removeChild(this.sound)
        this.sound.die()
      }
      this.sound = room.createObject('Sound', {id: audiofile, gain:0.5}) // soft ui sounds
      if( this.sound ){
        this.sound.pos = player.pos;
        this.sound.play();
      }
    }

    bindXDG(name){
      return () => this.play(name)
    }

    initXDGEvents(){
      let events = [
        'game-game-over-loser',
        'game-game-card-shuffle',
        'game-game-computer-move',
        'game-game-human-move',
        'game-game-over-winner',
        'notification-window-attention-inactive',
        'notification-network-connectivity-established',
        'notification-search-results',
        'notification-device-added',
        'notification-alarm-clock-elapsed',
        'notification-service-login',
        'notification-service-logout',
        'notification-lid-open',
        'notification-phone-outgoing-busy',
        'notification-phone-hangup',
        'notification-complete-download',
        'notification-power-unplug',
        'notification-message-new-instant',
        'notification-dialog-warning',
        'notification-complete-media-format',
        'notification-device-added-audio',
        'notification-phone-failure',
        'notification-window-new',
        'notification-desktop-login',
        'notification-software-update-available',
        'notification-window-attention-active',
        'notification-complete-scan',
        'notification-device-removed',
        'notification-dialog-question',
        'notification-complete-media-burn',
        'notification-power-plug',
        'notification-device-removed-media',
        'notification-system-shutdown',
        'notification-suspend-resume',
        'notification-desktop-logout',
        'notification-complete-media-burn-test',
        'notification-system-bootup',
        'notification-phone-incoming-call',
        'notification-suspend-start',
        'notification-device-removed-audio',
        'notification-error',
        'notification-search-results-empty',
        'notification-lid-close',
        'notification-complete-media-rip',
        'notification-message-new-email',
        'notification-system-ready',
        'notification-battery-full',
        'notification-device-added-media',
        'notification-desktop-screen-lock',
        'notification-dialog-information',
        'notification-battery-caution',
        'notification-phone-outgoing-calling',
        'notification-complete-copy',
        'alert-software-update-urgent',
        'alert-network-connectivity-error',
        'alert-network-connectivity-lost',
        'alert-dialog-error',
        'alert-suspend-error',
        'alert-battery-low',
        'alert-power-unplug-battery-low',
        'action-button-toggle-on',
        'action-window-unminimized',
        'action-count-down',
        'action-tooltip-popup',
        'action-drag-accept',
        'action-window-move-start',
        'action-tooltip-popdown',
        'action-item-deleted',
        'action-scroll-left',
        'action-completion-rotation',
        'action-scroll-up-end',
        'action-window-move-end',
        'action-expander-toggle-on',
        'action-item-selected',
        'action-menu-popdown',
        'action-audio-channel-right',
        'action-window-resize-start',
        'action-audio-test-signal',
        'action-audio-channel-side-right',
        'action-dialog-cancel',
        'action-audio-channel-left',
        'action-notebook-tab-changed',
        'action-window-resize-end',
        'action-button-pressed',
        'action-button-toggle-off',
        'action-audio-volume-change',
        'action-desktop-switch-right',
        'action-audio-channel-rear-left',
        'action-audio-channel-side-left',
        'action-theme-demo',
        'action-scroll-up',
        'action-link-released',
        'action-button-released',
        'action-audio-channel-front-left',
        'action-message-sent-email',
        'action-window-slide-in',
        'action-menu-replace',
        'action-trash-empty',
        'action-menu-click',
        'action-audio-channel-lfe',
        'action-dialog-ok',
        'action-link-pressed',
        'action-window-maximized',
        'action-bell-window-system',
        'action-expander-toggle-off',
        'action-scroll-left-end',
        'action-audio-channel-rear-center',
        'action-completion-sucess',
        'action-window-minimized',
        'action-message-sent-instant',
        'action-window-slide-out',
        'action-audio-channel-front-center',
        'action-completion-partial',
        'action-scroll-right',
        'action-camera-focus',
        'action-drag-fail',
        'action-scroll-down',
        'action-bell-terminal',
        'action-audio-channel-front-right',
        'action-scroll-down-end',
        'action-window-close',
        'action-file-trash',
        'action-window-inactive-click',
        'action-screen-capture',
        'action-completion-fail',
        'action-menu-popup',
        'action-drag-start',
        'action-window-switch',
        'action-audio-channel-rear-right',
        'action-camera-shutter',
        'action-window-unmaximized',
        'action-desktop-switch-left',
        'action-scroll-right-end',
        'action-phone-outgoing-calling'
      ]
      events.map( (event) => elation.events.add(null, event, this.bindXDG(event) ) )
    }

    initJanusEvents(){
      const mappings = [
        //{ janus: "room_change", xdg:"action-window-slide-in" },
        { janus: "click",       xdg:"action-link-released", clickable:true },
        { janus: "mouseover",   xdg:"action-item-selected", clickable:true }
      ]
      const mapEvent = (mapping) => {
        elation.events.add(null, mapping.janus, (ev) => {
          let obj = ev.element
          if( mapping.clickable && obj && !this.isClickable(obj) ) return 
          elation.events.fire({element: this, type: mapping.xdg, data: this});
        })
      }
      mappings.map( mapEvent ) // map janus events to xdg events
    }

    isClickable(obj){
      return obj?.pickable && 
             obj?.collidable && 
             ( 
               String(obj.componentname).match(/janus(portal|video|paragraph)/) ||
               obj.video_id ||
               obj.websurface_id ||
               obj.eventlistenerproxies.click  
             )

    }

    loadingSound(play){
      if( play && this.loading ) return // debounce 
      if( play ){
        const play = () =>  this.play('notification-phone-outgoing-calling') 
        play()
        this.loading     = setInterval( () => play(), 1500 )
        this.loadingFail = setTimeout( () => { // give up after 30 secs
          clearInterval(this.loading) 
          this.play('notification-error')
        },30000)
      }else{
        clearInterval(this.loading) 
        clearInterval(this.loadingFail) 
        this.play('notification-system-ready')
      }
    }

    initLoader(){
      // create a loading sound while room is loading (quest / android gives black screen)
      elation.events.add(null, 'room_load_start', (e) => player.soundtheme.loadingSound(true) )
      elation.events.add(null, 'room_load_complete',     (e) => player.soundtheme.loadingSound(false) )
    }

  })
});

if( !player.soundtheme ) new elation.janusweb.soundtheme(player);
