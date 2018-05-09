elation.elements.define('janus.ui.navigation', class extends elation.elements.ui.panel {
  init() {
    super.init();
  }
  create() {
    this.innerHTML = elation.template.get('janus.ui.navigation');
    this.client = this.getClient();
    this.janusweb = this.client.janusweb;

    this.urlbar = this.getElementsByTagName('janus-ui-urlbar')[0];
    this.statusindicator = this.getElementsByTagName('janus-ui-statusindicator')[0];
    this.notifications = this.getElementsByTagName('janus-ui-notifications')[0];

    elation.events.add(this.janusweb, 'room_change', (ev) => this.updateCurrentURL());
  }
  getClient() {
    var node = this;
    while (node) {
      if (node.dataset['elationComponent'] == 'janusweb.client') {
        return elation.component.fetch(node);
      }
      node = node.parentNode
    }
  }
  updateCurrentURL() {
    var room = this.janusweb.currentroom;
  }
});
elation.elements.define('janus.ui.statusindicator', class extends elation.elements.ui.indicator {
  init() {
    super.init();
  }
  create() {
    this.inner = elation.elements.create('div', {
      class: 'inner',
      append: this
    });
    this.client = this.getClient();
    this.janusweb = this.client.janusweb;
    this.updateCurrentURL();

    this.tooltip = elation.elements.create('ui-tooltip', {
      //append: this,
    });
    setTimeout(() => { this.tooltip.hide(); }, 1000);

    this.canvas = document.createElement('canvas');
    this.inner.appendChild(this.canvas);

    elation.events.add(this.janusweb, 'room_load_start', (ev) => this.updateCurrentURL());

    this.percent = 0;

    this.refresh();


    elation.events.add(this, 'mouseover', (ev) => this.handleMouseOver(ev));
    elation.events.add([this, this.tooltip], 'mouseout', (ev) => this.handleMouseOut(ev));
  }
  render() {
    var canvas = this.canvas;
    var ctx = canvas.getContext('2d');
    canvas.width = this.inner.offsetWidth;
    canvas.height = this.inner.offsetHeight;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, -Math.PI/2, (2 * Math.PI * this.percent - Math.PI/2));
    ctx.closePath();
    ctx.fillStyle = (this.currentstatus == 'complete' ? 'green' : 'darkgreen');
    ctx.fill();
  }
  getClient() {
    var node = this;
    while (node) {
      if (node.dataset['elationComponent'] == 'janusweb.client') {
        return elation.component.fetch(node);
      }
      node = node.parentNode
    }
  }
  updateCurrentURL(room) {
    if (!room) {
      room = this.janusweb.currentroom.getProxyObject();
    }
    if (this.room !== room) {
//console.log('room changed!', this.room, room);

      // Set up some event listeners for the new room, so we can respond as it loads
      room.addEventListener('room_load_queued', (ev) => this.updateStatus('queued', ev));
      room.addEventListener('room_load_start', (ev) => this.updateStatus('downloading', ev));
      room.addEventListener('room_load_processing', (ev) => this.updateStatus('processing', ev));
      room.addEventListener('room_load_complete', (ev) => this.updateStatus('complete', ev));
      room.addEventListener('room_load_error', (ev) => this.updateStatus('error', ev));

      // Update our list of assets as they're added
      room.addEventListener('room_load_processed', (ev) => this.updateRoomAssets(ev));
      room.addEventListener('room_load_progress', (ev) => this.updateProgress(ev));
      room.addEventListener('room_add_asset', (ev) => this.roomAddAsset(ev));

      this.room = room;

      if (room.loaded) {
        this.updateRoomAssets();
      }
    }
    this.loading = {};
    this.percent = 0;
    //this.progress.set(0);
    //this.progress.show();
  }
  updateStatus(status, ev) {
    if (this.room.parseerror) {
      // Force error status to remain if an error is thrown
      status = 'error';
    }

    // Set our current status as a class name on this element.  Clear our previous status, if set
    if (this.currentstatus && this.currentstatus != status) {
      this.removeclass(this.currentstatus);
    }
    this.addclass(status);
    this.currentstatus = status;

    if (status == 'complete') {
      this.percent = 1;
      this.refresh();
    }
  }
  updateRoomAssets(ev) {
    this.updateStatus('processed');
    var room = this.janusweb.currentroom;
    var assets = room.getActiveAssets();
    for (var type in assets) {
      for (var id in assets[type]) {
        var asset = assets[type][id];
        elation.events.add(asset, 'asset_load_progress', elation.bind(this, this.updateProgress));
        elation.events.add(asset, 'asset_load_complete', elation.bind(this, this.updateProgress));
      }
    }
  }
  roomAddAsset(ev) {
    var room = this.janusweb.currentroom;
    var asset = ev.data;

    var url = asset.getProxiedURL();
    if (!this.loading[url]) {
//console.log('ADDED ASSET', asset.src, asset);
      //this.loading[url] = { loaded: 0, total: 1024*1024 };
      elation.events.add(asset, 'asset_load_progress', elation.bind(this, this.updateProgress));
      elation.events.add(asset, 'asset_load_complete', elation.bind(this, this.updateProgress));
    }
  }
  updateProgress(ev) {
    //console.log('room had some progress', this.loading);
    var progress;
    if (ev.data) {
      progress = ev.data;
    } else {
      progress = {
        src: ev.element.getProxiedURL(),
        loaded: ev.element.size,
        total: ev.element.size
      };
    }

    var url = progress.src;
    if (!this.loading[url]) {
      this.loading[url] = progress;
    }
    this.loading[url].loaded = progress.loaded;
    this.loading[url].total = progress.total;

    var loaded = 0, total = 0, count = 0;
    for (var k in this.loading) {
      count++;
      loaded += this.loading[k].loaded;
      total += this.loading[k].total;
    }
    var percent = loaded / total;
    //console.log('room had some progress', count + ' files, ' + loaded + ' / ' + total + ' bytes, ' + (percent * 100).toFixed(2) + '%', url);

    this.percent = percent;

    var segment = Math.floor(percent * 10);
    if (this.segment != segment) {
      this.removeclass('segment' + this.segment);
      this.segment = segment;
      this.addclass('segment' + this.segment);
    }

    this.updateTooltip();
    this.refresh();

    //this.progress.set(percent);
  }
  handleMouseOver(ev) {
    this.updateTooltip();
  }
  handleMouseOut(ev) {
    this.tooltip.setcontent('');
    this.tooltip.hide();
  }
  updateTooltip() {
return;
    var summary = this.getSummary();
    this.tooltip.setcontent(summary);
    this.tooltip.show();
  }
  getSummary() {
    // TODO - use a template for this!
    var summary = '';
    if (this.room) {
      var assets = this.room.roomassets;

      if (this.room.parseerror) {
        summary += '<h3 class="error">' + this.room.parseerror + '</h3>';
      }

      var modelstats = {
        objects: 0,
        faces: 0,
        materials: 0
      };
      for (var k in assets) {
        var arr = Object.entries(assets[k]);
        var count = arr.length;
        if (count > 0) {
          var finished = 0,
              finishedsize = 0,
              totalsize = 0;

          for (var i = 0; i < count; i++) {
            var assetname = arr[i][0],
                asset = arr[i][1],
                url = asset.getProxiedURL(asset.src);
            //var size = arr.reduce((total, v) => [total[0] + parseInt(v[1].size), total[1] + (v[1].loaded ? 1 : 0)], [0, 0]);
            if (asset.loaded) {
              finished++; 

              if (k == 'model') {
                asset.stats(modelstats);
              }
            }
            if (this.loading[url]) {
              finishedsize += this.loading[url].loaded;
              totalsize += asset.size || this.loading[url].total || this.loading[url].loaded;
            }
          }
          summary += '<h4>' + k + 's (' + finished + ' / ' + count + ')</h4>';
          summary += '<ul><li>' + this.numberFormat(finishedsize) + ' / ' + this.numberFormat(totalsize, 'bytes') + '</li>';
          if (k == 'model') {
            summary += '<li>' + this.numberFormat(modelstats.objects, 'objects') + '</li>';
            summary += '<li>' + this.numberFormat(modelstats.faces, 'faces') + '</li>';
            summary += '<li>' + this.numberFormat(modelstats.materials, 'materials') + '</li>';
          }
          summary += '</ul>';
        }
      }
    }
    return summary;
  }
  numberFormat(num, units) {
    return num.toLocaleString() + (units ? ' ' + units : '');
  }
});
elation.elements.define('janus.ui.urlbar', class extends elation.elements.ui.panel {
  init() {
    super.init();
    this.updateTitle = this.updateTitle.bind(this);
    this.updateRoom = this.updateRoom.bind(this);
  }
  create() {
    this.client = this.getClient();
    this.janusweb = this.client.janusweb;

    this.input = elation.elements.create('ui.input', {
      append: this,
      value: (this.janusweb.currentroom ? this.janusweb.currentroom.title : 'JanusWeb')
    });
    elation.events.add(this.input, 'input', (ev) => this.handleInput(ev));
    elation.events.add(this.input, 'focus', (ev) => this.handleFocus(ev));
    elation.events.add(this.input, 'blur', (ev) => this.handleBlur(ev));
    this.suggestions = elation.elements.create('janus.ui.urlbar.suggestions', {
      append: this
    });
    this.suggestions.hide();
/*
    this.urlinput = elation.elements.create('ui.input', {
      append: this,
      value: (this.janusweb.currentroom ? this.janusweb.currentroom.url : document.location.href)
    });
*/
    elation.events.add(this.janusweb, 'room_change', this.updateRoom);
    this.updateRoom();
  }
  getClient() {
    var node = this;
    while (node) {
      if (node.dataset['elationComponent'] == 'janusweb.client') {
        return elation.component.fetch(node);
      }
      node = node.parentNode
    }
  }
  updateRoom() {
    elation.events.remove(this.room, 'room_load_processed', this.updateTitle);
    this.room = this.janusweb.currentroom;
    console.log('this is the room guy', this.room);
    elation.events.add(this.room, 'room_load_processed', this.updateTitle);
    this.updateTitle();
  }
  updateTitle() {
    var room = this.janusweb.currentroom;
    if (room) {
      this.input.value = room.title;
    }
  }
  handleInput(ev) {
    if (this.updatetimer) {
      clearTimeout(this.updatetimer);
    }
    if (this.input.value.length > 0) {
      this.updatetimer = setTimeout(() => {
        this.suggestions.update(this.input.value);
      }, 200);
      this.suggestions.show();
    } else {
      this.suggestions.hide();
    }
  }
  handleFocus(ev) {
    if (this.input.value.length > 0) {
      this.suggestions.show();
    }
  }
  handleBlur(ev) {
    setTimeout(() => {
      this.suggestions.hide();
    }, 100);
  }
});
elation.elements.define('janus.ui.urlbar.suggestions', class extends elation.elements.ui.panel {
  create() {
    this.suggestions = elation.elements.create('collection.jsonapi', {
      id: 'suggested_popular',
      append: this,
      host: "https://api.janusvr.com",
      endpoint: "/getPopularRooms",
      itempath: "data",
      apiargs: {
        desc: "true",
        limit: 10,
        urlContains: ''
      }
    });
    this.panel = elation.elements.create('div', {
      append: this
    });
/*
    this.list = elation.elements.create('ui.list', {
      collection: this.suggestions,
      append: this,
      itemtemplate: 'janus.ui.navigation.suggestion.room'
    });
*/
  }
  update(search) {
    this.suggestions.apiargs.urlContains = search;
    this.suggestions.load();
    var tplvars = {
      popular: this.suggestions.items
    };
    this.panel.innerHTML = elation.template.get('janus.ui.navigation.suggestions', tplvars);
  }
})
