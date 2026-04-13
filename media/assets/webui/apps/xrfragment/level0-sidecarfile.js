/* XR URI Fragments spec (https://xrfragment.org)
 *
 * level0 sidecar files as per the XR URI Fragments spec
 * https://xrfragment.org/#sidecar%20files
 * 
 * NOTE: you can also load sidecarfiles in a roomscript manually:
 *
 *       elation.events.add(null, 'room_load_complete', function(e){
 *         if( janus?.sidecarfile ) janus.sidecarfile.load()
 *       })
 */

elation.require([], function() {

  elation.extend('janusweb.sidecarfile', class {
    constructor(object) {
      this.scene     = elation.engine.instances.default.systems.world.scene['world-3d'] 
      this._object   = object
      this.extension = /\.(gltf|glb|dae)$/
      this.extensionXRF = /\.xrf\./ 
      if( room.url.match(this.extension) && this.isXRF(this.hideSystemFolder) ){
        this.load()
      }
    }

    load(){
      this.cleanup()
      this.loadWebVTT() // https://xrfragment.org/#sidecar%20files
      this.loadSound()  // https://xrfragment.org/#sidecar%20files
      this.initStartButton()
      this.initSubtitle()
    }

    hideSystemFolder(o){
      // https://xrfragment.org/#system%20folders
      if(o.name[0] == '_'){ 
        o.visible = false
        o.pickable = false
      }
    }

    isXRF(cb){
      // for XRF heuristics see https://xrfragment.org/#%F0%9F%93%9C%20level0%3A%20File
      let heuristic = room.url.match(this.extensionXRF) 
      this.scene.traverse( (o) => {
        if( o.userData?.href )  heuristic = true // has XRF hyperlink
        if( o.name[0] == '_' )  heuristic = true // has XRF system folder 
      })
      return heuristic
    }

    loadSound(){ // https://xrfragment.org/#sidecar%20files
      room.removeObject('xrf_audio')
      const audio     = room.url.replace(this.extension,'.ogg') 
      room.loadNewAsset("sound", {id:"xrf_audio", src:audio,proxy:false})
      this.sound = room.createObject('sound',{ id: "xrf_audio", js_id: 'xrf_audio', loop:true })
    }

    loadWebVTT(){ // https://xrfragment.org/#sidecar%20files
      const webvtt = room.url.replace(this.extension,'.vtt') 
      fetch( webvtt )
      .then( (res)  => res.text() ) 
      .then( (webvtt) => {
        this.webvtt = this.parseWEBVTT(webvtt) 
      })
      .catch( () => false ) // no biggy (optional)
    }

    initStartButton(){
      this.btn = room.createObject('object',{
        id: 'cube',
        js_id: 'btnstart',
        pos: player.localToWorld( V(0,1.8,-1) ),
        scale: '0.5 0.125 0.01',
        col: '0.5 0.5 0.5',
        lighting:false,
        sync: true,
        billboard: 'y',
        collision_id: 'cube'
      })
      const label = this.btn.createObject('text',{
        text: 'Start experience',
        lighting:false,
        col: '0 0 0',
        pos: '0 -0.15 0.5',
        scale: '1.2 5 1.2',
      })
      this.btn.addEventListener('click', () => this.start() )
      this.positionStartButton()
    }

    positionStartButton(){
      setTimeout( () => {
        this.btn.pos = player.localToWorld( V(0,1.8,-1) )
      }, 500)
    }

    initSubtitle(){
      this.subtitle = player.createObject('paragraph',{
        js_id: 'subtitle',
        pos: '0 1.7 -1.5',
        lighting: false,
        pickable: false,
        css: `.paragraphcontainer{ 
          background: transparent;
          text-align:center;
          height:100%; 
          width:100%; 
          display: flex;
          align-items: center;
          font-size:55px; 
          line-height:55px;
          text-shadow: 0px 0px 2px #FFFF;
          color:black; 
        }
        .subtitle{
          width:100%;
        }
        .loading{
          background:#FFF;
          display:inline-block;
          font-size:22px;
          font-family: monospace;
          line-height:30px;
          padding:20px;
          border-radius:15px;
        }
        `,
        text_col: '1 1 1',
        back_col: '1 1 1'
      })
      this.subtitle.objects['3d'].depthWrite = false 
      this.subtitle.objects['3d'].depthTest = false 
      this.subtitle.objects['3d'].renderOrder = 100 
      this.subtitle.setHTML = (html) => {
        this.subtitle.visible = true
        this.subtitle.text = `<div class='subtitle'>${html}</div>`
      }
    }

    update(){
      if( this.update.id || !this.playing ) return // throttle
      const advance = () => {
        if( !this?.sound?.timeoffset && this?.sound?.audio?.context){ 
          this.sound.timeoffset = this.sound.audio.context.currentTime
        }
        if( this?.sound?.timeoffset != undefined &&
            this.webvtt?.items[ this.webvtt?.i ] && 
            this?.sound?.playStarted             && 
            this?.sound?.audio?.context?.currentTime ){

          const time = this.sound.audio.context.currentTime - this.sound.timeoffset;
          let item = this.webvtt.items[ this.webvtt.i ]
          if( !item.seen && time > item.start.ts ){
            this.subtitle.setHTML(`
              ${ item.who ? `<b>${item.who}:</b><br/>` : '' }
              ${item.text.replace(/\n/g,'<br/>')}
            `)
            if( janus.hyperlink && item.href && !item.seen ){
              janus.hyperlink.execute(item.href) 
            }
            item.seen = true
          }
          if( item.seen && time > item.stop.ts ){
            this.subtitle.visible = false 
            this.webvtt.i++
          }
        }
        this.update.id = false 
      }
      this.update.id = setTimeout( () => advance(), 100 ) // throttle 
    }

    // naive webvtt parser
    parseWEBVTT(text) {
      let i = 0;
      const WEBVTT_HEADER = /^WEBVTT/i;
      const TIME_LINE     = /^([0-9:.]+)\s+-->\s+([0-9:.]+)(?:\s+(.+))?$/;
      const WHO           = /^<v ([^>]+)>/
      const HREF          = / href:([^ ]+)/
      const result        = { type: "WEBVTT", items: [], i: 0 };
      const lines         = text.split(/\r?\n/)
                                .map( (line) => line.trim() )
      const vttToSeconds  = (vttString) => {
        const parts = vttString.split(':');
        let hours = 0, minutes = 0, secondsWithMs;
        if (parts.length === 3) { [hours, minutes, secondsWithMs] = parts; }
        else { [minutes, secondsWithMs] = parts; } // Format is MM:SS.mmm
        const [seconds, milliseconds] = secondsWithMs.split('.');
        return (
          (parseInt(hours) * 3600) +
          (parseInt(minutes) * 60) +
          (parseInt(seconds) * 1) +
          parseInt(milliseconds || 0)
        );
      }

      // Skip the WEBVTT header line
      if (WEBVTT_HEADER.test(lines[i].trim())) i++
      while (i < lines.length) {
        if ( lines[i] === "") { i++; continue; } // Skip empty lines
        // Match cue timing line
        const timeMatch = lines[i].match(TIME_LINE);
        if (timeMatch) {
          const item = {
            start: {str:timeMatch[1], ts: vttToSeconds(timeMatch[1]) },
            stop:  {str:timeMatch[2], ts: vttToSeconds(timeMatch[2]) },
            href:  lines[i].match(HREF) ? lines[i].match(HREF)[1] : false,
            who: false,
            text: ""
          };
          i++;
          const speakerMatch = lines[i]?.match(WHO);
          if (speakerMatch) { 
            item.who = speakerMatch[1]; 
            lines[i] = lines[i].replace(WHO,''); 
          }
          // Collect all text lines until next empty line
          while (i < lines.length && lines[i].trim() !== "") {
            item.text += (item.text ? "\n" : "") + lines[i] ;
            i++;
          }

          result.items.push(item);
        } else { i++; }
      }
      return result;
    }

    start(){
      // reset subtitles
      if( this?.webvtt?.items ){
        this.webvtt.items.map( (item) => item.seen = undefined )
        this.webvtt.i = 0;
      }
      // start sound
      this.sound.pos = '0 0 0'
      if( this.sound.isPlaying ) this.sound.stop()
      this.sound.timeoffset = undefined
      this.sound.play()
      // ensure subtitle
      this.subtitle.visible = false 
      player.add(this.subtitle)
      // hide button 
      this.btn.visible = false
      this.btn.pickable = false
      // mark playing
      this.playing = true
    }


    stop(){
      this.playing = false
      this.update.id = false
      this.subtitle.visible = false 
      this.subtitle.text = ''
      this.btn.visible = true
      this.btn.pickable = true
    }

    cleanup(){
      const deleteJsId = (js_id) => {
        for( let i in player.children ) 
          if( player.children[i].js_id == js_id )
            player.remove( player.children[i] )
      }
      deleteJsId('subtitle')
    }

  })
});

