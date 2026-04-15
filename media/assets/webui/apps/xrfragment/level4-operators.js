/* XR URI Fragments spec (https://xrfragment.org)
 *
 * level4 operators per the XR URI Fragments spec
 * 
 * https://xrfragment.org/#%F0%9F%93%9C%20level4%3A%20operators
 *
 * overlays: https://xrfragment.org/#%23!
 */

function xrf_install_operators(){
  let scene  = false
  if( elation?.engine?.instances?.default?.systems?.world?.scene ){
    scene = elation.engine.instances.default.systems.world.scene['world-3d']
  }else return 

  // set .overlay = true for portal-urls to files containing #!
  scene.traverse( (o) => {
    if( o?.userData?.thing && o.userData.thing.componentname == 'engine.things.janusportal'){
      let portal = o.userData.thing
      if( portal.url.match(/#!/) ){ 
        portal.overlay = true
      }
    }
  })
}

elation.events.add(null, 'href_portal', function(e){
  // call janus.merge() for portal-urls to files containing #!
  if( e?.data?.href && e.data.href.match(/#!/) ){
    let url = e.data.href 
    let jo  = e.data.opts.jobj
    e.data.execute = () => {
      if (url[0] == '/') {
        url = room.baseurl.replace(/^(https?:\/\/[^\/]+\/).*$/, '$1') + url;
      } else if (!url.match(/https?:\/\//i)) {
        url = room.baseurl + url;
      }
      let pos = new THREE.Vector3()
      jo.objects['3d'].getWorldPosition(pos)
      room.properties.janus.merge( url, null, pos )
      jo.visible = false

    }
  }
})

/* NOTE: removing objects after they're loaded is not the most efficient way */
elation.events.add(null, 'janus_room_load', function(e){
  room = e.element
  if( room.urlhash && room.urlhash[0] == '!' && room.urlhash.length > 1 ){
    let id     = room.urlhash.substr(1)
    let scene  = e.element.objects['3d']
    let remove = []
    let obj    = false
    // find selected object
    scene.traverse( (o) => {
      if( o.id == id  || o.name == id ) obj = o 
      if( o?.userData?.thing && o.userData.thing.js_id == id ){ obj = o }
    })
    scene.children = []
    if( obj ){
      scene.add(obj)
      obj.position.set(0,0,0)
    }
  }
})

xrf_install_operators()
elation.events.add(null, 'room_load_complete', xrf_install_operators )
