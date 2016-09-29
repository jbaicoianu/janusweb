describe("JanusWeb Scripting", function() {
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

  it("should have a global janus object", function(done) {
    expect(window.janus).toBeDefined();
    done();
  });
  it("should return a URL for janus.currenturl()", function(done) {
    expect(window.janus.currenturl).toBeDefined();
    expect(window.janus.currenturl()).toBeDefined();
    done();
  });
});
