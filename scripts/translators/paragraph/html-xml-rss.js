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
      let source   = this.html.replace(/<\?.*\?>/g,"").trim()
      let selector = this.selector

      source = source.replace(/<([\/])?([a-zA-Z0-9_]+:)/gi,'<$1') // strip namespaces (<media:content> =>  <content> )

      const selectContent = (selector) => {
        if( selector && typeof this.index != 'undefined' ){
          const xmlDoc    = this.xmlDoc =  (new DOMParser()).parseFromString( source, "text/html")
          let paragraphs  = [ ...xmlDoc.querySelectorAll(selector) ] // KiSS JML: CSS selectors level 1
          if( !paragraphs.length ){
            console.error(`paragraph: level1 css selector '${selector}' not matching anything`)
          }
          let data = {
            items:  paragraphs.map( (p) => selector.match("description") || p.innerHTML.match(/&lt;/) ? p.textContent : p.innerHTML ),
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
          "item content",     // RSS2 (html)
          "entry content",    // atom (html)
          "item description", // RSS1 (textonly)
        ]
        fallbackSelectors.map( (selector) => {
          let sitems = selectContent(selector) 
          if( sitems.length ){
            items = sitems
          }
        })
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
