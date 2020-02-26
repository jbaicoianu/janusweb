describe("JanusWeb Render textures", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  var client, janusweb, canvas;
  var resolution = '800x600';

  beforeEach(function(done) {
    done();
  });

  it("should initialize client", function(done) {
    try {
      elation.janusweb.init({
        resolution: resolution,
        autoload: false,
        showchat: false,
        networking: false,
        shownavigation: false
      }).then(function(newclient) { 
        client = newclient;
        janusweb = client.janusweb;
        expect(client).toBeDefined();
        expect(janusweb).toBeDefined();
        done();
      });
    } catch (e) {
      console.log('exception happened!', e.stack);
    }
  });
  it("added canvas to document", function(done) {
    var canvases = document.getElementsByTagName('canvas');
    expect(canvases.length).toEqual(1);
    canvas = canvases[0];
    done();
  });

  it("defines testing assets", function(done) {
    setTimeout(function() {
      let assetpack = elation.engine.assets.loadJSON([
        { assettype: 'image', name: 'solid_red_jpg', src: '../tests/images/solid-red.jpg' },
        { assettype: 'image', name: 'solid_red_png', src: '../tests/images/solid-red.png' },
        { assettype: 'image', name: 'solid_blue_jpg', src: '../tests/images/solid-blue.jpg' },
        { assettype: 'image', name: 'solid_blue_png', src: '../tests/images/solid-blue.png' },
        { assettype: 'image', name: 'solid_green_jpg', src: '../tests/images/solid-green.jpg' },
        { assettype: 'image', name: 'solid_green_png', src: '../tests/images/solid-green.png' },

        { assettype: 'image', name: 'transparent_red_50_png', src: '../tests/images/transparent-red-50.png' },
        //{ assettype: 'image', name: 'transparent_red_50_gif', src: '../tests/images/transparent-red-50.gif' },
        { assettype: 'image', name: 'transparent_blue_50_png', src: '../tests/images/transparent-blue-50.png' },
        //{ assettype: 'image', name: 'transparent_blue_50_gif', src: '../tests/images/transparent-blue-50.gif' },
        { assettype: 'image', name: 'transparent_green_50_png', src: '../tests/images/transparent-green-50.png' },
        //{ assettype: 'image', name: 'transparent_green_50_gif', src: '../tests/images/transparent-green-50.gif' },
      ], elation.config.get('janusweb.datapath') + 'assets/');

      expect(assetpack.assets.length).toBe(9);
      done();
    }, 1000);
  });


  it("loads a solid red texture", function(done) {
    var roomsrc = `
<FireBoxRoom>
  <Assets>
   <AssetImage id="solid_red_png" src="https://web.janusxr.org/media/tests/images/solid-red.png" />
  </Assets>
  <Room skybox_left_id="black" skybox_right_id="black" skybox_top_id="black" skybox_bottom_id="black" skybox_front_id="black" skybox_back_id="black">
  <Image id="solid_red_png" pos="0 1 2" scale="5 5 5" lighting="false" />
 </Room>
</FireBoxRoom>`;

    var testroom = janusweb.loadFromSource(roomsrc, true);
    elation.events.add(testroom, 'room_load_complete', function() {
      setTimeout(() => {
        client.view.getPixelAt(0,0).then(function(color) {
          expect(color[0]).toBe(255);
          expect(color[1]).toBe(0);
          expect(color[2]).toBe(0);
          expect(color[3]).toBe(255);
          done();
        });
      }, 100);
    });
  });

  it("loads a solid green texture", function(done) {
    var roomsrc = `
<FireBoxRoom>
 <Assets>
   <AssetImage id="solid_green_png" src="https://web.janusxr.org/media/tests/images/solid-green.png" />
 </Assets>
 <Room skybox_left_id="black" skybox_right_id="black" skybox_top_id="black" skybox_bottom_id="black" skybox_front_id="black" skybox_back_id="black">
  <Image id="solid_green_png" pos="0 1 2" scale="5 5 5" lighting="false" />
 </Room>
</FireBoxRoom>`;

    var testroom = janusweb.loadFromSource(roomsrc, true);
    elation.events.add(testroom, 'room_load_complete', function() {
      setTimeout(() => {
        client.view.getPixelAt(0,0).then(function(color) {
          expect(color[0]).toBe(0);
          expect(color[1]).toBe(255);
          expect(color[2]).toBe(0);
          expect(color[3]).toBe(255);
          done();
        });
      }, 100);
    });
  });

  it("loads a solid blue texture", function(done) {
    var roomsrc = '<FireBoxRoom><Assets></Assets><Room skybox_left_id="black" skybox_right_id="black" skybox_top_id="black" skybox_bottom_id="black" skybox_front_id="black" skybox_back_id="black"><Image id="solid_blue_png" pos="0 1 2" scale="5 5 5" lighting="false" /></Room></FireBoxRoom>';

    var testroom = janusweb.loadFromSource(roomsrc, true);
    elation.events.add(testroom, 'room_load_complete', function() {
      setTimeout(() => {
        client.view.getPixelAt(0,0).then(function(color) {
          expect(color[0]).toBe(0);
          expect(color[1]).toBe(0);
          expect(color[2]).toBe(255);
          expect(color[3]).toBe(255);
          done();
        });
      }, 100);
    });
  });
  it("loads a transparent red texture", function(done) {
    var roomsrc = '<FireBoxRoom><Assets></Assets><Room skybox_left_id="black" skybox_right_id="black" skybox_top_id="black" skybox_bottom_id="black" skybox_front_id="black" skybox_back_id="black"><Object id="plane" image_id="transparent_red_50_png" pos="0 1 2" scale="5 5 .5" lighting="false" zdir="0 0 -1"/></Room></FireBoxRoom>';

    var testroom = janusweb.loadFromSource(roomsrc, true);
    elation.events.add(testroom, 'room_load_complete', function() {
      setTimeout(() => {
        client.view.getPixelAt(0,0).then(function(color) {
          expect(color[0]).toBe(127);
          expect(color[1]).toBe(0);
          expect(color[2]).toBe(0);
          expect(color[3]).toBe(255);
          done();
        });
      }, 100);
    });
  });
  it("loads a transparent red texture over a solid green texture", function(done) {
    var roomsrc = '<FireBoxRoom><Assets></Assets><Room skybox_left_id="black" skybox_right_id="black" skybox_top_id="black" skybox_bottom_id="black" skybox_front_id="black" skybox_back_id="black"><Object id="plane" image_id="transparent_red_50_png" pos="0 1 2" scale="5 5 .5" lighting="false" zdir="0 0 -1"/><Object id="cube" image_id="solid_green_png" pos="0 1 3" scale="10 10 .5" lighting="false" /></Room></FireBoxRoom>';

    var testroom = janusweb.loadFromSource(roomsrc, true);
    elation.events.add(testroom, 'room_load_complete', function() {
      setTimeout(() => {
        client.view.getPixelAt(0,0).then(function(color) {
  console.log('got a color', color);
          expect(color[0]).toBe(127);
          expect(color[1]).toBe(128);
          expect(color[2]).toBe(0);
          expect(color[3]).toBe(255);
          done();
        });
      }, 100);
    });
  });


  it("should stop when done", function(done) {
    elation.events.add(client.engine, 'engine_stop', function() {
      expect(client.engine.running).toBe(false);
      done();
    });
    client.engine.stop();
  });
});

