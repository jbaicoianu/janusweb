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
    while (node && node !== document) {
      if (node.dataset['elationComponent'] == 'janusweb.client') {
        return elation.component.fetch(node);
      }
      node = node.parentNode
    }
    return elation.component.fetch(document.querySelector('[data-elation-component="janusweb.client"]'));
  }
  updateCurrentURL() {
    var room = this.janusweb.currentroom;
    this.statusindicator.updateCurrentURL(room.getProxyObject());
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


    elation.events.add(this.janusweb, 'room_load_start', (ev) => this.updateCurrentURL());

    this.updateCurrentURL();

    this.percent = 0;

    this.refresh();


    elation.events.add(this, 'mouseover', (ev) => this.handleMouseOver(ev));
    elation.events.add([this, this.tooltip], 'mouseout', (ev) => this.handleMouseOut(ev));
  }
  render() {
    var canvas = this.getCanvas();

    if (!canvas) return;

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
  getCanvas() {
    if (!this.canvas && this.inner) {
      this.canvas = document.createElement('canvas');
      this.inner.appendChild(this.canvas);
    }
    return this.canvas;
  }

  getClient() {
    var node = this;
    while (node && node !== document) {
      if (node.dataset['elationComponent'] == 'janusweb.client') {
        return elation.component.fetch(node);
      }
      node = node.parentNode
    }
    return elation.component.fetch(document.querySelector('[data-elation-component="janusweb.client"]'));
  }
  updateCurrentURL(room) {
    if (!room && this.janusweb.currentroom) {
      room = this.janusweb.currentroom.getProxyObject();
    }
    if (room && this.room !== room) {
      // FIXME - need to remove events from previous room

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

      if (this.errorwindow) {
        this.errorwindow.hide();
        this.removeChild(this.errorwindow);
        this.errorwindow = false;
      }

      if (room.loaded) {
        this.updateRoomAssets();
      }
    }
    this.loading = {};
    this.percent = 0;
    //this.progress.set(0);
    //this.progress.show();
    this.updateStatus('loading');
  }
  updateStatus(status, ev) {
    if (this.room && this.room.parseerror) {
      // Force error status to remain if an error is thrown
      status = 'error';

      if (!this.errorwindow) {
        this.errorwindow = elation.elements.create('ui-window', {
          title: 'JML Parse Error',
          //content: this.room.parseerror,
          append: this,
          top: 60
        });
        this.errorwindow.setcontent(this.room.parseerror);
      }
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
    this.addToRecents = this.addToRecents.bind(this);
    this.updateRoom = this.updateRoom.bind(this);
  }
  create() {
    this.client = this.getClient();
    this.janusweb = this.client.janusweb;

    this.titlelabel = elation.elements.create('h1', {
      append: this,
      value: (this.janusweb.currentroom ? this.janusweb.currentroom.title : 'Untitled Room')
    });
    this.input = elation.elements.create('ui.input', {
      append: this,
      value: (this.janusweb.currentroom ? this.janusweb.currentroom.url : '')
    });
    elation.events.add(this.input, 'input', (ev) => this.handleInput(ev));
    elation.events.add(this.input, 'focus', (ev) => this.handleFocus(ev));
    elation.events.add(this.input, 'accept', (ev) => this.handleAccept(ev));
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
    while (node && node !== document) {
      if (node.dataset['elationComponent'] == 'janusweb.client') {
        return elation.component.fetch(node);
      }
      node = node.parentNode
    }
    return elation.component.fetch(document.querySelector('[data-elation-component="janusweb.client"]'));
  }
  updateRoom() {
    // Remove listeners from previous room
    elation.events.remove(this.room, 'room_load_processed', this.updateTitle);
    elation.events.remove(this.room, 'room_load_complete', this.addToRecents);
    this.room = this.janusweb.currentroom;
    elation.events.add(this.room, 'room_load_processed', this.updateTitle);
    elation.events.add(this.room, 'room_load_complete', this.addToRecents);
    this.updateTitle();
  }
  updateTitle() {
    var room = this.janusweb.currentroom;
    if (room) {
      this.titlelabel.innerHTML = room.title;
      this.input.value = room.url;
    }
  }
  addToRecents(room) {
    var room = this.janusweb.currentroom;
    if (room) {
      var roomdata = {
        title: room.title,
        url: room.url,
        time: new Date().getTime() / 1000,
        // TODO - we should take a snapshot of this room and store it along with this data
        //thumbnail: ''
      };
      setTimeout(() => {
        janus.engine.client.screenshot({width: 60, height: 60}).then((d) => {
          roomdata.thumbnail = d;
          this.suggestions.recents.add(roomdata);
        });
      }, 100);
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
  handleAccept(ev) {
    var url = this.input.value;
    if (url.length > 0) {
      if (url.indexOf(':') == -1) {
        url = 'http://' + url;
      }
      if (ev.altKey) {
        janus.setActiveRoom(url);
      } else {
        player.spawnPortal(url);
      }
    }
  }
  handleFocus(ev) {
    this.input.select();
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
    // Store a list of recently-visited URLs in localStorage
    this.recents = elation.elements.create('collection.localindexed', {
      append: this,
      storagekey: 'janusweb.ui.urlbar.recents',
      index: 'url'
    });
    this.recents.load();
    // Create a filtered collection which we can use to search within the dataset.  We'll set the filter function later.
    this.suggestions_recent = this.recents.filter((d) => false); 
    this.suggestions_recent.id = 'suggested_recents';
    this.suggestions_popular = elation.elements.create('collection.jsonapi', {
      id: 'suggested_popular',
      append: this,
      host: "https://api.janusvr.com",
      endpoint: "/getPopularRooms",
      itempath: "data",
      apiargs: {
        desc: "true",
        limit: 10,
        urlContains: ''
      },
      datatransform: {
        items: (response) => {
          let transformed = [];
          for (var i = 0; i < response.data.length; i++) {
            let room = response.data[i];
            transformed.push({
              title: room.roomName,
              url: room.roomUrl,
              thumbnail: room.thumbnail,
              time: room.lastEntered / 1000
            });
          }
          return transformed;
        }
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
    this.suggestions_popular.apiargs.urlContains = search;
    this.suggestions_popular.load();

    this.suggestions_recent.filterfunc = (d) => this.applySearchFilter(search, d);
    this.suggestions_recent.update();

    var tplvars = {
      popular: this.suggestions_popular.items,
      recents: this.suggestions_recent.items
    };
    this.panel.innerHTML = elation.template.get('janus.ui.navigation.suggestions', tplvars);
  }
  applySearchFilter(term, node) {
    return (
            // TODO - this is the loosest definition of the term "search" - we could do much better here
            (node.url.indexOf(term) > -1) ||
            (node.title.indexOf(term) > -1)
           );
  }
})
