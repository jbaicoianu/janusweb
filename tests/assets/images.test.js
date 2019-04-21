describe("Elation Engine Assets", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

  elation.config.set('dependencies.rootdir', '/base/build/');
  elation.config.set('dependencies.main', 'janusweb.js');
  elation.engine.assets.loadJSON([
    { "assettype": "image", "name": "image_jpg",       "src": "media/assets/translator/reddit/trontile.jpg" },
    { "assettype": "image", "name": "image_png",       "src": "media/assets/skybox/miramar_front.png" },
    { "assettype": "image", "name": "image_png_alpha", "src": "media/assets/linear_gradient.png" },
    { "assettype": "image", "name": "image_gif",       "src": "media/assets/translator/errors/static.gif" },
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
        console.log(type + ' loaded!', tex, name);
        succeed(asset);
      });
      elation.events.add(asset, 'asset_error', function() {
        console.log(type + ' failed!', tex, name);
        fail(asset);
      });
    });
  }
  it("should load a JPG image", function(done) {
console.log('load jpg');
    loadAsset('image', 'image_jpg').then(function(asset) {
console.log('jpg loaded', asset);
      expect(asset).toBeDefined();
      expect(asset.loaded).toBe(true);
      expect(asset.imagetype).toBe('jpg');
      var tex = asset.getInstance();
      expect(tex.image).toBeDefined();
      expect(asset.hasalpha).toBe(false);
      done();
    }, function() {
      expect(asset.loaded).toBe(true);
      done();
    });
  });
  it("should load a PNG image", function(done) {
    loadAsset('image', 'image_png').then(function(asset) {
      expect(asset).toBeDefined();
      expect(asset.loaded).toBe(true);
      expect(asset.imagetype).toBe('png');
      var tex = asset.getInstance();
      var tex = asset.getInstance();
      expect(tex.image).toBeDefined();
      expect(asset.hasalpha).toBe(false);
      done();
    }, function() {
      expect(asset.loaded).toBe(true);
      var tex = asset.getInstance();
      done();
    });
  });
  it("should load a PNG image with alpha", function(done) {
    loadAsset('image', 'image_png_alpha').then(function(asset) {
      expect(asset).toBeDefined();
      expect(asset.loaded).toBe(true);
      expect(asset.imagetype).toBe('png');
      var tex = asset.getInstance();
      expect(tex.image).toBeDefined();
      expect(asset.hasalpha).toBe(true);
      done();
    }, function() {
      expect(asset.loaded).toBe(true);
      done();
    });
  });
  it("should load a GIF", function(done) {
    loadAsset('image', 'image_gif').then(function(asset) {
      expect(asset).toBeDefined();
      expect(asset.loaded).toBe(true);
      expect(asset.imagetype).toBe('gif');
      var tex = asset.getInstance();
      expect(tex.image).toBeDefined();
      expect(asset.hasalpha).toBe(true);
      done();
    }, function() {
      expect(asset.loaded).toBe(true);
      done();
    });
  });
/*
  it("should load an image that's not specified in assets list", function(done) {
    loadAsset('image', 'http://meobets.com:9876/base/build/media/assets/translator/errors/static.gif').then(function(asset) {
      expect(asset).toBeDefined();
      expect(asset.loaded).toBe(true);
      var tex = asset.getInstance();
      expect(tex.image).toBeDefined();
      expect(asset.hasalpha).toBe(true);
      done();
    }, function(asset) {
      expect(asset).toBeDefined();
      //expect(asset.loaded).toBe(true);
      done();
    });
  });
*/
});
