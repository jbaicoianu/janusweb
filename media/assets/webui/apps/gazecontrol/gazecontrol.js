elation.require([], function() {

  elation.extend('janusweb.gazecontrol', class {
    constructor(object) {
      this.init()
      elation.events.add(null, 'janusweb_script_frame', this.update )
      elation.events.add(null, 'player_setroom', this.init )
      elation.events.add(null, 'webui_settings_store_init', this.extendSettingsUI )
    }

    extendSettingsUI(e){
      const settings = e.element
      if( !settings.store['webui.settings.vr.gaze_control'] ){
        settings.store['webui.settings.vr.gaze_control'] = {localStorage:true}
      }
      const vrtab = settings.querySelector("ui-tab[label='VR'] ui-formgroup")
      vrtab.innerHTML += `
        <ui-select label="Gaze control" config="webui.settings.vr.gaze_control">
          <ui-option value="fallback">As Fallback</ui-option>
          <ui-option value="always">Always</ui-option>
          <ui-option value="never">Never</ui-option>
        </ui-select>
        <ui-toggle label="Gaze auto-fuse"></ui-toggle>
        <ui-slider label="Gaze auto-fusetime ms" min="0" max="3000"></ui-slider>
      `
    }

    init(e){
      if( typeof room == undefined ){
        if( !e ) throw 'cannot obtain room'
        else room = e.data
        debugger
      }
      this.scene     = elation.engine.instances.default.systems.world.scene['world-3d'] 
      if (!this.gazecaster) {
        this.gazecaster = room.createObject('raycaster', {persist: false});
        player.head.add(this.gazecaster._target);
        //this.gazecaster = this.head.spawn('raycaster', null, {room: this.room, janus: this.janus});
        //elation.events.add(this.gazecaster._target, 'raycastenter', elation.bind(this, this.handleGazeEnter));
        //elation.events.add(this.gazecaster._target, 'raycastleave', elation.bind(this, this.handleGazeLeave));
        //elation.events.add(this.gazecaster._target, 'raycastmove', elation.bind(this, this.handleGazeMove));
      } else {
        this.gazecaster.setRoom(room);
      }

    }

    update(){
      if (this.gaze && this.gaze.object) {
        var now = performance.now();
        var gazetime = 1000;
        if (this.gaze.object.gazetime) {
          gazetime = this.gaze.object.gazetime;
        } else if (this.gaze.object.room && this.gaze.object.room.gazetime) {
          gazetime = this.gaze.object.room.gazetime;
        }
        var diff = now - this.gaze.start;
        var percent = diff / gazetime;
        if (percent < 1) {
          this.gaze.object.dispatchEvent({type: 'gazeprogress', data: percent});
        } else if (!this.gaze.fired) {
          this.gaze.object.dispatchEvent({type: 'gazeprogress', data: 1});
          this.gaze.object.dispatchEvent({type: 'gazeactivate', data: null});
          this.gaze.fired = true;
        }
      }
    }

    cancelGaze(){
      //this.gaze.object.dispatchEvent({type: 'gazecancel'});
      this.gaze = false;
    }
    handleGazeEnter(ev){
      var obj = ev.data.object;
      if (obj && obj.dispatchEvent && ev.data.intersection) {
        obj.dispatchEvent({type: 'gazeenter', data: ev.data.intersection});
        this.cursor_object = obj;

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
          this.vectors.cursor_pos.copy(ev.data.intersection.point);
        }
      }
    }
  })
});

if( !player.gazecaster ) new elation.janusweb.gazecontrol(player);
