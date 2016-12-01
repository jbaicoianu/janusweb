elation.require(['elation.collection'], function() {
  elation.component.add('janusweb.translators.default', function() {
    this.init = function() {
      this.queue = [];
      this.janus = this.args.janus;
    }
    this.loadTranslator = function() {
      var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
      var assetpath = datapath + 'assets/translator/web/';
      var fullfile = assetpath + 'Parallelogram.html';
      this.roomsource = '<fireboxroom><room use_local_asset="room2"></room></fireboxroom>';
      elation.net.get(fullfile, null, { callback: elation.bind(this, this.handleLoad) });
    }
    this.handleLoad = function(source) {
      this.roomsource = source;

      if (this.queue) {
        this.queue.forEach(elation.bind(this, this.exec));
      }
    }
    this.exec = function(args) {
      return new Promise(elation.bind(this, function(resolve, reject) {
        // Store the resolve/reject functions so we can call them later, from other functions
        if (!(args.resolve && args.reject)) {
          args.resolve = resolve;
          args.reject = reject;
        }
        if (!this.roomsource) {
          // Translator isn't loaded yet, so load it up and add thiss request back to the queue
          this.loadTranslator();
          this.queue.push(args);
        } else {
          this.translate(args);
        }
      }));
    }
    this.translate = function(args, ev) {
      var room = args.room;
      var source = room.parseSource(this.roomsource);
      var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
      var fullpath = datapath + 'assets/translator/web/';
      room.baseurl = fullpath;
      var roomdata = this.janus.parser.parse(source.source, room.baseurl, datapath);

console.log('DEFAULT GUY STUFF', roomdata, args, datapath, room.baseurl);
      roomdata.assets.websurfaces.web1.src = args.url;

      args.resolve(roomdata);
    }
    this.getRelativeDate = function(ts) {
      var now = new Date().getTime() / 1000;
      var diff = now - ts;
      var str = Math.floor(diff) + ' seconds ago';
      if (diff > 60) str = Math.floor(diff / 60) + ' minutes ago';
      if (diff > 3600) str = Math.floor(diff / 3600) + ' hours ago';
      if (diff > 86400) str = Math.floor(diff / 86400) + ' days ago';
      if (diff > 2592000) str = Math.floor(diff / 2592000) + ' months ago';
      if (diff > 31536000) str = Math.floor(diff / 31536000) + ' years ago';
      return str;
    }
  });
});

