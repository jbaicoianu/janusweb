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

  // mark nested room (url_pos="0,0,0") for janus portals with URLs- containing #!
  scene.traverse( (o) => {
    if( o?.userData?.thing && o.userData.thing.componentname == 'engine.things.janusportal'){
      let portal = o.userData.thing
      if( portal.url.match(/#!/) ){
        if( !portal.url_pos ) portal.url_pos = V(0,0,0) // enforce rendering nestedroom
      }
    }
  })
}

// reparent objects to targets if any
elation.events.add(null, 'room_load_nested', function(e){
  let {room,portal} = e.data
  if( portal.url.match(/#.*!/) ){ // url matches # and !
    new URLSearchParams( portal.url.replace(/.*#/,'') )
    .forEach( (v,name) => {
      if( name[0] == '!' && v ){ 
        let obj = room.getObjectByDeepName( name.substr(1), true )
        if( obj ){ 
          //obj.position.set(0,0,0)
          //obj.rotation.set(0,0,0)
          room.reparent( obj, v, janus.currentroom ) // attach to v
        }
      }
    })
  }
})

// call janus.merge() for XRF href extras containing #!
elation.events.add(null, 'href_portal', function(e){
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

/* this cherry-picks objects via the #!myobject operator
/* NOTE: removing objects after they're loaded is not the most efficient way */
elation.events.add(null, 'janus_room_load', function(e){
  let room = e.element
  if( room.urlhash && room.urlhash[0] == '!' && room.urlhash.length > 1 ){
    let ids    = []
    let objs   = []
    let scene  = e.element.objects['3d']
    let remove = []
    // find selected object (this is a fuzzy match)
    scene.traverse( (o) => {
      new URLSearchParams( room.urlhash )
      .forEach( (v,fragment) => {
        if( fragment[0] == '!' ){
          const id     = fragment.substr(1)
          let match = false
          // fuzzy match
          if( o.id == id  || o.name == id       ) match = true
          if( o?.userData?.thing?.js_id   == id ) match = true
          if( o?.userData?.thing?.janusid == id ) match = true 
          if( match ) objs.push(o)
        }
      })
    })
    scene.children = [] // empty
    objs.map( (obj) => {
      scene.add(obj)
      obj.position.set(0,0,0)
    })
  }
})

xrf_install_operators()
elation.events.add(null, 'room_load_complete', xrf_install_operators )
