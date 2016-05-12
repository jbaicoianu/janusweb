elation.require(['engine.things.theaterscreen'], function() {
  elation.component.add('engine.things.janusvideo', function() {
    this.postinit = function() {
      elation.engine.things.janusvideo.extendclass.postinit.call(this);
      this.defineProperties({
        //src: { type: 'string' },
        video_id: { type: 'string' },
        loop: { type: 'boolean', default: false },
        color: { type: 'color', default: 0xffffff },
        lighting: { type: 'boolean', default: true },
      });
      elation.events.add(this, 'click', elation.bind(this, this.click));
    }
    this.createObject3D = function() {
      this.asset = elation.engine.assets.find('video', this.properties.video_id, true);
      if (this.asset) {

        var geo = this.createGeometry();
        var mat = this.createMaterial();
        elation.events.add(this.texture, 'asset_load', elation.bind(this, this.imageloaded));
        return new THREE.Mesh(geo, mat);
      } else {
        console.log('ERROR - could not find video ' + this.properties.video_id);
      }
    }
    this.createMaterial = function() {
      if (this.asset) {
        var texture = this.texture = this.asset.getAsset();
        if (this.asset.sbs3d) {
          texture.repeat.x = 0.5;
        }
        if (this.asset.ou3d) {
          texture.repeat.y = 0.5;
        }
        if (this.properties.loop) {
          texture.image.loop = true;
        }
        if (this.asset.auto_play) {
          texture.image.play();
        }
        elation.events.add(texture, 'videoframe', elation.bind(this, this.refresh));
      }

      this.texture.minFilter = THREE.LinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
      this.texture.format = THREE.RGBFormat;
      this.texture.generateMipmaps = false;

      var matargs = {
        map: this.texture,
        color: this.properties.color,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
      };
      //plane.applyMatrix(new THREE.Matrix4().makeTranslation(.5,-.5,0));
      var mat = (this.properties.lighting ? new THREE.MeshPhongMaterial(matargs) : new THREE.MeshBasicMaterial(matargs));
      return mat;
    }
    this.getSize = function(image) {
      return {width: image.videoWidth, height: image.videoHeight};
    }
    this.click = function() {
      var texture = this.asset.getAsset();
      var video = texture.image;
      if (video.currentTime > 0 && !video.paused && !video.ended) {
        video.pause();
      } else {
        video.play();
      }
    }
  }, elation.engine.things.janusimage);
});

