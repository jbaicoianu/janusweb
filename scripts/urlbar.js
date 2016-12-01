elation.require(['ui.input'], function() {
  elation.requireCSS('janusweb.urlbar');

  elation.component.add('janusweb.urlbar', function() {
    this.create = function() {
      this.janusweb = this.args.janusweb;
      this.client = this.args.client;

      this.indicator = elation.ui.indicator({ append: this, state: 'ready' });
      this.addclass('janusweb_urlbar');

      if (this.container instanceof HTMLInputElement) {
        this.inputelement = this.container;
      } else {
        var inputs = elation.find('input', this.container);
        if (inputs.length > 0) {
          this.inputelement = inputs[0];
        } else {
          this.inputelement = elation.html.create({tag: 'input', append: this.container});
          if (this.args.type) { 
            this.inputelement.type = this.args.type;
          }
        }
      }

      this.progress = elation.ui.progressbar({ append: this, value: 0, classname: 'janusweb_urlbar_progress' });
      this.progress.hide();

      if (this.args.id) {
        this.inputelement.id = this.args.id;
      }

      elation.events.add(this.janusweb, 'room_change', elation.bind(this, this.updateCurrentURL));
    }
    this.updateCurrentURL = function() {
      this.value = this.janusweb.url;
      var room = this.janusweb.currentroom;
      elation.events.add(room, 'room_load_queued', elation.bind(this, this.updateStatus, 'queued'));
      elation.events.add(room, 'room_load_start', elation.bind(this, this.updateStatus, 'downloading'));
      elation.events.add(room, 'room_load_processing', elation.bind(this, this.updateStatus, 'processing'));
      elation.events.add(room, 'room_load_processed', elation.bind(this, this.updateRoomAssets));
      elation.events.add(room, 'room_load_complete', elation.bind(this, this.updateStatus, 'complete'));

      elation.events.add(room, 'room_load_progress', elation.bind(this, this.updateProgress));

      elation.events.add(room, 'room_add_asset', elation.bind(this, this.roomAddAsset));
      this.loading = {};
      this.progress.set(0);
      this.progress.show();
    }
    this.updateStatus = function(status, ev) {
    }
    this.updateRoomAssets = function(ev) {
      this.updateStatus('processed');
      var room = this.janusweb.currentroom;
      var assets = room.getActiveAssets();
      for (var type in assets) {
        for (var id in assets[type]) {
          var asset = assets[type][id];
          elation.events.add(asset, 'asset_load_progress', elation.bind(this, this.updateProgress));
        }
      }
    }
    this.roomAddAsset = function(ev) {
      var room = this.janusweb.currentroom;
      var asset = ev.data;

      if (!this.loading[asset.src]) {
        elation.events.add(asset, 'asset_load_progress', elation.bind(this, this.updateProgress));
      }
    }
    this.updateProgress = function(ev) {
      //console.log('room had some progress', this.loading);
      var progress = ev.data;

      var url = progress.src;
      if (!this.loading[url]) {
        this.loading[url] = progress;
      }
      this.loading[url].loaded = progress.loaded;

      var loaded = 0, total = 0, count = 0;
      for (var k in this.loading) {
        count++;
        loaded += this.loading[k].loaded;
        total += this.loading[k].total;
      }
      var percent = loaded / total;
      //console.log('room had some progress', count + ' files, ' + loaded + ' / ' + total + ' bytes, ' + percent.toFixed(2) + '%', url);
      this.progress.set(percent);
    }
  }, elation.ui.input);
});
