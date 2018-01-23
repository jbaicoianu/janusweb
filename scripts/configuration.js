elation.require(['engine.engine'], function() {
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
        classname: 'janusweb_config_username',
        value: this.client.janusweb.getUsername(),
        events: {
          change: elation.bind(this, function(ev) {
            this.client.janusweb.setUsername(ev.target.value)
          })
        }
      });
      this.avatarinput = elation.ui.textarea({
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
      elation.events.add(this.avatarinput, 'dragover', elation.bind(this, this.handleAvatarDragOver));
      elation.events.add(this.avatarinput, 'dragenter', elation.bind(this, this.handleAvatarDragEnter));
      elation.events.add(this.avatarinput, 'dragleave', elation.bind(this, this.handleAvatarDragLeave));
      elation.events.add(this.avatarinput, 'drop', elation.bind(this, this.handleAvatarDrop));
    }
    this.showAvatarPalette = function() {
      this.palette = elation.ui.window({append: document.body, right: true,top: true, title: 'Avatar Selector'});
      this.palette.setcontent('<iframe src="https://kool.website/avatars/chibii/"></iframe>');
    }
    this.handleAvatarDragOver = function(ev) {
      ev.dataTransfer.dropEffect = "link"
      ev.preventDefault();
    }
    this.handleAvatarDragEnter = function(ev) {
      this.avatarinput.addclass('state_droppable');
    }
    this.handleAvatarDragLeave = function(ev) {
      this.avatarinput.removeclass('state_droppable');
    }
    this.handleAvatarDrop = function(ev) {
      this.avatarinput.removeclass('state_droppable');
      ev.preventDefault();
      var files = ev.dataTransfer.files,
          items = ev.dataTransfer.items;
      if (files.length > 0) {
        console.log('dropped files!', files);
        for (var i = 0; i < files.length; i++) {
          console.log(files[i]);
          if (files[i].type == 'text/plain') {
            var reader = new FileReader();
            reader.onload = elation.bind(this, function() { this.loadAvatarFromFile(reader.result); });
            reader.readAsText(files[i]);
          }
        }
      } else if (items.length > 0) {
        var types = {};
        var numitems = items.length;
        for (var i = 0; i < numitems; i++) {
          var type = items[i].type;
          if (type == 'text/uri-list') {
            items[i].getAsString(elation.bind(this, this.loadObjectFromURIList));
          }
        }
      }
      ev.preventDefault();
    }
    this.loadObjectFromURIList = function(data) {
      console.log('get it', data);
      var url = data;
      if (elation.engine.assets.corsproxy && url.indexOf(elation.engine.assets.corsproxy) == -1) {
        url = elation.engine.assets.corsproxy + url;
      }
      elation.net.get(url, null, {
        callback: elation.bind(this, this.loadAvatarFromFile)
      });
    }
    this.loadAvatarFromFile = function(data) {
      console.log('yey', data);
      this.avatarinput.value = data;
      this.client.player.setAvatar(data)
    }
  }, elation.ui.panel_vertical);
});
