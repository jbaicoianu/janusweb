describe("JanusWeb Init", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  var client, janusweb, canvas;
  var resolution = '800x600';

  beforeEach(function(done) {
    jasmine.addMatchers(imagediff.jasmine);
    done();
  });

  it("should initialize client", function(done) {
    try {
      elation.janusweb.init({
        resolution: resolution,
        autoload: false,
        showchat: false,
        networking: false
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

  it("should stop when done", function(done) {
    elation.events.add(client.engine, 'engine_stop', function() {
      expect(client.engine.running).toBe(false);
      done();
    });
    client.engine.stop();
  });
});
