elation.require(['engine'], function() {
  elation.component.add('janusweb.configuration', function() {
    this.initPanels = function(panels) {
      if (!panels) panels = {};

      panels['general'] = {
        label: 'General',
        content: elation.janusweb.configuration.general({client: this.client, engine: this.engine, view: this.view})
      };

      elation.janusweb.configuration.extendclass.initPanels.call(this, panels);

      return panels;
    }
  }, elation.engine.configuration);

  elation.component.add('janusweb.configuration.general', function() {
    this.init = function() {
      elation.janusweb.configuration.general.extendclass.init.call(this);

      this.client = this.args.client;
      this.engine = this.client.engine;
      this.view = this.client.view;

      // Capture Settings
      var avatarsection = elation.ui.labeldivider({
        append: this,
        label: 'Avatar'
      });
      var username = elation.ui.input({
        append: this,
        label: 'Username',
        value: this.client.janusweb.getUsername(),
        events: {
          change: elation.bind(this, function(ev) {
            this.client.janusweb.setUsername(ev.target.value)
          })
        }
      });
      var avatar = elation.ui.textarea({
        append: this,
        label: 'Avatar',
        value: this.client.player.getAvatarData(),
        classname: 'janusweb_config_avatar',
        events: {
          change: elation.bind(this, function(ev) {
            this.client.player.setAvatar(ev.target.value)
          })
        }
      });
      
    }
  }, elation.ui.panel_vertical);
});
