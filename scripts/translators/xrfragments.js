elation.require([], function() {
  elation.component.add('janusweb.translators.xrfragments', function() {
    this.init = function() {
      this.description = "this implements the https://xrfragment.org standard for immersive 3d file browsing"
    }
    this.exec = function(args) {
      return new Promise(elation.bind(this, function(resolve, reject) {

        var room = this.room = args.room;
        this.setupEvents()

        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');

        var roomdata = {
          assets: {
            assetlist: [
              {assettype: 'model', name: 'scene', src: args.url},
            ]
          },
          room: {
            pos: [0,0,0],
            xdir: "1 0 0",
            zdir: "0 0 1",
          },
          object: [
            {id: 'scene', js_id: 0, pos: "0 0 0", xdir: "-1 0 0", zdir: "0 0 -1", lighting: "false"}
          ],
          link: []
        };
        resolve(roomdata);
      }));
    }

    this.spawnUserAtFragment = function(source) {
      // XR Fragments deeplink spec: explicit or default spawn
      // https://xrfragment.org/#teleport%20camera
      if( ! this.room.urlhash ) this.room.urlhash = 'spawn'
      this.room.setPlayerPosition.apply(this.room)
      console.log("[xrfragment] camera teleport")
    }

    this.setupEvents = function(){
      elation.events.add(room._room, 'room_load_complete', this.spawnUserAtFragment.bind(this) )
    }

    // translate XR Fragments microformat into JML
    this.parseSource = async function(sourcecode, room){
      this.room = room
      const isJML = /<fireboxroom>[\s\S]*?<\/fireboxroom>/si;
      if( sourcecode.match(isJML) ) return // JML takes precedence over microformats 

      // extract href/title value
      let el = document.createElement("div")
      el.innerHTML = sourcecode
      const link = el.querySelector("link[as=spatial-entrypoint]")
      if( !link ) return
      const title = el.querySelector("title")
      const href  = link.getAttribute("href")
      if( !href ) return
      console.log("[xrfragment] detected XRF microformat")
      const hrefNoHash = href.replace(/#.*/,'')

      // if microformat has xr fragment in URI, use it if room-url has no xr fragment 
      if( href.match(/#/) && !room.urlhash ){
        room.urlhash = href.replace(/.*#/,'')
      }
      // check if link exists
      const hrefFull = hrefNoHash.match('://') ? hrefNoHash : String(room.baseurl+hrefNoHash)  
      const exist    = await fetch( hrefFull ,{method:'HEAD'})
      if( !exist.ok ) return console.warn(`[xrfragment] ${link.outerHTML} resolves to invalid url ${hrefFull}`)

      // setup events
      this.setupEvents()
      // return JML
      return room.parseSource(`
        <title>${ title ? title.innerText.replace(/\n.*/g,'') : room.baseurl.split("/").pop() }</title>
        <FireBoxRoom>
            <Assets>
              <assetobject id="scene" src="${hrefNoHash}"/>
            </Assets>
            <Room>
              <object pos="0 0 0" collision_id="scene" id="scene" />
            </Room>
        </FireBoxRoom>
      `)
    }
    // microformat heuristic (https://xrfragment.org/#XRF%20microformat)
    // example: <link rel="alternate" as="spatial-entrypoint" src="https://foo.org/bar.glb"> 
    this.parseSource.regex = /<link\s+[^>]*rel=['"]spatial-entrypoint['"][^>]*\/?>/si;

  });
});

