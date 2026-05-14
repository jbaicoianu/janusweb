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
      let finalUrl = `${uriExFragment||''}`
      if( this.use_proxy && elation.engine.assets.corsproxy ){
        finalUrl = elation.engine.assets.corsproxy + finalUrl
      }
      return await this.useCache( finalUrl, async () => 
        await fetch( finalUrl )
        .then( (res) => res.text() )
      )
    },
    translate: async function(){   // generic XML/RSS/HTML preprocessor [this.text to this.html]
      if( !this.html ) return [""]
      let source = this.html
      .replace(/<\?.*\?>/g,"")
      .trim()

      let selector = this.selector

      const selectContent = (selector) => {
        if( selector && typeof this.index != 'undefined' ){
          const xmlDoc    = this.xmlDoc =  (new DOMParser()).parseFromString( source, "text/xml")
          let paragraphs  = [ ...xmlDoc.querySelectorAll(selector) ] // KiSS JML: CSS selectors level 1
          if( !paragraphs.length ){
            console.error(`paragraph: level1 css selector '${selector}' not matching anything`)
          }
          let data = {
            items:  paragraphs.map( (p) => p.textContent ),
            paragraph: this
          }
          // dont exceed maxitems
          data.items = data.items.slice( 
            this.maxindex > 0 ? 0             : this.maxindex*-1,  
            this.maxindex > 0 ? this.maxindex : null 
          )
          return data.items 
        }
        return []
      }
      // lets do it!
      let items = [this.html]
      if( selector ) items = selectContent(selector)

      if( !selector && source.match(/^<(feed|rss)[ >]/) ){
        let fallbackSelectors = [
          // --- RSS 2.0 & RSS 1.0 (Namespaced Content) ---
          "item content\\:encoded",    // Standard RSS 2.0 with Namespaces (wordpress)
          "item encoded\\:content",    // Common browser "cleanup" of content:encoded
          // --- Atom (Standard) ---
          "entry content",             // Standard Atom
          "entry summary",             // Atom fallback if full content isn't provided
          // --- RSS 2.0 (Standard & Fallbacks) ---
          "item description",          // Standard RSS 2.0 (often contains HTML)
          "item fulltext",             // Used by some custom RSS generators
          // --- RSS 1.0 (Legacy/Specific) ---
          "item description",          // Standard for RSS 1.0
        ]
        while( fallbackSelectors.length ){
          const selector = fallbackSelectors.shift()
          let sitems = selectContent(selector) 
          if( sitems.length && sitems[0] ){
            items = sitems
            break;
          }
        }
      }
      return items 
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
