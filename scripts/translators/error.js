elation.require([], function() {
  elation.component.add('janusweb.translators.error', function() {
    this.exec = function(args) {
      return new Promise(function(resolve, reject) {

        var room = args.room;
/*
<AssetObject id="stand" src="file:./assets/translator/errors/error.obj" tex0="file:./assets/translator/errors/lightmap.png" />
<AssetImage id="static" src="file:./assets/translator/errors/static.gif" tex_linear="false" />
</Assets>

<Room server="janusweb.lnq.to" port="5566" pos="0.8 -0.2 0" xdir="1 0 0" ydir="0 1 0" zdir="0 0 1">
<Object id="stand" js_id="0" locked="true" pos="1 -0.1 4" xdir="-1 0 0" zdir="0 0 -1" col="#ff0000" lighting="false" collision_id="stand" />
<Object id="sphere" js_id="1" locked="true" pos="4 350 -1" xdir="0 0 1" ydir="0 -1 0" zdir="1 0 0" scale="400 400 400" col="#190000" lighting="false" cull_face="front" image_id="static" />
<Text js_id="2" pos="1.3 1.4 12.5" xdir="-1 0 0" zdir="0 0 -1" scale="6 6 1" col="#ff0000">404 - Are you lost?</Text>
</Room>
</FireBoxRoom>
</body>
</html>
*/
        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
        var assetpath = datapath + 'assets/translator/errors/';

        elation.engine.assets.loadJSON([
          {assettype: 'model', name: 'stand', src: 'error.obj'},
          {assettype: 'image', name: 'static', src: 'static.gif'}
        ], assetpath);

        var roomdata = {
          room: {
            pos: [0.8, -0.2, 0],
            orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0))
          },
          objects: [
            room.parseNode({id: 'stand', js_id: 0, pos: "1 -0.1 4", xdir: "-1 0 0", zdir: "0 0 -1", col: "#ff0000", lighting: "false"}),
            room.parseNode({id: 'sphere', js_id: 1, pos: "4 350 -1", xdir: "0 0 1", ydir: "0 -1 0", zdir: "1 0 0", scale: "400 400 400", col: "#190000", lighting: "false", cull_face: 'front', image_id: 'static'})
          ],
          texts: [
            room.parseNode({ js_id: 2, pos: "1.3 1.4 12.5", xdir: "-1 0 0", zdir: "0 0 -1", scale: "6 6 1", col: "#ff0000", '_content': '404 - Are you lost?' })
          ],
          links: []
        };
        resolve(roomdata);
      });
    }
  });
});

