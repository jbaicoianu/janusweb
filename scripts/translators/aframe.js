/*
 * Basic AFRAME geometry translator
 * 
 * tested with urls:
 *   1. https://aframe.io/aframe/examples/boilerplate/hello-world/
 *   2. https://aframe.io/aframe/examples/boilerplate/3d-model/                    
 * 
 *
 * Obviously, full AFRAME compatibility is not on the menu here, but still usable for simple geometry scenes.
 * geometry tags:     <a-box> <a-torus> and so on
 * model/asset tags:  <a-gltf-model> <a-asset-item id="tree"> 
 * entity tags:       <a-entity gltf-model="#tree"> e.g.
 *
 * *FUTURE*: textures:       https://aframe.io/aframe/examples/docs/basic-scene/
 *           2d shapes from: ttps://aframe.io/aframe/examples/test/geometry/
 *
 * Anyhow, assetscripts can translate aframe elements/attributes further via events:
 *
 * room.addEventListener('aframe_element', (e) => {
 *   const {scene,el,translator} = e.data 
 *   // el = <a-entity material="color:#FFF; sides: front"/>
 *   // let attrs = translator.parse( el.getAttribute("material") ) // {color:#FFF}
 * })
 */
elation.require([], function() {
  elation.component.add('janusweb.translators.aframe', function() {
    this.init = function() {
      this.description = "naive converter of AFRAME scenes"
    }
    this.exec = function(args) {
      // AFRAME does not have urls
    }

    this.transformTo = (oldTag,newTag,id) => (el,assets) => {
       if( id ) el.setAttribute("id", id)
       this.transformAttributes(el,oldTag,newTag,id)
       el.outerHTML = el.outerHTML.replace( new RegExp(oldTag,"g"), newTag )
    }

    this.transformTo = (oldTag, newTag, id) => (el, assets) => {
      const replacement = document.createElement(newTag);
      if (id) { replacement.id = id; }
      Array.from(el.attributes).forEach(attr => {
          if (attr.name !== 'id' || !id) {
              replacement.setAttribute(attr.name, attr.value);
          }
      });
      this.transformAttributes(replacement, oldTag, newTag, id);
      while (el.firstChild) { replacement.appendChild(el.firstChild); }
      el.parentNode.replaceChild(replacement, el);
    };

    this.transform = {
      // 3d geometries
      "a-box":            this.transformTo("a-box","object","cube"),
      "a-octahedron":     this.transformTo("a-octahedron","object","cube"),     // *NAIVE*
      "a-sphere":         this.transformTo("a-sphere","object","sphere"),
      "a-cylinder":       this.transformTo("a-cylinder","object","cylinder"),
      "a-plane":          this.transformTo("a-plane","object","plane"),
      "a-torus":          this.transformTo("a-torus","object","torus"),
      "a-text":           this.transformTo("a-text","text"),
      // 2d geometries    
      "a-triangle":       this.transformTo("a-triangle","object","pyramid"),    // *NAIVE*
      "a-circle":         this.transformTo("a-circle","object","sphere"),
      "a-cone":           this.transformTo("a-cone","object","cone"),
      "a-ring":           this.transformTo("a-ring","object","torus"),

      // assets
      "img"               : (el,assets,room) => {
                            assets.push(`<assetimage id="${el.getAttribute("id")}"
                                                    src="${el.getAttribute("src")}"/>`)
                          },
      "a-asset-item"      : (el,assets,room) => {
                            let src = el.getAttribute("src")
                            assets.push(`<assetobject id="${el.getAttribute("id")}" 
                                                     src="${src}"/>`)
                          },

      // scene
      "a-scene":          (el,assets,room) => {
                            if( el.getAttribute("background") ){
                              let background = this.parse(this.getAndRemoveAttribute(el,"background"))
                              if( background.color ) el.setAttribute("col",background.color)
                            }
                            el.outerHTML = el.outerHTML.replace(/a-scene/g,'room')
                          },

      "a-gltf-model":     (el,assets,room) => {
                            let src = this.getAndRemoveAttribute(el,"src") 
                            src     = this.getFullURL(src,room)
                            if( src[0] == '#' ) { // reference to asset
                              el.setAttribute("_id", src.substr(1) ) // *WEIRD* id is immutable!
                            }
                            this.transformTo("a-gltf-model", "object" )(el,assets)
                          },

      "a-entity":         (el,assets,room) => {
                            let id, geometry, scale 
                            let oldTag = "a-entity"
                            for (var i = 0; i < el.attributes.length; i++) {
                              var attrib = el.attributes[i];
                              if (attrib.specified) {
                                let opts = this.parse( attrib.value ) //this.getAndRemoveAttribute(el, attrib.name ) )
                                switch( attrib.name ){

                                  case "scale": scale = attrib.value.split(" "); break;

                                  case "gltf-model-asset":  {
                                    id = attrib.value[0] == '#' ? attrib.value.substr(1) : this.getFullURL(attrib.value,room); 
                                    el.setAttribute("_id", id ) // since id-attr is immutable
                                    el.removeAttribute("id")    // _id is renamed later to id
                                    break;
                                  }

                                  case "geometry":{
                                    oldTag = `a-${opts.primitive}`
                                    el.setAttribute("_id", geometry = opts.primitive ) // since id-attr is immutable
                                    el.removeAttribute("id")                           // _id is renamed later to id
                                    break;
                                  }
                                }
                              }
                            }
                            this.transformTo(oldTag, "object" )(el,assets,id)
                          },

    }


    // translate XR Fragments microformat into JML
    this.parseSource = async function(sourcecode, room){
      this.room = room
      const isJML = /<fireboxroom>[\s\S]*?<\/fireboxroom>/si;
      if( sourcecode.match(isJML) ) return // JML takes precedence over microformats 

      // extract href/title value
      let el = document.createElement("div")
      el.innerHTML = sourcecode
      const scene = el.querySelector("a-scene")
      if( !scene ) return // not AFRAME

      // set title
      const title = el.querySelector("title")

      // convert! 
      let assets = []
      Object.keys(this.transform).forEach(oldTag => {
        const elements = el.querySelectorAll(oldTag);
        elements.forEach( (el) => {
          this.transform[oldTag](el,assets,room)
          room.dispatchEvent({type:'aframe_element', detail:{ scene, el, translator:this }})
        })
      });
      // cleanup
      if( el.querySelector('a-assets') ) el.querySelector("a-assets").remove()

      // we have to replace '_id=' with 'id=' to circumvent id immutability 
      const roomJML = el.querySelector('room')
                        .outerHTML
                        .replace(/id="object"/g,'')
                        .replace(/_id=/g,'id=')

      // return JML
      let JML = `
        <title>${ title ? title.innerText.replace(/\n.*/g,'') : room.baseurl.split("/").pop() }</title>
        <FireBoxRoom>
            <assets>
              ${assets.join("\n")}
            </assets>
            ${roomJML}
        </FireBoxRoom>
      `
      console.log(JML)
      return room.parseSource(JML)
    }
    // microformat heuristic (https://fragment.org/#XRF%20microformat)
    this.parseSource.regex = /<a-scene/si;

    this.transformAttributes = function(el,oldTag,newTag,id){
      let scale = [1,1,1]
      let pos   = [0,0,0]
      let mapping = {
        "color":"col"
      }
      for( let attr_aframe in mapping ){
        let attr_janus = mapping[attr_aframe]
        if( el.getAttribute(attr_aframe) ){
          el.setAttribute( attr_janus, el.getAttribute( attr_aframe) )
          el.removeAttribute(attr_aframe)
        }
      }
      if( el.getAttribute("position") ){
        pos = this.getAndRemoveAttribute(el,"position")
                  .split(" ")
                  .map( (str) => parseFloat(str) )
      }
      if( el.getAttribute("scale") ){
        scale = el.getAttribute("scale")
                  .split(" ")
                  .map( (str) => parseFloat(str) )
      }
      if( el.getAttribute("radius") ){ 
        let val = this.getAndRemoveAttribute(el,"radius") 
        scale = [ val, val, val ]
      }
      if( el.getAttribute("radius-bottom") ){ 
        let val = this.getAndRemoveAttribute(el,"radius-bottom") 
        scale = [ val, val, val ]
      }
      if( el.getAttribute("width")  ) scale[0] = this.getAndRemoveAttribute(el,"width") 
      if( el.getAttribute("height") ) scale[1] = this.getAndRemoveAttribute(el,"height") 
      if( el.getAttribute("depth")  ) scale[2] = this.getAndRemoveAttribute(el,"depth") 
      this.transformGeometry(oldTag,scale,pos)
      el.setAttribute("scale", scale.join(" ") )
      el.setAttribute("pos",   pos.join(" ") )
    }

    this.getAndRemoveAttribute = (el,attr) => {
      let val = el.getAttribute(attr)
      el.removeAttribute(attr)
      return val
    }

    this.transformGeometry = function(oldTag,scale,pos){
      // these geometries dont have their origin in the center
      switch( oldTag ){

        case "a-torusknot":
        case "a-torus":     scale[0] *= 2; scale[1] *= 2; scale[2] *= 2; pos[1] -= scale[1]/2; break;
        case "a-cylinder":  scale[0] *= 2; scale[2] *= 2; pos[1] -= scale[1]/2; break;
        case "a-sphere":    scale[0] *= 2; scale[1] *= 2; scale[2] *= 2; break;

        case "a-ring":
        case "a-circle":    scale[0] *= 2; scale[1] *= 2; scale[2]  = 0.00001; break;

      }
    }

    /* 
     * AFRAME styleparser 
     * from https://github.com/aframevr/aframe/blob/v1.7.0/src/utils/styleParser.js
     */
    this.parse = function(value, obj){

      function upperCase (str) { return str[1].toUpperCase(); }
      function toCamelCase (str) {
        return str.replace(/-([a-z])/g, upperCase);
      }

      /**
       * Split a string into chunks matching `<key>: <value>`
       */
      var getKeyValueChunks = (function () {
        var chunks = [];
        var hasUnclosedUrl = /url\([^)]+$/;

        return function getKeyValueChunks (raw) {
          var chunk = '';
          var nextSplit;
          var offset = 0;
          var sep = ';';

          chunks.length = 0;

          while (offset < raw.length) {
            nextSplit = raw.indexOf(sep, offset);
            if (nextSplit === -1) { nextSplit = raw.length; }

            chunk += raw.substring(offset, nextSplit);

            // data URIs can contain semicolons, so make sure we get the whole thing
            if (hasUnclosedUrl.test(chunk)) {
              chunk += ';';
              offset = nextSplit + 1;
              continue;
            }

            chunks.push(chunk.trim());
            chunk = '';
            offset = nextSplit + 1;
          }

          return chunks;
        };
      })();

      function styleParse (str, obj) {
        var chunks;
        var i;
        var item;
        var pos;
        var key;
        var val;

        obj = obj || {};

        chunks = getKeyValueChunks(str);
        for (i = 0; i < chunks.length; i++) {
          item = chunks[i];
          if (!item) { continue; }
          // Split with `.indexOf` rather than `.split` because the value may also contain colons.
          pos = item.indexOf(':');
          key = item.substr(0, pos).trim();
          val = item.substr(pos + 1).trim();
          obj[toCamelCase(key)] = val;
        }
        return obj;
      }
      var parsedData;
      if (typeof value !== 'string') { return value; }
      parsedData = styleParse(value, obj);
      // The style parser returns an object { "" : "test"} when fed a string
      if (parsedData['']) { return value; }
      return parsedData;
    }

    this.getFullURL = function(src,room){
      let origin = room.baseurl.replace(/([a-z])\/([a-z]).*/,'$1')
      if( src.match(/^\.\//)   ) src = room.baseurl + src.substr(2) // './foo' 
      if( src.match(/^\.\./)   ) src = room.baseurl + src           // '../../foo'
      if( src[0] == '/'        ) src = origin + src
      if( !src.match("://")    ) src = room.baseurl + src
      return src
    }

  });
});
