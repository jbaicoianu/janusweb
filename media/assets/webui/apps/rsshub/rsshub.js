elation.elements.define('app-rsshub', class extends elation.elements.base {
  // The init function gets called to define the object, and is used to define any attributes the element has
  // Don't forget to call super.init() to set up any attributes which we've inherited!
  init() {
    super.init();
    this.rss = elation.elements.app.rss
    this.defineAttributes({
      'done': { type: 'boolean', default: false }
    });
    /* TODO: in the future the autocomplete popup (navigator webui) could be refactored
     *       to show rsshub routes, but for now this is out of scope 
     *
     *  this.urlbar = elation.engine.instances.default.client.querySelector("janus-ui-urlbar")
     *  this.urlbar.suggestions.show()
     *  this.urlbar.suggestions.panel.innerHTML += `
     *    <div>
     *      <h2>RSS</h2>
     *      <ui-list collection="suggested_rss">
     *        <a href="{url}" class="suggestedroom" onclick="player.spawnPortal(this.href); player.enable(); return false;" title="{?title}{title} | {/title}{url}">
     *          <div>
     *            <h4>{?title}{title}{:else}{url}{/title}</h4>
     *            <h5>{url}</h5>
     *          </div>
     *          <img class="suggestedroom_thumb" src="{thumbnail}"/>
     *        </a>
     *      </ui-list>
     *    </div>
     *   `
     */
  }
  // The create function gets called for each instance of this element as it's added to the page
  create() {
    this.innerHTML = 'rsshub app loaded'
  }
});

