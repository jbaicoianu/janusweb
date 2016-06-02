describe("JanusWeb Init", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  var client, janusweb, canvas;
  var resolution = '800x600';
  var browser = 'chrome'; // FIXME - don't hardcode this

  beforeEach(function(done) {
    jasmine.addMatchers(imagediff.jasmine);
    done();
  });

  it("should initialize client", function(done) {
    try {
      elation.janusweb.init({homepage: 'http://www.janusvr.com/index.html', resolution: resolution}).then(function(newclient) { 
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

  var roomnames = Object.keys(rooms);
  for (var i = 0; i < roomnames.length; i++) {
    var roomname = roomnames[i];

    function testRoom(roomname) {
      var room = rooms[roomname];
      it("should load a room: " + roomname, function(done) {
        expect(janusweb).toBeDefined();
        expect(roomname).toBeDefined();
        expect(room).toBeDefined();
        expect(room.url).toBeDefined();

        var handleRoomChange = function(ev) {
          elation.events.remove(janusweb, 'room_change', handleRoomChange);
          expect(janusweb.currentroom).toBeDefined();

          setTimeout(function() {
            expect(canvas).toBeDefined();
            var shotname = ['janusweb', roomname, browser, resolution].join('-') + '.png';
            var shot = canvas.toDataURL('image/png');

            elation.net.post('https://api.imgur.com/3/upload.json', 
              {
                type: 'base64',
                name: shotname,
                title: 'Test Screenshot - ' + roomname,
                image: shot.split(',')[1]
              }, 
              {
                headers: {
                  Authorization: 'Client-ID 3c6bb1075f20701'
                },
                callback: function(data) {
                  var json = JSON.parse(data);
                  console.log('UPLOAD SUCCESS', roomname, shotname, json.data.link);
                }
              }
            );

            var newimg = new Image();
            newimg.src = shot;
            newimg.crossOrigin = '';
            
            var img = new Image();
            img.crossOrigin = '';
            img.src = "https://raw.githubusercontent.com/jbaicoianu/janusweb/screenshots/" + shotname;
            img.addEventListener('load', function() {
              var diff = imagediff.equal(newimg, img, 98);
              expect(diff).toBe(true);
              setTimeout( done, 1000);
            });
          }, 10000);
        };
        elation.events.add(janusweb, 'room_change', handleRoomChange);
        janusweb.setActiveRoom(room.url);
      });
    } 
    testRoom(roomname);
  }
  it("should stop when done", function(done) {
    elation.events.add(client.engine, 'engine_stop', function() {
      expect(client.running).toBe(false);
      done();
    });
    client.engine.stop();
  });
});
