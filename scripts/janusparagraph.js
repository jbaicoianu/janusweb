/*
 * <paragraph> text-to-texture translator. The builtin XMLtranslator allows:
 *
 *  1. inline html             : <paragraph><![CDATA[ <b>hello world</b> ]]></paragraph>
 *  2. inline html (partial)   : <paragraph selector="span"><![CDATA[ <b>hello <span>world</span></b> ]]></paragraph>
 *  3. external url            : <paragraph url="https://janusxr.org"/>
 *  4. external url (partials) : <paragraph url="https://janusxr.org" selector=".infoText"/>
 *  5. janusroom container html: <paragraph selector=".someclass"/>
 *  6. janusroom container xml : <paragraph selector="tag subtag title"/>
 *  7. RSS                     : <paragraph url="https://my.org/foo.rss" selector="item description"/>
 *  8. XML                     : <paragraph url="https://my.org/bar.xml" selector="title"/>
 *  9. any data- or selector-format via 'paragraph_translator' event
 *
 *  EXAMPLE TRANSLATOR:
 *
 *     room.addEventListener("paragraph_translator", function(e){
 *       const {translator,paragraph} = e.detail
 *       // now you can override the default translator
 *       translator.fetch     = async (url) => this.text = "a response"    // my custom fetch function
 *       translator.translate = async (   ) => ["<h1>head</h1>",this.text] // my x2html translator
 *     }
 *
 *  NOTES:
 *  1. By default, selectors are done via `document.querySelectorAll`
 *  2. in case of multiple results:
 *    2.1 clicking the paragraph with cycle through them
 *    2.2 setting cycle="3000" allows for (2sec per item) slideshows
 *    2.3 setting `rooms.objects.myparagraph.index++` cycles to next item
 *  3. width/height-attributes offers finer control of texture size
 *  4. ttl-attributes allows finer control of webrequest-cache (default 2 mins)
 *  5. setting `rooms.object.myparagraph.selector = "#section2"' allows for statemanagement
 *  6. separation of `this.text` (for JML) and `this.html` (for texture) is necessary (to not break JML/glb exports)
 */

