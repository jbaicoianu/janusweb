elation.require([], function() {
  elation.component.add('janusweb.translators.peertube', function() {
    this.init = function() {
      this.description = "peertube website to 3D translator"
    }
    this.exec = function(args) {
      return new Promise(elation.bind(this, function(resolve, reject) {

        var room = this.room = args.room;

        reject() // for now

        this.setupEvents()
        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');

        var roomdata = {
          assets: {
            assetlist: [
              // {assettype: 'model', name: 'scene', src: args.url},
            ]
          },
          room: {
            pos: [0,0,0],
            xdir: "1 0 0",
            zdir: "0 0 1",
          },
          object: [
            // {id: 'scene', js_id: 0, pos: "0 0 0", xdir: "-1 0 0", zdir: "0 0 -1", lighting: "false"}
          ],
          link: []
        };
        resolve(roomdata);
      }));
    }

    // translate XR Fragments microformat into JML
    this.parseSource = async function(sourcecode, room){
      this.room = room
      const isJML = /<fireboxroom>[\s\S]*?<\/fireboxroom>/si;
      const isPeertube         = /<meta\s+[^>]*property=['"]og:platform['"]\s+[^>]*content=['"]peertube['"][^>]*\/?>/si;
      const isPeertubeVideo    = /<meta\s+[^>]*property=['"]og:type['"]\s+[^>]*content=['"]video['"][^>]*\/?>/si;
      const isPeertubeInstance = /<meta\s+[^>]*property=['"]og:type['"]\s+[^>]*content=['"]website['"][^>]*\/?>/si;
      const is = {
        JML:              sourcecode.match(isJML),
        peertube:         sourcecode.match(isPeertube),
        peertubeVideo:    sourcecode.match(isPeertubeVideo),
        peertubeInstance: sourcecode.match(isPeertubeInstance),
      }
      if( is.JML || !is.peertube ) return // JML takes precedence over microformats 
      if( !is.peertubeVideo && !is.peertubeInstance ) return 
      
      // ok..peertube time: get domtree 
      let el = document.createElement("div")
      el.innerHTML = sourcecode

      // try to fetch title + cover
      const title = el.querySelector("title")
      let logo    = el.querySelector("meta[property='og:image']")?.getAttribute("content")
      logo        = logo ? logo : el.querySelector("meta[property='og:image:url']")?.getAttribute("content")

      let url      = new URL( String(room.url) )
      let instance = url?.origin
      let search   = url?.search ? new URLSearchParams(url.search).get("search") : ""

      // return JML
      return room.parseSource(`
        <title>${ title ? title.innerText.replace(/\n.*/g,'') : room.baseurl.split("/").pop() }</title>
        <FireBoxRoom>
            <Assets>
              ${ logo ? `<assetimage src="${logo}" id="logo"/>` : ''}
              <assetscript src="https://codeberg.org/coderofsalvation/janus-script-peertube/raw/branch/master/build/janus-script-peertube.js"/>
              <assetobject src="https://codeberg.org/coderofsalvation/janus-script-peertube/raw/branch/master/build/asset/button.glb" id="button"/>
              <assetobject src="https://codeberg.org/coderofsalvation/janus-script-peertube/raw/branch/master/build/asset/button.icon.glb"  id="icon"/>
              <assetsound  src="https://codeberg.org/coderofsalvation/janus-script-peertube/raw/branch/master/build/asset/button.click.mp3" id="button-click"/>
              <assetsound  src="https://codeberg.org/coderofsalvation/janus-script-peertube/raw/branch/master/build/asset/button.hover.mp3" id="button-hover"/>
            </Assets>
            <Room use_local_asset="room_2pedestal" pos="1.15 0 -5" rotation="0 1.5708 0" fwd="1 0 0">
              ${ is.peertubeInstance ? `<peertube-app pos="4.55 2.71 -4.7" scale="2 2 1" rotation="0 90 0" js_id="mypeertube-app" instance="${instance}" ${search?`search="${search}"`:``} autoload="true"/>`
                                     : `<peertube     pos="4.55 2.71 -4.7" scale="2 2 1" rotation="0 90 0" js_id="peertube" src="${room.url}" auto_play="true"/>` 
               }
              ${ logo ? `<image id="logo"/>` : ''}
            </Room>
        </FireBoxRoom>
      `)
    }
    // peertube microformat heuristic: <meta property="og:platform" content="PeerTube">
    this.parseSource.regex = /<meta\s+[^>]*property=['"]og:platform['"]\s+[^>]*content=['"]peertube['"][^>]*\/?>/si;
  });
});
