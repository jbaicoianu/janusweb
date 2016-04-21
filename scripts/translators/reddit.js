elation.require(['elation.collection'], function() {
  elation.component.add('janusweb.translators.reddit', function() {
    this.init = function() {
      var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
      var fullfile = datapath + 'assets/translator/reddit/RedditRoomConcept.html';
      this.queue = [];
      this.promise = false;
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
        args.resolve = resolve;
        args.reject = reject;
        if (!this.roomsource) {
          this.queue.push(args);
        } else {
          var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
          var fullpath = datapath + 'assets/translator/reddit/';
          var room = args.room;
          room.baseurl = fullpath;
          var endpoint = args.url.replace(/^https?:\/\/(www\.)?reddit\.com/, '');
          var idx = endpoint.indexOf('?');
          if (idx != -1) {
            endpoint = endpoint.substr(0, idx) + '.json' + endpoint.substr(idx);
          } else {
            endpoint += '.json';
          }

          var collection = elation.collection.jsonapi({
            host: 'https://www.reddit.com',
            endpoint: endpoint,
            datatransform: {
              items: function(data) {
                var items = [];
                data.data.children.forEach(function(c) {
                  items.push(c.data);
                });
                return items;
              },
            },
            events: {
              collection_load: elation.bind(this, this.translate, args)
            }
          });
          console.log(collection.items);
        }
      }));
    }
    this.translate = function(args, ev) {
console.log('dud');
      var room = args.room;
      var source = room.parseSource(this.roomsource);
      var roomdata = room.parseFireBox(source.source);
      var items = ev.target.items;
      var numlinks = 25;
      var flip = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
      var lastid = false;
      var texts = {};
      roomdata.texts.forEach(function(t) { texts[t.js_id] = t; });
      var offset = 3;
      for (var i = 0; i < numlinks; i++) {
        var item = items[i];
        var link = roomdata.links[i];
        if (item && link) {
          link.title = item.title;
          link.url = item.url;
          lastid = item.name;
        }
        var textid = offset + (i * 6);
        //texts[textid]._content = item.title;
        texts[textid]._content = (i+1);
        texts[textid+1]._content = item.title;
        texts[textid+2]._content = this.getRelativeDate(item.created) + ' by';
        texts[textid+3]._content = item.author;
        //texts[textid+3]._content = item.user;
        texts[textid+4]._content = item.score + ' upvotes';
      }
      var idx = args.url.indexOf('?');
      var nexturl = (idx == -1 ? args.url : args.url.substr(0, idx)) + '?count=25&after=' + lastid;
      
      roomdata.links[roomdata.links.length-1].url = nexturl;
      args.resolve(roomdata);
    }
    this.getRelativeDate = function(ts) {
      var now = new Date().getTime() / 1000;
      var diff = now - ts;
      var str = diff + ' seconds ago';
      if (diff > 60) str = Math.floor(diff / 60) + ' minutes ago';
      if (diff > 3600) str = Math.floor(diff / 3600) + ' hours ago';
      if (diff > 86400) str = Math.floor(diff / 86400) + ' days ago';
      if (diff > 2592000) str = Math.floor(diff / 2592000) + ' months ago';
      if (diff > 31536000) str = Math.floor(diff / 31536000) + ' years ago';
      return str;
    }
  });
});
