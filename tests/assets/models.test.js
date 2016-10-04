describe("Elation Engine Assets", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  elation.config.set('dependencies.rootdir', '/base/build/');
  elation.config.set('dependencies.main', 'janusweb.js');
  elation.engine.assets.loadJSON([
    { "assettype": "model", "name": "model_obj",                    "src": "media/assets/primitives/cube.obj" },
    { "assettype": "model", "name": "model_obj_mtl",                "src": "media/assets/translator/web/screensingle.obj", "mtl": "screensingle.mtl" },
    { "assettype": "model", "name": "model_obj_textures",           "src": "http://vrsites.com/assets/Alt/2/index.obj", "mtl": "http://vrsites.com/assets/Alt/2/index.mtl" },
    { "assettype": "model", "name": "model_obj_textures_normalmap", "src": "", "mtl": "" },
    { "assettype": "model", "name": "model_dae_gz", "src": "http://www.janusvr.com/newlobby/room/V1/V1.dae.gz" },
  ], self.location.origin + "/base/build/");

  beforeEach(function(done) {
    done();
  });

  function loadAsset(type, name) {
    var asset = elation.engine.assets.find(type, name, true);
    if (asset) {
      var tex = asset.getInstance();
    }
    return new Promise(function(succeed, fail) {
      if (!tex) fail(asset);
      elation.events.add(asset, 'asset_load', function() {
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
    it("should load an OBJ", function(done) {
      loadAsset('model', 'model_obj').then(function(asset) {
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
  });

  describe('OBJ+MTL', function() {
    beforeEach(function(done) {
      done();
    });
    var mesh;
    it("should load an OBJ", function(done) {
      loadAsset('model', 'model_obj_mtl').then(function(asset) {
        expect(asset).toBeDefined();
        expect(asset.loaded).toBe(true);
        var group = asset.getInstance();
        mesh = group.children[0].children[0].children[0].children[0]; // FIXME - why is this differemt from just OBJ?
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
      expect(mesh.material.type).toBe('MultiMaterial');
      expect(mesh.material.materials.length).toBe(2);
      expect(mesh.material.materials[0].type).toBe('MeshLambertMaterial');
      expect(mesh.material.materials[1].type).toBe('MeshPhongMaterial');
      done();
    });
  });

  describe('OBJ+MTL - textures', function() {
    beforeEach(function(done) {
      done();
    });
    var mesh;
    it("should load an OBJ+MTL with textures", function(done) {
      loadAsset('model', 'model_obj_textures').then(function(asset) {
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
    it('has the right materials', function(done) {
      expect(mesh.material.type).toBe('MultiMaterial');
      expect(mesh.material.materials.length).toBe(4);
      expect(mesh.material.materials[0].type).toBe('MeshLambertMaterial');
      expect(mesh.material.materials[1].type).toBe('MeshPhongMaterial');
      expect(mesh.material.materials[2].type).toBe('MeshPhongMaterial');
      expect(mesh.material.materials[3].type).toBe('MeshPhongMaterial');
      done();
    });
  });

/*
  describe('DAE (gzipped)', function() {
    beforeEach(function(done) {
      done();
    });
    var mesh;
    it("should load a gzipped DAE", function(done) {
      loadAsset('model', 'model_dae_gz').then(function(asset) {
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
      expect(mesh.material.type).toBe('MultiMaterial');
      expect(mesh.material.materials.length).toBe(2);
      expect(mesh.material.materials[0].type).toBe('MeshLambertMaterial');
      expect(mesh.material.materials[1].type).toBe('MeshPhongMaterial');
      done();
    });
  });
*/
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
