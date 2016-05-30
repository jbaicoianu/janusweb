describe("JanusWeb", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  var client, janusweb, canvas;
  var urljson = "https://raw.githubusercontent.com/jbaicoianu/janusweb/screenshots/urls.json";
  var rooms, roomnames, room;
  beforeEach(function(done) {
    jasmine.addMatchers(imagediff.jasmine);
    done();
  });
  
  it("should fetch list of test URLs", function(done) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", urljson);
    xhr.addEventListener("load", function(d) {
      expect(xhr.responseText).toBeDefined();
      expect(xhr.responseText.length).toBeGreaterThan(0);
      rooms = JSON.parse(xhr.responseText);
      expect(rooms).toBeDefined();
      roomnames = Object.keys(rooms);
      room = rooms[roomnames[0]];
      done();
    });
    xhr.send();
  });
/*
  it("should initialize client", function(done) {
    elation.janusweb.init({homepage: 'data:text/html,<fireboxroom></fireboxroom>', resolution: '800x600'}).then(function(newclient) { 
      client = newclient;
      janusweb = client.janusweb;
      expect(client).toBeDefined();
      done();
    });
  });
*/
  it("should initialize client", function(done) {
    try {
      elation.janusweb.init({homepage: 'http://www.janusvr.com/index.html', resolution: '640x480'}).then(function(newclient) { 
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

  it("should load a room", function(done) {
    expect(janusweb).toBeDefined();
    janusweb.setActiveRoom(room.url);
    elation.events.add(janusweb, 'room_change', function(ev) {
      expect(janusweb.currentroom).toBeDefined();
      done();
    });
  });
  it('takes a screenshot', function(done) {
    setTimeout(function() {
      expect(canvas).toBeDefined();
      var shot = canvas.toDataURL('image/png');

      var newimg = new Image();
      newimg.src = shot;
      newimg.crossOrigin = '';
      
      var img = new Image();
      img.crossOrigin = '';
      img.src = "https://raw.githubusercontent.com/jbaicoianu/janusweb/screenshots/janusweb-homepage-chrome-800x600.png";
      img.addEventListener('load', function() {

        var diff = imagediff.equal(newimg, img, 98);
        expect(diff).toBe(true);
        done();
      });
    }, 5000);
  });

});
