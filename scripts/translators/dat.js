elation.require([], function() {
  elation.component.add('janusweb.translators.dat', function() {
    this.exec = function(args) {
      return new Promise(function(resolve, reject) {
console.error('GET DAT ROOM!', args);
        let room = args.room;

        elation.engine.assetdownloader.fetchURL(args.url).then((ev) => {
console.log('got dat url', ev);
let decoder = new TextDecoder('utf-8');
let src = decoder.decode(ev.target.data);
room.loadFromSource(src);
        }).catch((err) => {
          console.error('oh no!', err);

          room.createObject('object', {
            id: 'cube',
            col: 'red',
            pos: V(0, 1.75, -5),
            scale: V(4, .1, .1),
            rotation: V(0, 0, -20)
          });
          room.createObject('object', {
            id: 'cube',
            col: 'red',
            pos: V(0, 1.75, -5),
            scale: V(4, .1, .1),
            rotation: V(0, 0, 20)
          });
          room.createObject('object', {
            id: 'room_plane',
          });
          room.createObject('light', {
            pos: V(0, 4, 2),
            light_range: 20,
            light_intensity: 10,
            light_shadow: true
          });
          room.createObject('text', {
            text: 'dat://',
            font_scale: false,
            font_size: 1.5,
            col: 'green',
            pos: V(0, 1, -5.1),
            thickness: .1
          });
          room.createObject('text', {
            text: 'DAT protocol not supported in this browser',
            font_scale: false,
            font_size: .25,
            col: 'red',
            pos: V(0, .5, -5),
            thickness: .01
          });
        });

        var roomdata = {
          room: {
            pos: [0, 0, 0],
            orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,180,0)),
            skybox_left_id: 'black',
            skybox_right_id: 'black',
            skybox_back_id: 'black',
            skybox_front_id: 'black',
            skybox_up_id: 'black',
            skybox_down_id: 'black',
            title: 'Dat Virtual World Loader'
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


