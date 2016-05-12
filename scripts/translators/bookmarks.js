elation.require(['elation.collection'], function() {
  elation.component.add('janusweb.translators.bookmarks', function() {
    this.exec = function(args) {
      return new Promise(function(resolve, reject) {
        var roomdata = {
          room: {
            use_local_asset: 'room2',
            pos: [-18, 0, 0],
            orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0))
          },
          objects: [],
          links: []
        };
        //var bookmarks = elation.collection.localindexed({key: 'janusweb.bookmarks'});
        var bookmarks = args.janus.bookmarks;
        var x = 0, y = 0,
            spacex = 1.5, spacey = 1.2,
            numy = 1,
            offsetx = -19, offsety = 0;
        if (bookmarks.length > 0) {
          var items = bookmarks.items;
          for (var i = 0; i < items.length; i++) {
            var item = items[items.length - i - 1];
            roomdata.links.push({
              url: item.url,
              title: item.title,
              scale: [1.2, 2, 1],
              pos: [Math.floor(i / numy) * spacex + offsetx, offsety - ((i % numy) * spacey), 5],
              orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0))
            });
          };
        }
        resolve(roomdata);
      });
    }
  });
});
