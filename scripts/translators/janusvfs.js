elation.require([], function() {
  elation.component.add('janusweb.translators.janusvfs', function() {
    this.exec = function(args) {
      return new Promise(async function(resolve, reject) {
        setTimeout(async () => {
          elation.engine.assetdownloader.fetchURL(args.url).then((ev) => {
            let decoder = new TextDecoder('utf-8');
            let src = decoder.decode(ev.target.data);
            elation.events.fire({element: room._target, type: 'room_load_processing'});
            room.loadFromSource(src);
            resolve({room: { }, source: src});
          }).catch((err) => {
            console.log('oh no', err);
            reject();
          });
        }, 1000);
      });
    }
  });
});
