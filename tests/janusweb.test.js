describe("initialize engine", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  var client, canvas;
  beforeEach(function(done) {
    done();
  });
  it("should initialize JanusWeb client", function(done) {
    elation.janusweb.init({homepage: 'http://www.janusvr.com/index.html'}).then(function(newclient) { 
      client = newclient;
      expect(client).toBeDefined();
      done();
    });
  });
  it("added canvas to document", function(done) {
    var canvases = document.getElementsByTagName('canvas');
    expect(canvases.length).toEqual(1);
    canvas = canvases[0];
    done();
  });
  it("should load a room", function(done) {
    var janusweb = client.janusweb;
    expect(janusweb).toBeDefined();
    elation.events.add(janusweb, 'room_change', function(ev) {
      expect(janusweb.currentroom).toBeDefined();
      done();
    });
  });
  it('takes a screenshot', function(done) {
    setTimeout(function() {
      expect(canvas).toBeDefined();
      var shot = canvas.toDataURL('image/png');
      console.log(shot);
      done();
    }, 5000);
  });
});
