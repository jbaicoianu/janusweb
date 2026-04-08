// this translator converts the following url-output to HTML:
// * HTML
// * XML
// * RSS
//
// NOTE1: to not bloat the core-codebase please define custom translators 
//       in assetscripts or webui apps. Thank you.
//
// NOTE2: 'this' is basically a paragraph janus object 

(function(){

  let XMLTranslator = {
    fetch: async function(uri){
      const uriExFragment = String(uri).replace(/#.*/,'')
      const finalUrl = `${elation.engine.assets.corsproxy||''}${uriExFragment||''}`
      return await this.useCache( finalUrl, async () => 
        await fetch( finalUrl )
        .then( (res) => res.text() )
      )
    },
    translate: async function(){   // generic XML/RSS/HTML preprocessor [this.text to this.html]
      if( !this.html ) return [""]
      if( this.selector && typeof this.index != 'undefined' ){
        const type      = this.html.match(/<(rss|feed)/) ? "text/xml" : "text/html"
        const parser    = new DOMParser()
        const xmlDoc    = parser.parseFromString( this.html, type)
        let paragraphs  = [ ...xmlDoc.querySelectorAll(this.selector) ] // KiSS JML: CSS selectors level 1
        if( !paragraphs.length ){
          console.error(`paragraph: level1 css selector '${this.selector}' not matching anything`)
        }
        return paragraphs.map( (p) => type == 'text/xml' ? p.textContent : p.outerHTML )
      }
      return [this.html]
    }
  }

  elation.events.add(null, 'paragraph_translator', function(e){
    const {translator,paragraph} = e.detail
    // now you can override the default translator
    if( String(paragraph.url).match(/^http/) ){
      translator.fetch     = XMLTranslator.fetch 
    }
    translator.translate = XMLTranslator.translate // boldly always set ourselfs as default
  })

})();
