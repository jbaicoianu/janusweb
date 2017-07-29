elation.require([], function() {
  elation.component.add('janusweb.translators.error', function() {
    this.init = function() {
      this.errortypes = {
        404: {color1: '#ff0000', color2: '#ff3333', text: '404 - Are you lost?'},
        410: {color1: '#ff0000', color2: '#ff3333', text: '410 - Are you lost?'},
        403: {color1: '#0000ff', color2: '#3333ff', text: '403 - Forbidden'},
        500: {color1: '#ff00ff', color2: '#ff33ff', text: '500 - Server error'},
        'unknown': {color1: '#ffff00', color2: '#191900', text: 'Unknown error'},
      };
    }
    this.exec = function(args) {
      return new Promise(elation.bind(this, function(resolve, reject) {

        var room = args.room;
        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
        var assetpath = datapath + 'assets/translator/errors/';

        elation.engine.assets.loadJSON([
          {assettype: 'model', name: 'stand', src: 'error.obj', tex: 'lightmap.png'},
          {assettype: 'image', name: 'static', src: 'static.gif'}
        ], assetpath);

        var error = this.errortypes[args.error] || this.errortypes['unknown'];

        var roomdata = {
          room: {
            pos: [0,0,0],
            xdir: "-1 0 0",
            zdir: "0 0 -1",
          },
          object: [
            {id: 'stand', js_id: 0, pos: "0 -0.1 0", xdir: "-1 0 0", zdir: "0 0 -1", col: error.color1, lighting: "false"},
            {id: 'sphere', js_id: 1, pos: "0 0 5", xdir: "-1 0 0", ydir: "0 1 0", zdir: "0 0 -1", scale: "400 400 400", col: error.color2, lighting: "false", cull_face: 'front', image_id: 'static'}
          ],
          text: [
            { js_id: 2, pos: "0 1.4 7.5", xdir: "-1 0 0", zdir: "0 0 -1", scale: "6 6 1", col: error.color1, '_content': error.text}
          ],
          link: []
        };
        resolve(roomdata);
      }));
    }
  });
});

