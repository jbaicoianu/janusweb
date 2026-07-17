elation.require([], function() {

  elation.extend('janusweb.gazecontrol', class {
    constructor(object) {
      this.init()
      this.teleporting = false
      elation.events.add(null, 'janusweb_script_frame', (e) => this.update(e) )
      elation.events.add(null, 'player_setroom', (e) => this.init(e) )
      elation.events.add(null, 'webui_settings_store_init', this.extendSettingsUI )
      elation.events.add(null, 'room_load_complete', (e) => setTimeout( () => this.teleporting = false, 5000 ))
      elation.events.add(null, 'gazeenter', (ev) => { 
        const obj = this.cursor_object
        if( this.cursor && this.isClickable(obj) ){
          this.cursor.setImage('hover')
          this.cursor.fuseid = setTimeout( () => this.cursor.setImage('fuse'), 1000)
          elation.events.fire({type: 'action-item-selected', data: this}); // XDG Sound
        }
      })
      elation.events.add(null, 'gazeleave', (ev) => { 
        if( this.cursor ) this.cursor.setImage('idle')
      })
      elation.events.add(null, 'gazeactivate', (ev) => {
        if( this.cooldown > 0 || this.teleporting) return

        this.cooldown = 1000 
        if( this.cursor ){ 
          this.cursor.setImage('idle')
          const obj = ev.data 
          if( this.isClickable(obj) && elation.config.get('webui.settings.vr.gaze_click') !== false ){
            if (room.onClick) { room.onClick(ev); }
            elation.events.fire({type: 'click', element: obj._target, ev})
            // this minimizes activating/gazing at another portal after teleporting
            if( String(obj.componentname).match(/janusportal/) ) this.teleporting = true 
            elation.events.fire({type: 'action-link-released', data: this}); // XDG Sound
          }
          setTimeout( () => this.cooldown = 0, this.cooldown )
        }
      })
    }

    extendSettingsUI(e){
      const settings = e.element
      if( !settings.store['webui.settings.vr.gaze_control'] ){
        settings.store['webui.settings.vr.gaze_control'] = {localStorage:true}
        settings.store['webui.settings.vr.gaze_click'] = {localStorage:true}
      }
      const vrtab = settings.querySelector("ui-tab[label='VR'] ui-formgroup")
      vrtab.innerHTML += `
        <ui-select label="Gaze control" config="webui.settings.vr.gaze_control">
          <ui-option value="fallback">Fallback when no controllers</ui-option>
          <ui-option value="always">Always</ui-option>
          <ui-option value="never">Never</ui-option>
        </ui-select>
        <ui-toggle label="Gaze auto-click" checked config="webui.settings.vr.gaze_click"></ui-toggle>
      `
    }

    init(e){
      let newroom = e?.data || room
      if (!this.gazecaster) {
        this.scene     = elation.engine.instances.default.systems.world.scene['world-3d'] 
        player.gazecontrol = this
        player.gazecaster = this.gazecaster = newroom.createObject('raycaster', {persist: false});
        player.gazecaster.enabled = elation.config.get('webui.settings.vr.gaze_control') == 'always'
        player.camera.add(player.gazecaster._target);
        //player.gazecaster = player.head.spawn('raycaster', null, {room: newroom, janus});
        elation.events.add(this.gazecaster._target, 'raycastenter', elation.bind(this, this.handleGazeEnter));
        elation.events.add(this.gazecaster._target, 'raycastleave', elation.bind(this, this.handleGazeLeave));
        elation.events.add(this.gazecaster._target, 'raycastmove', elation.bind(this, this.handleGazeMove));
        this.createReticle()
      } else {
        player.gazecaster.setRoom(newroom);
      }
      for( let i in this.cursors ){
        // preload with disabled proxy so new rooms will not 
        const cursor = this.cursors[i]
        room.loadNewAsset("image", {id: cursor.src, src: cursor.src, proxy:false})
      }
    }

    update(e){
      const delta = e.data
      let percent
      const vrdisplay = player.engine.systems.render.views.main.vrdisplay ||
                        player.engine.systems.render.views.xr 

      if( janus.engine.client.xrplayer ){
        const mode = elation.config.get('webui.settings.vr.gaze_control')
        player.gazecaster.enabled =  mode == 'always' || 
                                    ((!mode || mode == 'fallback') && !janus.engine.client.xrplayer.trackedobjects['hand_left']) ||
                                    ((!mode || mode == 'fallback') && !janus.engine.client.xrplayer.trackedobjects['hand_right'])
      }
      if (this.gaze && this.gaze.object) {
        var now = performance.now();
        var gazetime = room.gazetime 
        if (this.gaze.object.gazetime) {
          gazetime = this.gaze.object.gazetime;
        } else if (this.gaze.object.room && this.gaze.object.room.gazetime) {
          gazetime = this.gaze.object.room.gazetime;
        }
        var diff = now - this.gaze.start;
        percent = diff / gazetime;
        if (percent < 1) {
          this.gaze.object.dispatchEvent({type: 'gazeprogress', data: percent});
        } else if (!this.gaze.fired) {
          this.gaze.object.dispatchEvent({type: 'gazeprogress', data: 1});
          this.gaze.object.dispatchEvent({type: 'gazeactivate', data: this.gaze.object});
          this.gaze.fired = true;
        }
      }
      if( this.cursor ){
        this.cursor.position.x = vrdisplay ? 0.015 : 0 // why?
        this.cursor.visible = player.gazecaster.enabled
        if( this.cursor.scale.x < this.cursor.current.scale ){
          this.cursor.scale.x = this.cursor.scale.y = this.cursor.scale.z = this.cursor.scale.x + (0.8 * delta)
        }

        if( this.cursor.current.name == 'fuse' && elation.config.get('webui.settings.vr.gaze_click') !== false ){
          this.cursor.opacity = 1 - percent
          this.cursor.rotation.z += (150 * delta)
        }
      }
    }

    cancelGaze(){
      //this.gaze.object.dispatchEvent({type: 'gazecancel'});
      this.gaze = false;
    }
    handleGazeEnter(ev){
      var obj = ev.data.object;
      // dont enter gaze when user is clearly looking where to go
      if( Math.abs(player.acceleration.x) > 0.1 ||
          Math.abs(player.acceleration.y) > 0.1 ||
          Math.abs(player.acceleration.y) > 0.1 
      ){ return }

      if (obj && obj.dispatchEvent && ev.data.intersection) {
        this.cursor_object = obj;
        obj.dispatchEvent({type: 'gazeenter', data: ev.data.intersection});

        if (this.gaze) {
          this.cancelGaze();
        }
        this.gaze = {
          start: performance.now(),
          object: obj,
          fired: false
        };
      }
    }
    handleGazeLeave(ev){
      var obj = ev.data.object;
      if (obj && obj.dispatchEvent) {
        this.cursor_object = '';
        obj.dispatchEvent({type: 'gazeleave', data: ev.data.intersection});
      }
    }
    handleGazeMove(ev){
      var obj = ev.data.object;
      if (obj && obj.dispatchEvent) {
        this.cursor_object = obj.js_id || '';

        if (ev.data.intersection.point) {
          player.vectors.cursor_pos.copy(ev.data.intersection.point);
        }
      }
    }

    isClickable(obj){
      return this.cursor && 
             obj?.pickable && 
             obj?.collidable && 
             ( 
               String(obj.componentname).match(/janus(portal|video|paragraph)/) ||
               obj.video_id ||
               obj.websurface_id ||
               obj.eventlistenerproxies.click  
             )

    }

    createReticle(){
      const scale = 0.28
      this.cursors = {
        idle:  { name: 'idle', src: document.location.origin+'/media/assets/webui/apps/gazecontrol/images/reticle-idle.png', scale},
        hover: { name: 'hover', src: document.location.origin+'/media/assets/webui/apps/gazecontrol/images/reticle-hover.png', scale},
        fuse:  { name: 'fuse', src: document.location.origin+'/media/assets/webui/apps/gazecontrol/images/reticle-hover.png',  scale, scaleKeep:true},
      }
      this.cursor = player.createObject('object', {
        pos: V(0,0,-3),
        scale: V(scale,scale,scale),
        col: '#FFF',
        collidable: false,
        pickable: false,
        transparent: true,
        lighting: false,
        //depthTest: false,
        //depthWrite: false,
        proxy:false,
        id: 'plane',
        jsid: 'reticle',
        renderorder: 10,
      })
      this.cursor.setImage = (cursorname) => {
        this.cursor.current  = this.cursors[cursorname]
        this.cursor.image_id = this.cursors[cursorname].src
        if( !this.cursor.current.scaleKeep ){
          this.cursor.scale.x  = this.cursor.scale.y = this.cursor.scale.z = scale * 0.5
        }
        this.cursor.opacity  = 1
        this.cursor.rotation.z = 0
        clearTimeout(this.cursor.fuseid)
      }
      this.cursor.setImage('idle')
      player.camera.add(this.cursor)
    }

  })
});

if( !player.gazecaster ) new elation.janusweb.gazecontrol(player);