xrf_install_sidecarfiles = function(){
  if( !room.overlay && !room.objects?.scene?.modelasset?.loaded ) {
    return setTimeout( xrf_install_sidecarfiles, 300 ) 
  }
  if( !janus.sidecarfile   ) janus.sidecarfile = new elation.janusweb.sidecarfile(room);
  else{
    janus.sidecarfile.positionStartButton() // wait for user being spawned
    janus.sidecarfile.stop()
  }
}

xrf_install_sidecarfiles()

elation.events.add(null, 'room_load_complete', xrf_install_sidecarfiles )
elation.events.add(null, 'room_enable',        xrf_install_sidecarfiles )
elation.events.add(null, 'janusweb_script_frame', function(){
  if( janus?.sidecarfile ) janus.sidecarfile.update()
})
elation.events.add(null, 'room_load_start', function(e){
  if( !e.data ) return
  if( janus?.sidecarfile?.subtitle ) janus.sidecarfile.subtitle.setHTML(`<div class='loading'>🔗 ${e.data.name}<br/><br/>loading..</div>`)
})

elation.events.add(null, 'room_disable', function(){
  if( janus?.sidecarfile?.subtitle ) janus.sidecarfile.stop()
})

// some convenience WebVTT cue settings => room function mappings 
// href:#fadeAudioOut&spawnhere => room.fadeAudioOut()
// href:#myfunc=3               => room.myfunc(3)
elation.events.add(null, 'href', function(e){
  if( janus?.hyperlink ){
    const {url,hash} = janus.hyperlink.getUrlObject(e.data.href)
    hash.forEach( (v,k) => { if( room[k] ) room[k](v) })
  }
})