(function(){

  const rsshub = elation.elements.app.rsshub

  rsshub.url = {
    routes: "https://docs.rsshub.app/routes.json"
  }
  rsshub.installed = false
  rsshub.routes = {}
  rsshub.instanceCurrent = -1
  rsshub.instances = [ 
      // https://github.com/RSSNext/rsshub-docs/blob/main/.vitepress/theme/components/InstanceList.vue#L37 
      {
        url: 'https://rsshub.rssforever.com',
        location: '🇦🇪',
        maintainer: 'Stille',
        maintainerUrl: 'https://www.ioiox.com',
      },
      {
        url: 'https://hub.slarker.me',
        location: '🇺🇸',
        maintainer: 'Slarker',
        maintainerUrl: 'https://slarker.me',
      },
      {
        url: 'https://rsshub.pseudoyu.com',
        location: '🇫🇷',
        maintainer: 'pseudoyu',
        maintainerUrl: 'https://github.com/pseudoyu',
      },
      {
        url: 'https://rsshub.rss.tips',
        location: '🇺🇸',
        maintainer: 'AboutRSS',
        maintainerUrl: 'https://github.com/AboutRSS/ALL-about-RSS',
      },
      {
        url: 'https://rsshub.ktachibana.party',
        location: '🇺🇸',
        maintainer: 'KTachibanaM',
        maintainerUrl: 'https://github.com/KTachibanaM',
      },
      {
        url: 'https://rss.owo.nz',
        location: '🇩🇪',
        maintainer: 'Vincent Yang',
        maintainerUrl: 'https://missuo.me',
      },
      {
        url: 'https://rss.wudifeixue.com',
        location: '🇨🇦',
        maintainer: 'wudifeixue',
        maintainerUrl: 'https://github.com/wudifeixue',
      },
      {
        url: 'https://rss.littlebaby.life/rsshub',
        location: '🇺🇸',
        maintainer: 'yuanhong',
        maintainerUrl: 'https://github.com/yuanhong078',
      },
      {
        url: 'https://rsshub.henry.wang',
        location: '🇬🇧',
        maintainer: 'HenryQW',
        maintainerUrl: 'https://github.com/HenryQW',
      },
      {
        url: 'https://holoxx.f5.si/',
        location: '🇯🇵',
        maintainer: 'Vania',
        maintainerUrl: 'https://note.com/vania',
      },
      {
        url: 'https://rsshub.umzzz.com',
        location: '🇭🇰',
        maintainer: 'nesay',
        maintainerUrl: 'https://umzzz.com',
      },
      {
        url: 'https://rsshub.isrss.com',
        location: '🇺🇸',
        maintainer: 'isRSS',
        maintainerUrl: 'https://isrss.com',
      },
      {
        url: 'https://rsshub.email-once.com',
        location: '🇭🇰',
        maintainer: 'EmailOnce',
        maintainerUrl: 'https://email-once.com',
      },
      {
        url: 'https://rss.datuan.dev',
        location: '🇻🇳',
        maintainer: 'Tuấn Dev',
        maintainerUrl: 'https://duonganhtuan.com',
      },
      {
        url: 'https://rss.4040940.xyz',
        location: '🇩🇪',
        maintainer: 'TingyuShare',
        maintainerUrl: 'https://github.com/TingyuShare',
      },
      {
        url: 'https://rsshub.cups.moe',
        location: '🇺🇸',
        maintainer: 'FunnyCups',
        maintainerUrl: 'https://www.cups.moe',
      },
      {
        url: 'https://rss.spriple.org',
        location: '🇨🇳',
        maintainer: 'Spriple',
        maintainerUrl: 'https://blog.spriple.org',
      },
      {
        url: 'https://rsshub-balancer.virworks.moe',
        location: '🇺🇳',
        maintainer: 'chesha1',
        maintainerUrl: 'https://github.com/chesha1',
      }
  ]

  rsshub.fetch = async function(){
    if( rsshub.routes.length ) return
    let routeURL = rsshub.url.routes
    console.log("[rsshub] fetching routes from "+routeURL)
    if (elation.engine.assets.corsproxy && routeURL.indexOf(elation.engine.assets.corsproxy) == -1) {
      routeURL = elation.engine.assets.corsproxy + routeURL
    }
    let res  = await fetch( routeURL )
    let json = await res.json() 
    // the routes.json is huge..lets strip only necessary info
    for( let domain in json ){
      rsshub.routes[ domain ] = {routes:{}}
      for( let route in json[domain].routes ){
        if( json[domain].routes[route].example ){
          rsshub.routes[domain].routes[ route ] = {
            name: json[domain].routes[route].name,
            example: json[domain].routes[route].example
          }
        }
      }
    }
  }

  rsshub.getRoutes = function(url){
    const route = url.replace(/www\./,'')
                     .replace(/.*\/\//,'')
                     .replace(/\..*/,'')
    if( rsshub.routes[ route ] ){
      return rsshub.routes[ route ].routes
    }
  }

  rsshub.install = async function(){
    if( room?.translator != 'default' || rsshub.busy ) return
    rsshub.busy = true
    try{
      await this.fetch()
      await this.autoSelectInstance()

      let routes = this.getRoutes(room.url)
      if( routes ){ this.addPortals(routes) }
    }catch(e){ console.error(e) }
    rsshub.busy = false
  }

  rsshub.autoSelectInstance = async function(next){
    const tryNext = async () => await rsshub.autoSelectInstance(true)
    try{
      if( rsshub.instanceCurrent == -1 || next){
        rsshub.instanceCurrent += 1
        console.log("[rsshub] checking instance "+rsshub.instances[ rsshub.instanceCurrent ].url)
        if( rsshub.instanceCurrent < rsshub.instances.length ){
          let instanceURL = rsshub.instances[ rsshub.instanceCurrent ].url 
          if (elation.engine.assets.corsproxy ){
            instanceURL = elation.engine.assets.corsproxy + instanceURL
          }
          let res  = await fetch( instanceURL )
          let html = await res.text() 
          if( String(html).match('Welcome to RSSHub') ){ 
            return console.log("[rsshub] found active instance")
          }else await tryNext()
        }
      }
    }catch(e){ tryNext() }
  }

  rsshub.addPortals = function(routes){
    if( rsshub.instanceCurrent == -1 ) return // no instance found..no portal
    let i = 1
    for( let route in routes ){
      const url = rsshub.instances[ rsshub.instanceCurrent ].url + routes[route].example
      room.createObject('link',{
        url,
        pos: `-3.3 0 ${ -4 + (1.5*i++)}`,
        rotation: '0 90 0',
        shader_id: 'defaultportal',
        round: true,
        title: routes[route].name || route
      })
      if( i == 7 ) break;
    }
    room.createObject('text',{
      pos: '-2.18 0 0.49',
      scale: '4 4 1',
      text: 'rsshub.app example feeds',
      rotation: '-90 0 90'
    })
  }

  // we don't know when we are included so we're betting on multiple horses
  setTimeout( () => rsshub.install(), 5000 )
  elation.events.add(null, 'room_load_complete', () => rsshub.install() );

})()
