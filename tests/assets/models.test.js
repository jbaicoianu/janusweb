describe("Elation Engine Assets", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
console.log('now test models');
  elation.config.set('dependencies.path', document.origin);
  elation.config.set('dependencies.rootdir', 'base/build/');
  elation.config.set('dependencies.main', 'janusweb.js');
  elation.engine.assets.loadJSON([
    { "assettype": "model", "name": "model_obj",                    "src": "media/assets/primitives/cube.obj" },
    { "assettype": "model", "name": "model_obj_mtl",                "src": "media/assets/translator/web/screensingle.obj", "mtl": "screensingle.mtl" },
    { "assettype": "model", "name": "model_obj_textures",           "src": "media/tests/models/monkey-material-smooth.obj", "mtl": "monkey-material-smooth.mtl" },
    { "assettype": "model", "name": "model_obj_textures_normalmap", "src": "", "mtl": "" },
    { "assettype": "model", "name": "model_dae_gz", "src": "https://janusweb.lnq.to:8089/www.janusvr.com/newlobby/room/V1/V1.dae.gz" },
  ], self.location.origin + "/base/build/");

  beforeEach(function(done) {
    done();
  });

  function loadAsset(type, name, eventlog) {
    var asset = elation.engine.assets.find(type, name, true);
    elation.events.add(asset, 'asset_load_queued,asset_load_start,asset_load_progress,asset_load_processing,asset_load_processed,asset_load_complete', function(ev) {
      if (!eventlog[ev.type]) {
        eventlog[ev.type] = [];
      }
      eventlog[ev.type].push(ev);
    });
    if (!eventlog) eventlog = {};
    if (asset) {
      var tex = asset.getInstance();
    }
    return new Promise(function(succeed, fail) {
      if (!tex) fail(asset);
      elation.events.add(asset, 'asset_load_complete', function() {
        //console.log(type + ' loaded!', tex);
        succeed(asset);
      });
      elation.events.add(asset, 'asset_error', function() {
        fail(asset);
      });
    });
  }

  describe('OBJ', function() {
    beforeEach(function(done) {
      done();
    });
    var mesh;
    var eventlog = {};
    it("should load an OBJ", function(done) {
      loadAsset('model', 'model_obj', eventlog).then(function(asset) {
        expect(asset).toBeDefined();
        expect(asset.loaded).toBe(true);
        var group = asset.getInstance();
        mesh = group.children[0].children[0].children[0];
        expect(mesh).toBeDefined();
        done();
      }, function(asset) {
        expect(asset.loaded).toBe(true);
        done();
      });
    });
    it('is a buffergeometry', function(done) {
      expect(mesh.geometry.type).toBe('BufferGeometry');
      done();
    });
    it('has 36 vertices', function(done) {
      expect(mesh.geometry.attributes.position.count).toBe(36);
      expect(mesh.geometry.attributes.normal.count).toBe(36);
      expect(mesh.geometry.attributes.uv.count).toBe(36);
      done();
    });
    it('fired all expected events', function(done) {
      expect(eventlog.asset_load_queued.length).toBe(1);
      expect(eventlog.asset_load_processing.length).toBe(1);
      expect(eventlog.asset_load_processed.length).toBe(1);
      expect(eventlog.asset_load_complete.length).toBe(1);
      done();
    });
  });

  describe('OBJ+MTL', function() {
    beforeEach(function(done) {
      done();
    });
    var mesh;
    var eventlog = {};
    it("should load an OBJ", function(done) {
      loadAsset('model', 'model_obj_mtl', eventlog).then(function(asset) {
        expect(asset).toBeDefined();
        expect(asset.loaded).toBe(true);
        var group = asset.getInstance();
        mesh = group.children[0].children[0].children[0];
        expect(mesh).toBeDefined();
        done();
      }, function(asset) {
        expect(asset.loaded).toBe(true);
        done();
      });
    });
    it('is a buffergeometry', function(done) {
      expect(mesh.geometry.type).toBe('BufferGeometry');
      done();
    });
    it('has 132 vertices', function(done) {
      expect(mesh.geometry.attributes.position.count).toBe(132);
      expect(mesh.geometry.attributes.normal.count).toBe(132);
      expect(mesh.geometry.attributes.uv.count).toBe(132);
      done();
    });
    it('has the right materials', function(done) {
      expect(mesh.material.type).toBe('MeshPhongMaterial');
      done();
    });
    it('fired all expected events', function(done) {
      expect(eventlog.asset_load_queued.length).toBe(1);
      expect(eventlog.asset_load_start.length).toBe(1);
      expect(eventlog.asset_load_progress.length).toBeGreaterThan(0);
      expect(eventlog.asset_load_processing.length).toBe(1);
      expect(eventlog.asset_load_processed.length).toBe(1);
      expect(eventlog.asset_load_complete.length).toBe(1);
      done();
    });
  });

  describe('OBJ+MTL - textures', function() {
    beforeEach(function(done) {
      done();
    });
    var mesh;
    var eventlog = {};
    it("should load an OBJ+MTL with textures", function(done) {
      loadAsset('model', 'model_obj_textures', eventlog).then(function(asset) {
        expect(asset).toBeDefined();
        expect(asset.loaded).toBe(true);
        var group = asset.getInstance();
        mesh = group.children[0].children[0].children[0];
        expect(mesh).toBeDefined();
        done();
      }, function(asset) {
        expect(asset.loaded).toBe(true);
        done();
      });
    });
    it('is a buffergeometry', function(done) {
      expect(mesh.geometry.type).toBe('BufferGeometry');
      done();
    });
    it('has 2904 vertices', function(done) {
      expect(mesh.geometry.attributes.position.count).toBe(2904);
      expect(mesh.geometry.attributes.normal.count).toBe(2904);
      expect(mesh.geometry.attributes.uv.count).toBe(2904);
      done();
    });
    it('has the right materials', function(done) {
      expect(mesh.material.type).toBe('MeshPhongMaterial');

      expect(mesh.material.map).toBeDefined();
      expect(mesh.material.map.image).toBeDefined();
console.log(mesh.material.map.image);
      expect(mesh.material.bumpMap).toBeDefined();
      expect(mesh.material.bumpMap.image).toBeDefined();
     console.log(mesh); 
      done();
    });
    it('fired all expected events', function(done) {
      expect(eventlog.asset_load_queued).toBeDefined();
      expect(eventlog.asset_load_queued.length).toBe(1);
      expect(eventlog.asset_load_processing).toBeDefined();
      expect(eventlog.asset_load_processing.length).toBe(1);
      expect(eventlog.asset_load_processed).toBeDefined();
      expect(eventlog.asset_load_processed.length).toBe(1);
      expect(eventlog.asset_load_complete).toBeDefined();
      expect(eventlog.asset_load_complete.length).toBe(1);
      done();
    });
  });

  describe('DAE (gzipped)', function() {
    beforeEach(function(done) {
      done();
    });
    var mesh;
    var eventlog = {};
    it("should load a gzipped DAE", function(done) {
      loadAsset('model', 'model_dae_gz', eventlog).then(function(asset) {
        expect(asset).toBeDefined();
        expect(asset.loaded).toBe(true);
        var group = asset.getInstance();
console.log('derrr', asset, group);
        mesh = group;
        expect(mesh).toBeDefined();
        done();
      }, function(asset) {
        expect(asset.loaded).toBe(true);
        done();
      });
    });
    it('is a buffergeometry', function(done) {
      //expect(mesh.geometry.type).toBe('BufferGeometry');
      done();
    });
/*
    it('has 132 vertices', function(done) {
      expect(mesh.geometry.attributes.position.count).toBe(132);
      expect(mesh.geometry.attributes.normal.count).toBe(132);
      expect(mesh.geometry.attributes.uv.count).toBe(132);
      done();
    });
    it('has the right materials', function(done) {
      expect(mesh.material.type).toBe('MultiMaterial');
      expect(mesh.material.materials.length).toBe(2);
      expect(mesh.material.materials[0].type).toBe('MeshLambertMaterial');
      expect(mesh.material.materials[1].type).toBe('MeshPhongMaterial');
      done();
    });
*/
    it('fired all expected events', function(done) {
      expect(eventlog.asset_load_queued.length).toBe(1);
      expect(eventlog.asset_load_processing.length).toBe(1);
      expect(eventlog.asset_load_processed.length).toBe(1);
      expect(eventlog.asset_load_complete.length).toBe(1);
      done();
    });
  });
/*
  it("should load an OBJ with material+color", function(done) {
  });
  it("should load an OBJ with material+texture", function(done) {
  });
  it("should load an OBJ with material+texture+normalmap", function(done) {
  });
  it("should load an OBJ with multiple objects", function(done) {
  });
*/

  // load a model (dae)
  // load a sound
  // load a video
});