elation.require(['janusweb.janusbase','janusweb.translators.paragraph.html-xml-rss'], function() {
  elation.component.add('engine.things.janusparagraph', function() {
    this.postinit = function() {
      elation.engine.things.janusparagraph.extendclass.postinit.call(this);
      this.defineProperties({
        text: {type: 'string', default: '', set: this.textToHTML },
        font_size: {type: 'integer', default: 16, set: this.updateTexture},
        text_col: {type: 'color', default: 0x000000, set: this.updateTexture},
        back_col: {type: 'color', default: 0xffffff, set: this.updateTexture},
        back_alpha: {type: 'float', default: 1, set: this.updateTexture},
        cull_face: { type: 'string', default: 'back', set: this.updateMaterial },
        css: {type: 'string', set: this.updateTexture },
        depth_write: { type: 'boolean', default: true },
        transparent: {type: 'boolean', set: this.updateTexture },
        depth_test: { type: 'boolean', default: true },
        collision_id: { type: 'string', default: 'cube' },
        collision_scale: { type: 'vector3', default: V(.5, .5, .02) },
        shadow: { type: 'boolean', default: true, set: this.updateMaterial },
        shadow_receive: { type: 'boolean', default: true, set: this.updateMaterial, comment: 'Receive shadows from self and other objects' },
        shadow_cast: { type: 'boolean', default: true, set: this.updateMaterial, comment: 'Cast shadows onto self and other objects' },
        url: { type: 'string', default: '', set: this.fetchSource },
        selector: { type: 'string', default: '', set: this.fetchSource },
        index: { type: 'integer', default: 0, set: this.updateHTML },
        cycle: {type: 'integer', default: 0, set: this.updateHTML },
        width: { type: 'integer', default: 1024 },  
        height: { type: 'integer', default: 1024 }, 
        ttl: { type: 'integer', default: 120000, comment: 'expire texture/html after ms (default:2 mins)' }, 
      });
    }

    this.paragraphs = [] // for cycle / partial purposes

    this.textToHTML = function(){
      // IMPORTANT: skip infinite loop  
      if( this.html == this.text ) return 
      if( this.text ){
        if( this.html ){ // reset stuff 
          this.url   = this.selector = '' 
          this.cycle = this.indexes = 0;
        }
        this.fetchSource() // expect 'selector' not being set here 
      }else{
        this.html = ''
        this.updateTexture()
      } 
    }

    this.createObject3D = function() {
      var material = this.createMaterial();
      var geo = new THREE.PlaneGeometry(2,2);
      geo.applyMatrix4(new THREE.Matrix4().makeTranslation(0,0,.1));
      var mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = this.shadow && this.shadow_cast;
      mesh.receiveShadow = this.shadow && this.shadow_receive;
     
      elation.events.add(this, 'click', () => {
        if( this.indexes ){
          this.index++
          this.cycle = 0 // disable
        }
      })

      return mesh;
    }
    this.createForces = function() {
      this.setCollider('box', { min: V(-.8, -.8, -.01), max: V(.8, .8, .01) });
      //this.collision_id = 'cube';
    }
    this.updateColliderFromGeometry = function() { }
    this.createMaterial = function() {
      var texture = this.createTexture();
      var sidemap = {
        'back':  THREE.FrontSide,
        'front': THREE.BackSide,
        'none':  THREE.DoubleSide
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
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.texture = new THREE.Texture(this.canvas);
      this.texture.encoding = THREE.sRGBEncoding;
      if( this.text ) this.updateTexture();
      return this.texture;
    }
    this.updateTexture = function() {
      if (!this.canvas || !this.texture) return;
      var ctx = this.canvas.getContext('2d'),
          texture = this.texture;
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      var text_col = '#' + this.text_col.getHexString(),
          back_col = 'rgba(' + (this.back_col.r * 255) + ', ' + (this.back_col.g * 255) + ', ' + (this.back_col.b * 255) + ', ' + this.back_alpha + ')';
      var basestyle = 'font-family: sans-serif;' +
                      'font-size: ' + this.font_size + 'px;' +
                      'box-sizing: border-box;'  +
                      'color: ' + text_col + ';' +
                      'background: ' + (this.transparent ? 'transparent' : back_col) + ';' +
                      `max-width: ${this.width}px;` +
                      'padding: 5px;';

      // We need to sanitize our HTML in case someone provides us with malformed markup.
      // We use SVG to render the mark-up, and since SVG is XML it means we need well-formed data
      // However, for whatever reason, <br> amd <hr> seem to break things, so we replace them with
      // styled divs instead.

      var sanitarydiv = document.createElement('div');
      sanitarydiv.innerHTML = this.html;
      var content = sanitarydiv.innerHTML.replace(/<br\s*\/?>/g, '<div class="br"></div>');
      content = content.replace(/<hr\s*\/?>/g, '<div class="hr"></div>');
      content = content.replace(/<img(.*?)>/g, "<img$1 />");

      var styletag = '<style>.paragraphcontainer { ' + basestyle + '} .br { height: 1em; } .hr { margin: .5em 0; border: 1px inset #ccc; height: 0px; }';
      styletag    += 'a { color:unset; text-decoration: none; }' // dont confuse users with nonclickable links



      // hybrid 2D/3D styling: apply styles from container HTML if any
      styletag += [ ...(new DOMParser)
                       .parseFromString(room.fullsource,"text/html")
                       .querySelectorAll("style[type=\"text/css\"]") 
                  ]
                  .map( (el) => el.innerText )
                  .join("\n")


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
        if (img === this.currentImage) {
          ctx.drawImage(img, 0, 0);
          texture.needsUpdate = true;
          this.refresh();
        }
      };
      this.currentImage = img;
      img.src = url;
      this.refresh();
      return texture;
    }
    this.updateMaterial = function() {
      if (this.objects['3d']) {
        this.objects['3d'].castShadow = this.shadow && this.shadow_cast;
        this.objects['3d'].receiveShadow = this.shadow && this.shadow_receive;
      }
    }
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janusparagraph.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          text:  [ 'property', 'text' ],
          css:  [ 'property', 'css' ],
          text_col:  [ 'property', 'text_col' ],
          back_col:  [ 'property', 'back_col' ],
          back_alpha:  [ 'property', 'back_alpha' ],
          cull_face: [ 'property', 'cull_face' ],
          depth_write: [ 'property', 'depth_write' ],
          depth_test: [ 'property', 'depth_test' ],
          collision_id: [ 'property', 'collision_id' ],
          collision_scale: [ 'property', 'collision_scale' ],
          shadow: [ 'property', 'shadow' ],
          shadow_receive: [ 'property', 'shadow_receive' ],
          shadow_cast: [ 'property', 'shadow_cast' ],
          url: [ 'property', 'url' ],
          selector: [ 'property', 'selector' ],
          index: ['property','index'],
          cycle: ['property','cycle'],
          width: ['property','width'],
          height: ['property','height'],
          ttl: ['property','ttl'],
        };
      }
      return this._proxyobject;
    }

    this.toInlineHTML = async function(){
      try{
        // find all img tags and capture src attributes
        const imgRegex = /<img[^>]*src=["'](?!data:)([^"']+)["']/gi;
        const matches = [];
        let match;
        while ((match = imgRegex.exec(this.html)) !== null) { // Collect all src values
          matches.push(match[1]);
        }
        // fill array with base64 image-strings
        const dataURLs = await Promise.all( matches.map(src => this.toDataURL(src)) );
        // Replace each src in the html with the corresponding data URL
        let updatedHtml = this.html;
        matches.forEach((src, i) => {
          updatedHtml = updatedHtml.replace( `src="${src}"`, `src="${dataURLs[i]}"`)
        });
        this.html = updatedHtml
      }catch(e){ console.error(e) } // continue when inlining failed
    };

    this.toDataURL = async function(url){
      const fullUrl  = this.room.getFullRoomURL(url)
      const finalUrl = this.room.isLocal( fullUrl) ? url : `${elation.engine.assets.corsproxy||''}${url}`
      return await this.useCache(url, async () => 
        await fetch(finalUrl)
        .then(response => response.blob())
        .then(blob => new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }))
      )
    }

    this.fetchSource = async function(){
      if( this.url && this.fetchSource.last == this.url ) return // avoid fake updates
      this.fetchSource.last = this.url || this.fetchSource.last

      let translator = {  // fallback translator for non-url content
        translate: async ()    => [this.html],
        fetch:     async (uri) => {
          if( String(this.text).match(/^data:text/) ){  // support text data-uri's
            return await window.fetch(this.text).then( (r) => r.text() )
          }
          return this.text || room.fullsource
        }
      }
      // allow (via event) other scripts to select different translator based on url 
      room.dispatchEvent({type:'paragraph_translator', detail:{ paragraph:this, translator }})
      this.html = await translator.fetch.call(this, this.url || ' ')
      await this.toInlineHTML()
      this.paragraphs  = await translator.translate.apply(this)
      await this.updateHTML()
    }

    this.useCache = async function(url, myFetch) {
      const cache = elation.janusweb.urlcache = elation.janusweb.urlcache || {}
      if (cache[url]) return cache[url];
      const data = cache[url] = await myFetch();
      setTimeout(() => delete cache[url], this.ttl); // default 2 mins TTL cleanup
      return data;
    },

    this.autoRotateIndex = function(){
      if( this.paragraphs.length > 1 ){
        if( this.cycle == 0 ){
          clearInterval(this.intervalId )
          this.intervalId = false
        }
        if( !this.intervalId && this.cycle ){
          this.intervalId = setInterval( () => {
            this.index = (this.index+1) % this.indexes 
            this.html = this.paragraphs[ this.index ]
          }, this.cycle )
        }
      }
    }

    this.updateHTML = async function(html){
      // skip uninited url content
      if( !this.html && this.url ) return 
      if( this.html ){ 
        this.indexes     = this.paragraphs.length > 1 ? this.paragraphs.length : 1
        this.html        = this.paragraphs[ this.index % this.indexes ]
        if( !this.html || this.htmlLast == this.html ) return // skip fake updates
        this.htmlLast = this.html
        this.autoRotateIndex()
        this.updateTexture()
      }
    }

  }, elation.engine.things.janusbase);
});
