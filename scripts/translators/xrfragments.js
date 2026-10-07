elation.require([], function() {
  elation.component.add('janusweb.translators.xrfragments', function() {
    this.init = function() {
      this.description = "this implements the https://xrfragment.org standard for immersive 3d file browsing"
      this.setupEvents()
    }

    this.JML = {
      single: (room,title,hrefNoHash) => `
        <title>${title}</title>
        <FireBoxRoom>
            <Assets>
              <assetobject id="scene" src="${hrefNoHash}"/>
            </Assets>
            <Room gravity="0">
              <object pos="0 0 0" collision_id="scene" id="scene" />
              <!-- helper to be able to walk/teleport in VR across majority of scenes -->
              <object id="plane" color_write="false" rotation="90 0 0" collision_id="plane" scale="100 100 1" collision_scale="100 100 1"/>
            </Room>
        </FireBoxRoom>
      `,

      collection: (room,title,entries) => `
        <title>${title}</title>
        <fireboxroom>
            <room gravity="0" use_local_asset="room_plane" pos='${entries.length/2} 0 -3'>
              <text pos="${entries.length/2} 6 0" rotation="0 180 0" col="#000000" scale="10 10 1" text="${title}" lighting="false"/>
              <text pos="${entries.length/2} 5.3 0" rotation="0 180 0" col="#888888" scale="10 10 1" text="${room.url}" lighting="false"/>
              ${this.JML.generatePortals(entries)}
            </room>
        </fireboxroom>
      `,

      generatePortals: function(entries){
        let JML = '' 
        let i = 0;
        entries.map( (portal) => {
          const href = portal.getAttribute('href')
          JML += `<link url='${href}' pos='${i} 0 0' shader_id='defaultportal' round="true" draw_glow="false" scale="1.5 3 1" rotation='0 180 0' title='${href.split('/').pop()}'/>`
          i+=1.7
        })
        return JML
      }
    }

    this.exec = function(args) {
      return new Promise(elation.bind(this, function(resolve, reject) {

        var room = this.room = args.room;

        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');

        var roomdata = {
          assets: {
            assetlist: [
              {assettype: 'model', name: 'scene', src: args.url},
            ]
          },
          room: {
            gravity: 0,
            pos: [0,0,0],
            xdir: "1 0 0",
            zdir: "0 0 1",
          },
          object: [
            {id: 'scene', js_id: "scene", pos: "0 0 0", xdir: "-1 0 0", zdir: "0 0 -1"},
            {id: 'plane', color_write: false, rotation: '90 0 0', collision_id: 'plane', scale:'100 100 1', collision_scale:'100 100 1' }
          ],
          link: []
        };
        resolve(roomdata);
      }));
    }

    this.spawnUserAtFragment = function(opts) {
      if( typeof room == 'undefined' || room.nested ) return // skip
      // explicit or default spawn
      // XR Fragments deeplink spec (Level1: URL) https://xrfragment.org/#teleport%20camera
      const spawnpoint = opts.data.spawnpoint
      const referrer   = opts.data.referrer
      console.log("[xrfragment] camera teleport")
      let obj = room.getObjectById("spawn") || room.getObjectByDeepName("spawn") // default
      if (room.urlhash) {
        const query = '?' + room.urlhash.replace('#','').replace(/pos=/,'') // backwards-compat: pos-names are deprecated
        new URLSearchParams( query ).forEach( (v,name) => {
          let found = room.getObjectById(name) || room.getObjectByDeepName(name)
          if( found ) obj = found
        })
      }
      if( obj ){
        obj.localToWorld(spawnpoint.position.set(0,0,0));
        if( obj.type == 'PerspectiveCamera' ){
          spawnpoint.position.y -= 1.6 // https://xrfragment.org/#teleport%20camera%20spawnpoint
        }
        spawnpoint.orientation.setFromRotationMatrix(obj.objects['3d'].matrixWorld.lookAt(spawnpoint.position, obj.localToWorld(V(0,0,-1)), obj.localToWorld(V(0,1,0).sub(spawnpoint.position))));
        // reposition reciprocal link to spawnpoint
        if( referrer ){
          this.repositionReciprocalLink(spawnpoint,referrer)
        }
        elation.events.fire({element: room, type: 'href', data: {href: room.urlhash || '#spawn' }});
      }
    }

    this.repositionReciprocalLink = function(spawnpoint,referrer){
      let links = room.getObjectsByTagName('link');
      if (links && links.length > 0) {
        links.forEach(link => {
          let url = room.getFullRoomURL(link.url);
          if (url == referrer) {
            link.position.copy(spawnpoint.position);
            link.position.add( V(0,0,-player.fatness) );
          }
        });
      }
    }

    this.setupEvents = function(){
      elation.events.add(null, 'spawnpoint',         this.spawnUserAtFragment.bind(this) )
      elation.events.add(null, 'room_load_complete', () => room.setPlayerPosition() )
    }

    // translate XR Fragments microformat into JML
    this.parseSource = async function(sourcecode, room){
      this.room = room
      const isJML = /<fireboxroom>[\s\S]*?<\/fireboxroom>/si;
      if( sourcecode.match(isJML) ) return // JML takes precedence over microformats 

      // extract href/title value
      let el = document.createElement("div")
      el.innerHTML = sourcecode
      let href     = false
      const titleEl  = el.querySelector("title")
      const title    = titleEl ? titleEl.innerText.replace(/\n.*/g,'') : room.baseurl.split("/").pop()

      const entry  = el.querySelector("link[as=spatial-entrypoint]")
      const portal = el.querySelector("link[as=spatial-portal]")
      if( entry  ){ href  = entry.getAttribute("href") }
      if( portal ){ href  = portal.getAttribute("href") }
      if( href ){
        console.log("[xrfragment] detected XRF microformat")
      }else return

      if( entry ){
        const hrefNoHash = href.replace(/#.*/,'')
        // if microformat has xr fragment in URI, use it if room-url has no xr fragment 
        if( href.match(/#/) && !room.urlhash ){
          room.urlhash = href.replace(/.*#/,'')
        }
        // check if link exists
        const hrefFull = hrefNoHash.match('://') ? hrefNoHash : String(room.baseurl+hrefNoHash)  
        const exist    = await fetch( hrefFull ,{method:'HEAD'})
        if( !exist.ok ) return console.warn(`[xrfragment] ${link.outerHTML} resolves to invalid url ${hrefFull}`)

        // return JML
        const JML = this.JML.single( room, title, hrefNoHash )
        return room.parseSource(JML)
      }

      if( portal ){
        const entries = [ ...el.querySelectorAll('link[as=spatial-portal]') ]
        // return JML
        const JML = this.JML.collection(room,title,entries)
        return room.parseSource(JML)
      }
    }
    // microformat heuristic (https://xrfragment.org/#XRF%20microformat)
    // example: <link rel="alternate" as="spatial-entrypoint" src="https://foo.org/bar.glb"> 
    this.parseSource.regex = /<link\s+[^>]*rel=['"]spatial-entrypoint['"][^>]*\/?>/si;

  });
});
