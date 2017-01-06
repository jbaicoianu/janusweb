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
      elation.janusweb.init({
        homepage: 'http://www.janusvr.com/index.html', 
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

  // Load a room.  It should fire events in tis order:
  // - room_load_queued
  // - room_load_start
  // - room_load_progress
  // - room_load_processing
  // - room_load_processed
  // - room_load_complete
  it("should load a room", function(done) {
    try {
      var room = janusweb.load('http://assets.metacade.com/gearvr-landing', true);
      var eventlog = {};
      elation.events.add(room, 'room_load_queued,room_load_start,room_load_progress,room_load_processing,room_load_processed,room_load_complete', function(ev) {
        console.log('got event:', ev.type);
        if (!eventlog[ev.type]) eventlog[ev.type] = [];
        eventlog[ev.type].push(ev);
      });
      elation.events.add(room, 'room_load_complete', function() {
        console.log('room load complete');
        //expect(eventlog.room_load_queued.length).toBe(1);
        expect(eventlog.room_load_start.length).toBe(1);
        expect(eventlog.room_load_progress.length).toBeGreaterThan(0);
        expect(eventlog.room_load_processing.length).toBe(1);
        expect(eventlog.room_load_processed.length).toBe(1);
        expect(eventlog.room_load_complete.length).toBe(1);
        done();
      });
    } catch (e) {
      console.log('exception happened!', e.stack);
    }
  });
  it("should stop when done", function(done) {
    elation.events.add(client.engine, 'engine_stop', function() {
      expect(client.engine.running).toBe(false);
      done();
    });
    client.engine.stop();
  });
});
