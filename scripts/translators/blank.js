elation.require([], function() {
  elation.component.add('janusweb.translators.blank', function() {
    this.exec = function(args) {
      return new Promise(function(resolve, reject) {
        var roomdata = {
          room: {
            use_local_asset: 'room_plane',
            pos: [0, 0, 0],
            orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0))
          },
          object: [],
          link: []
        };
        //var bookmarks = elation.collection.localindexed({key: 'janusweb.bookmarks'});
        resolve(roomdata);
      });
    }
  });
});

