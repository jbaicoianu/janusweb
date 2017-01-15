elation.require(['janusweb.janusbase'], function() {
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
      this.asset = this.getAsset('video', this.video_id);
      if (this.asset) {
        var geo = this.createGeometry();
        var mat = this.createMaterial();
        this.video = this.texture.image;
        elation.events.add(this.texture, 'asset_load', elation.bind(this, this.imageloaded));
        return new THREE.Mesh(geo, mat);
      } else {
        console.log('ERROR - could not find video ' + this.properties.video_id);
      }
      return new THREE.Object3D();
    }
    this.createMaterial = function() {
      if (this.asset) {
        var texture = this.texture = this.asset.getInstance();
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
        } else {
          texture.image.pause();
        }
        texture.minFilter = THREE.LinearFilter;
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
      var texture = this.asset.getInstance();
      var video = texture.image;
      if (video.currentTime > 0 && !video.paused && !video.ended) {
        video.pause();
      } else {
        video.play();
      }
    }
    this.start = function() {
      if (this.video) {
        if (this.video.originalSrc) {
          this.video.src = this.video.originalSrc;
        }
      }
    }
    this.stop = function() {
      console.log('stop the video!', this, this.video);
      if (this.video) {
        this.video.pause();
        // FIXME - this stops the video from loading any more data, but means we can't easily restart
        //         so we're hackishly working around that
        this.video.originalSrc = this.video.src;
        this.video.src = '';
      }
    }
  }, elation.engine.things.janusimage);
});

