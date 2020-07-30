elation.require(['janusweb.janusbase'], function() {
  elation.component.add('engine.things.janusparagraph', function() {
    this.postinit = function() {
      elation.engine.things.janusparagraph.extendclass.postinit.call(this);
      this.defineProperties({
        text: {type: 'string', default: '', set: this.updateTexture},
        font_size: {type: 'integer', default: 16, set: this.updateTexture},
        text_col: {type: 'color', default: 0x000000, set: this.updateTexture},
        back_col: {type: 'color', default: 0xffffff, set: this.updateTexture},
        back_alpha: {type: 'float', default: 1, set: this.updateTexture},
        cull_face: { type: 'string', default: 'back', set: this.updateMaterial },
        css: {type: 'string', set: this.updateTexture },
        depth_write: { type: 'boolean', default: true },
        depth_test: { type: 'boolean', default: true },
      });
    }
    this.createObject3D = function() {
      var material = this.createMaterial();
      var geo = new THREE.PlaneGeometry(2,2);
      geo.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,.1));
      var mesh = new THREE.Mesh(geo, material);
      return mesh;
    }
    this.createMaterial = function() {
      var texture = this.createTexture();
      var sidemap = {
        'back': THREE.FrontSide,
        'front': THREE.BackSide,
        'none': THREE.DoubleSide
      };
      var matargs = {
        color: 0xffffff,
        map: texture,
        transparent: true,
        side: sidemap[this.cull_face],
        depthWrite: this.depth_write,
        depthTest: this.depth_test,
      };
      if (!this.lighting) {
        return new THREE.MeshBasicMaterial(matargs);
      } else {
        // TODO - support PBR for paragraphs
        return new THREE.MeshPhongMaterial(matargs);
      }
    }
    this.createTexture = function() {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 1024;
      this.canvas.height = 1024;
      this.texture = new THREE.Texture(this.canvas);
      this.updateTexture();
      return this.texture;
    }
    this.updateTexture = function() {
      if (!this.canvas || !this.texture) return;
      var ctx = this.canvas.getContext('2d'),
          texture = this.texture;
      this.canvas.width = 512;
      this.canvas.height = 512;
      var text_col = '#' + this.text_col.getHexString(),
          back_col = 'rgba(' + (this.back_col.r * 255) + ', ' + (this.back_col.g * 255) + ', ' + (this.back_col.b * 255) + ', ' + this.back_alpha + ')';
      var basestyle = 'font-family: sans-serif;' +
                      'font-size: ' + this.font_size + 'px;' +
                      'color: ' + text_col + ';' +
                      'background: ' + back_col + ';' +
                      'max-width: 502px;' +
                      'padding: 5px;';

      // We need to sanitize our HTML in case someone provides us with malformed markup.
      // We use SVG to render the mark-up, and since SVG is XML it means we need well-formed data
      // However, for whatever reason, <br> amd <hr> seem to break things, so we replace them with
      // styled divs instead.

      var sanitarydiv = document.createElement('div');
      sanitarydiv.innerHTML = this.text;
      var content = sanitarydiv.innerHTML.replace(/<br\s*\/?>/g, '<div class="br"></div>');
      content = content.replace(/<hr\s*\/?>/g, '<div class="hr"></div>');
      content = content.replace(/<img(.*?)>/g, "<img$1 />");

      var styletag = '<style>.paragraphcontainer { ' + basestyle + '} .br { height: 1em; } .hr { margin: .5em 0; border: 1px inset #ccc; height: 0px; }';
      if (this.css) {
        styletag += this.css;
      }
      styletag +=  '</style>';


      var data = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">' +
                 '<foreignObject width="100%" height="100%">' +
                  styletag +
                 '<div xmlns="http://www.w3.org/1999/xhtml" class="paragraphcontainer">' +
                 content +
                 '</div>' +
                 '</foreignObject>' +
                 '</svg>';

      var img = new Image();
      img.crossOrigin = 'anonymous';
      var url = 'data:image/svg+xml,' + encodeURIComponent(data);

      var timer;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          texture.needsUpdate = true;
          timer = false;
          this.refresh();
        }, 10);
      }
      img.src = url;
      this.refresh();
      return texture;
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusparagraph.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          text:  [ 'property', 'text'],
          css:  [ 'property', 'css'],
          text_col:  [ 'property', 'text_col'],
          back_col:  [ 'property', 'back_col'],
          back_alpha:  [ 'property', 'back_alpha'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusbase);
});
