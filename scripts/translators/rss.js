/*
 * RSS room translator 
 * (this indirectly uses the paragraph-translators at scripts/translators/paragraph/html-xml-rss.js)
 *
 * this translator gets triggered in 3 ways:
 *   1. when an URL ends with .xml/.rss/.atom (scripts/room.js)
 *   2. when sourcecode starts with <feed> or <rss> (parseSource.regex)
 *   3. when sourcecode has rss/atom <link rel="alternate"> (parseSource.regexAlternate)
 */
elation.require([], function() {
  elation.component.add('janusweb.translators.rss', function() {
    this.init = function() {
      this.description = "this translates rss.app compatible websites to a room with RSS <paragraph> elements"
      elation.events.add(null, 'paragraph_translator_translate', (e) => this.onParagraph(e) )
      elation.events.add(null, 'paragraph_index_update', (e) => this.onIndexUpdate(e) )
    }

    this.template = async function(opts){
      if( !this.css ){
        // grab styles from media/assets/webui/rss/rss.css 
        await fetch('./media/assets/translator/rss/style.css')
        .then( (res) => res.text() )
        .then( (css) => this.css = String(css).split("\n").join(" ") )
      }
      opts.css    = this.css
      opts.random = this.getRandom(3)
      elation.events.fire({element: this, type: 'room_translate_rss', data: opts });
      const html =  `
        <title>${opts.title||""}</title>
        <FireBoxRoom>
            <Assets>
              ${ opts.website ? `<assetwebsurface id="website" src="${opts.website}" width="1024" height="768" />` : ""}
            </Assets>
            <room use_local_asset="room_plane" pos="0 0 1" fwd="0 0 -1.6">
              <object>
                <object collision_id="room1_collision" shadows="true" id="room3" pos="0 -4.68 0"/>

                ${ opts.website ? `<object id="plane" websurface_id="website" js_id="website" pos="-3.42 1.28 -0.8" rotation="0 35 0" scale="4.5 2.53 1.000000" lighting="false"></object>` : ""}
                <paragraph js_id="rss" url="${opts.url}" lighting="false" width="1024" height="768" pos="1.71 2.03 -2.31" css="${opts.css}" cull_face="none" use_proxy="true" cycle="5000" scale="3 2 1"></paragraph>
                <object js_id="rssmedia" pos="7.72 2 0.531" rotation="0 -42.5 0" scale="4 4 1" collision_id="plane" id="plane" lighting="false" visible="false"/>

                <!-- decorations -->
                <object pos="6 9.9 -3.3" scale="1.5 1.5 1" rotation="0 -25 0">
                  <paragraph transparent="true" cull_face="none" lighting="false">
                    <![CDATA[
                      <img width="100%" src="data:image/svg+xml,%3C?xml version='1.0' encoding='UTF-8'?%3E %3Csvg xmlns='http://www.w3.org/2000/svg' id='RSSicon' viewBox='0 0 8 8' width='256' height='256'%3E %3Ctitle%3ERSS feed icon%3C/title%3E %3Cstyle type='text/css'%3E .button %7Bstroke: none; fill: orange;%7D .symbol %7Bstroke: none; fill: white;%7D %3C/style%3E %3Crect   class='button' width='8' height='8' rx='1.5' /%3E %3Ccircle class='symbol' cx='2' cy='6' r='1' /%3E %3Cpath   class='symbol' d='m 1,4 a 3,3 0 0 1 3,3 h 1 a 4,4 0 0 0 -4,-4 z' /%3E %3Cpath   class='symbol' d='m 1,2 a 5,5 0 0 1 5,5 h 1 a 6,6 0 0 0 -6,-6 z' /%3E %3C/svg%3E"/>
                    ]]>
                  </paragraph>

                  <text text="${opts.url}" position="0 -1.35 0" scale="5 5 5" col="0 0 0" lighting="false"/>
                </object>
                <paragraph js_id="rssdeco" transparent="true" lighting="false" pos="7.84 0.9 0.56" rotation="0 -45 0" scale="3 3 1">
                  <![CDATA[
                    <img width="100%" src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%3Csvg%20%20%20version%3D%221.1%22%20%20%20width%3D%22814.00128%22%20%20%20height%3D%22470.03043%22%20%20%20viewBox%3D%22-370%20-240%20430.2578%20376.02435%22%20%20%20id%3D%22svg20%22%20%20%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%20%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%20%20%20%20%20id%3D%22defs20%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-425.48469%2C-128.44191%20c%2060%2C-120%2040%2C240%20-20%2C240%20-60%2C0%20-40%2C-119.9999952%2020%2C-240%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23ff0000%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path1%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-394.95869%2C-114.75791%20c%2061.053%2C-111.579%2025.263%2C212.632005%20-28.421%2C208.421005%20-53.684%2C-4.21%20-32.631%2C-96.8420002%2028.421%2C-208.421005%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23f2000d%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path2%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-364.43169%2C-101.07391%20c%2062.105%2C-103.157%2010.526%2C185.264005%20-36.842%2C176.843005%20-47.369%2C-8.422%20-25.264%2C-73.6850002%2036.842%2C-176.843005%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23e4001b%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path3%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-333.90569%2C-87.388905%20c%2063.158%2C-94.737005%20-4.211%2C157.894%20-45.263%2C145.263%20-41.053%2C-12.632%20-17.895%2C-50.5270002%2045.263%2C-145.263%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23d70028%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path4%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-303.37969%2C-73.704905%20c%2064.211%2C-86.316005%20-18.947%2C130.526%20-53.684%2C113.684%20-34.737%2C-16.842%20-10.526%2C-27.368%2053.684%2C-113.684%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23c90036%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path5%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-272.85269%2C-60.020905%20c%2065.263%2C-77.895005%20-33.685%2C103.158%20-62.106%2C82.105%20-28.421%2C-21.0520001%20-3.158%2C-4.21%2062.106%2C-82.105%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23bc0043%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path6%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-242.32669%2C-46.336905%20c%2066.316%2C-69.473005%20-48.421%2C75.79%20-70.526%2C50.5269998%20-22.106%2C-25.2639998%204.21%2C18.9470002%2070.526%2C-50.5269998%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23ae0051%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path7%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-211.80069%2C-32.652905%20c%2067.369%2C-61.052%20-63.158%2C48.422%20-78.947%2C18.948%20-15.79%2C-29.474%2011.579%2C42.105%2078.947%2C-18.948%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23a1005e%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path8%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-181.27369%2C-18.967905%20c%2068.421%2C-52.632%20-77.895%2C21.0519998%20-87.369%2C-12.632%20-9.474%2C-33.684%2018.947%2C65.263%2087.369%2C12.632%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%2394006b%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path9%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-150.74769%2C-5.2839052%20c%2069.474005%2C-44.2109998%20-92.632%2C-6.3159998%20-95.79%2C-44.2109998%20-3.158%2C-37.894%2026.316%2C88.421%2095.79%2C44.2109998%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23860079%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path10%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-120.22169%2C8.4000948%20c%2070.526005%2C-35.7889998%20-107.368%2C-33.6839998%20-104.21%2C-75.7889998%203.158%2C-42.106005%2033.684%2C111.579%20104.21%2C75.7889998%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%23790086%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path11%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-89.695685%2C22.084095%20c%2071.579%2C-27.3680002%20-122.105005%2C-61.052%20-112.631005%2C-107.368%209.474%2C-46.316005%2041.053%2C134.737%20112.631005%2C107.368%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%236b0094%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path12%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-59.168685%2C35.769095%20c%2072.631%2C-18.948%20-136.842005%2C-88.422%20-121.053005%2C-138.948005%2015.79%2C-50.526%2048.421%2C157.895005%20121.053005%2C138.948005%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%235e00a1%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path13%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20-28.642685%2C49.453095%20c%2073.684%2C-10.527%20-151.579005%2C-115.79%20-129.474005%2C-170.527005%2022.106%2C-54.736%2055.79%2C181.053005%20129.474005%2C170.527005%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%235100ae%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path14%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%201.8833142%2C63.137095%20c%2074.7370008%2C-2.105%20-166.3150042%2C-143.158%20-137.8940042%2C-202.105005%2028.421%2C-58.948%2063.158005%2C204.210005%20137.8940042%2C202.105005%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%234300bc%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path15%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%2032.410315%2C76.821095%20c%2075.788995%2C6.316%20-181.053005%2C-170.526%20-146.316005%2C-233.684005%2034.737005%2C-63.158%2070.526005%2C227.368005%20146.316005%2C233.684005%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%233600c9%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path16%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%2062.936315%2C90.505095%20c%2076.841995%2C14.736995%20-195.789005%2C-197.894005%20-154.737%2C-265.263005%2041.053%2C-67.368%2077.895%2C250.527005%20154.737%2C265.263005%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%232800d7%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path17%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%2093.462312%2C104.19009%20c%2077.894998%2C23.157%20-210.526002%2C-225.264%20-163.157997%2C-296.843%2047.369%2C-71.578%2085.264%2C273.685005%20163.157997%2C296.843%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%231b00e4%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path18%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20123.98931%2C117.87409%20c%2078.947%2C31.579%20-225.263%2C-252.632%20-171.578995%2C-328.421%2053.6839988%2C-75.79%2092.631%2C296.842005%20171.578995%2C328.421%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%230d00f2%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path19%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3Cpath%20%20%20%20%20d%3D%22m%20154.51531%2C131.55809%20c%2080%2C40%20-239.999995%2C-280%20-179.999995%2C-360%2060%2C-80%20100%2C320.000005%20179.999995%2C360%20z%22%20%20%20%20%20fill%3D%22none%22%20%20%20%20%20stroke%3D%22%230000ff%22%20%20%20%20%20stroke-width%3D%221%22%20%20%20%20%20id%3D%22path20%22%20%20%20%20%20style%3D%22stroke-width%3A2.04%3Bstroke-dasharray%3Anone%22%20%2F%3E%3C%2Fsvg%3E"/>
                  ]]>
                </paragraph>
                <object js_id="janusobject_cube_7" jsid="janusobject_cube_7" pos="8 2 0" rotation="0 -43.65 0" scale="8 4.5 1" col="0.8706 0.8667 0.8549" pickable="false" id="cube" emissive="0 0 0"  roughness="0.1" metalness="0.5"/>
                <object js_id="janusobject_cube_8" jsid="janusobject_cube_8" pos="1.71 2 -2.77" scale="6.7 4.5 1" pickable="false" id="cube" emissive="0 0 0"  roughness="0.1" metalness="0.5"/>

                ${ opts.random  == 0 ? `<object pos="5.2 -9.3 -1.97" scale="30 30 30" collision_id="torus" id="torus" roughness="0.1" metalness="0.5"/>` : ''}
                ${ opts.random  == 1 ? `<object pos="0 33 0" scale="50 50 50" sync="true" collision_id="pyramid" id="pyramid" roughness="0.1" metalness="0.5" /> `: '' }
                ${ opts.random  == 2 ? `<object pos="-3 0.5 -6.11" scale="4 6 1" collision_id="capsule" id="capsule" roughness="0.1" metalness="0.5"  />
                                        <object pos="0 0.5 -6.11" scale="4 8 1" collision_id="capsule" id="capsule" roughness="0.2" metalness="0.5"  />
                                        <object pos="3 0.5 -6.11" scale="4 10 1" collision_id="capsule" id="capsule" roughness="0.3" metalness="0.5"   />` :''}


                <text text="" js_id="rsspage" position="1.67 4.7 -2.33" scale="2 2 2" col="0.3 0.3 0.3" lighting="false"/>
              </object>

            </room>
        </FireBoxRoom>`
      return html
    }

    // URL translator
    this.exec = function(args) {
      return new Promise(elation.bind(this, async function(resolve, reject) {
        var room = this.room = args.room;
        var datapath = elation.config.get('janusweb.datapath', '/media/janusweb');
        let opts  = room.paragraphOptions = {url: room.url,room}
        const jml = await this.template(opts)
        try{
          let roomdata = room.janus.parser.parse( room.parseSource( jml ).source, room.baseurl, datapath )
          resolve(roomdata);
        }catch(e){ reject(e) }
      }));
    }

    // source translator
    this.parseSource = async function(sourcecode, room){
      if( !sourcecode.match( this.parseSource.regexAlternate) && 
          !sourcecode.match( this.parseSource.regex)){
        return 
      }
      this.room = room
      let opts = {
        url: room.url,
        title: room.url
      }
      try{
        // check alternate rss/atom content if any 
        let el = window.el = (new DOMParser).parseFromString(sourcecode,"text/html") 
        const title        = el.querySelector('title')
        let link           = el.querySelector('link[rel="alternate"][type="application/atom+xml"]')
        if( !link ) link   = el.querySelector('link[rel="alternate"][type="application/rss+xml"]')
        if( link ){
          let url = link.getAttribute("href")
          if( url.match(/^(\/|\.\/)/) ) url = room.url + url.replace(/.*?\//,'')
          opts.url = url 
          if( title.textContent ) opts.title = title.textContent 
        }
        const jml = await this.template(opts)
        return room.parseSource( jml )

      }catch(e){ console.error(e) }
    }

    this.getRandom = (max) => ( Math.round(Math.random() * 1000)) % max

    this.parseSource.regex = /<rss|feed(?:\s+[^>]*|)>/si;  // match atom/RSS content
    this.parseSource.regexAlternate = /<link [^>]*(atom\+xml|rss\+xml)[^>]*>/;  // permissive match atom/RSS alternate links


    this.getPageInfo = function(paragraph){
      let opts = {room}
      if( paragraph.xmlDoc ){
        const xmlDoc = paragraph.xmlDoc
        if( xmlDoc.querySelectorAll("channel > title").length ){
          opts.title = room.title = xmlDoc.querySelectorAll("channel > title")[0].textContent
        }
      }
      return opts
    }

    // here we are extending scripts/translators/paragraph/html-xml-rss.js
    this.onParagraph = function(e){
      const {paragraph} = e.data
      if( !paragraph.xmlDoc ) return // only for rss 
      // patch HTML items
      let index = 1;
      let opts  = this.getPageInfo(paragraph)
      paragraph.paragraphs = paragraph.paragraphs.map( (item) => 
        item.match('id="next"') ? item : 
          `<div id="next">${index++}</div>
            ${ opts.avatar   ? `<img class="inline" src='${opts.avatar}' width="200" height="200"/>` : ""}
            ${opts.author    ? `${opts.author}<br>` : ""}
            ${opts.title     ? `<h3>${opts.title}</h3>` : ""}
            ${opts.room?.url ? `<small>${opts.room.url.replace(/.*:\/\//,'')}</small><br>` : ""}
            <br>
            ${item}
          ` 
      )
      setTimeout( () => {
        // lazyload media assets after room is initialized
        this.loadMediaAssets(paragraph.paragraphs)
        this.upgradeContent()
        this.updatePage()
      }, 1000 ) 
    }

    this.upgradeContent = function(){
      let paragraph = room.objects.rss
      if( !paragraph.xmlDoc ) return
    }

    this.loadMediaAssets = function(items){
      let paragraph = room.objects.rss
      if( !paragraph.assets ) paragraph.assets = {}
      if( !paragraph.xmlDoc ) return
       
      for( let i = 0; i < items.length; i++ ){
        try{
          let url   = ''
          let media = paragraph.xmlDoc.querySelectorAll("item")[i].querySelector("content")
          if( media ) url = media.getAttribute("url")
          if( !url ) continue
          const  id = `rss${i}`
          const ext = url.replace(/.*\./,'').toLowerCase()
          switch( ext ){
            case 'png':
            case 'gif':
            case 'jpg':  paragraph.assets[id] = 'image'; break;

            case 'mp4':
            case 'webm':
            case 'mpg':
            case 'mpeg': paragraph.assets[id] = 'video'; break;

            case 'mp3':
            case 'ogg':  paragraph.assets[id] = 'audio'; break;

            default:     console.warn(`unknown media format in rss <media:content url='${url}' .../>`)
          }
          if( paragraph.assets[id] ){
            room.loadNewAsset( paragraph.assets[id], { src:url, id, auto_play:true, loop:true }); 
          }
        }catch(e){ } // fail silently
      }
    }

    this.updatePage = function(){
      const paragraph = room.objects.rss
      room.objects.rsspage.text = `${paragraph.index+1} / ${paragraph.maxindex}`
    }

    this.onIndexUpdate = function(e){
      // wait for the index to get updated
      // then we'll try to show the media next to the RSS window (if any)
      setTimeout( () => { 
        if( !room.objects.rssmedia ) return
        const index     = e.data.paragraph.index
        const id        = `rss${index}`
        const paragraph = room.objects.rss
        room.objects.rssmedia.image_id = 
        room.objects.rssmedia.video_id = ''
        room.objects.rssmedia.visible = false 
        if( paragraph.assets[id] ){
          room.objects.rssmedia[ paragraph.assets[id]+'_id' ] = id 
          room.objects.rssmedia.visible  = true 
          let asset = room.objects.rssmedia.getAsset('image', id)
          if( asset ){
            room.objects.rssmedia.scale.set(3.9,3.9,1)
            room.objects.rssmedia.scale.x *= asset.canvas.width / asset.canvas.height
          }
        }
        this.updatePage()
        room.objects.rssdeco.visible = paragraph.assets[id] ? false : true 
      },30)
    }

  });
});

