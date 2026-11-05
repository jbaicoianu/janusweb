elation.require([], function() {
  elation.component.add('janusweb.translators.xrfragments', function() {
    this.init = function() {
      this.description = "this implements the https://xrfragment.org standard for immersive 3d file browsing"
    }

    this.initTranslator = async function(opts){
      if( this.inited ) return
      this.inited = true
      // we fetch these functions to keep the core slim/fast, and allow easy hotfixes 
      // by keeping the translator-functions editable/overrideable via the filesystem
      let datapath  = elation.config.get('janusweb.datapath', '/media/janusweb')
      translatorURL = 'assets/translator/xrfragment/translator.js'
      const translator = this.translator = await import(datapath + translatorURL)
      this.JML  = translator.getTemplates()
      this.util = translator.util
      translator.init(elation,opts)
    }

    this.exec = async function(opts){
      await this.initTranslator(opts)
      return this.translator.exec.apply(this,arguments)
    }

    // translate XR Fragments microformat into JML
    this.parseSource = async function(sourcecode, room){
      await this.initTranslator()
      return this.translator.parseSource(sourcecode,room)
    }
    // microformat heuristic (https://xrfragment.org/#XRF%20microformat)
    // example: <link rel="alternate" as="spatial-entrypoint" src="https://foo.org/bar.glb"> 
    this.parseSource.regex = /<link\s+[^>]*rel=['"]spatial-entrypoint['"][^>]*\/?>/si;

  });
});
