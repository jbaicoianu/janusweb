// https://xrfragment.org/#%F0%9F%93%9Clevel7%3A%20engine%20prefixes
// There are cases where the 3D scene file might want to hint the 
// specific features to the viewer-engine (JANUSWEB, THREE.js, AFRAME, Godot e.g.). 

xrf_engines = function(){

  const {toJanusObject,applyPrefixes,applyCleanup} = xrf_engines
  let cleanup = []

  const map = (obj,key,realKey) => {
    let match     = true 

    // compatibility workaround: some 3D editors omit false booleans in export :/
    // therefore we support boolean strings
    if( obj.userData[key] == 'false' ) obj.userData[key] = false
    if( obj.userData[key] == 'true'  ) obj.userData[key] = true

    // increment/decrement
    let scroller = key.match(/[+]$/) && typeof obj.userData[key] == 'number'
    if( scroller && !scene.scrollers ){
      scene.scrollers = []
      elation.events.add(null, 'janusweb_script_frame', function(e){
        scene.scrollers.map( (f) => f(e.data) ) // e.data == delta
      })
    }

    // special cases
    switch( key ){
      case "-three-material.blending": if( obj.material ){
                                         const modes = {
                                           'THREE.NoBlending':          THREE.NoBlending,
                                           'THREE.NormalBlending':      THREE.NormalBlending,
                                           'THREE.AdditiveBlending':    THREE.AdditiveBlending,
                                           'THREE.SubtractiveBlending': THREE.SubtractiveBlending,
                                           'THREE.MultiplyBlending':    THREE.MultiplyBlending
                                         }
                                         setTimeout( () => { // not sure why this only works in setTimeout
                                           if( modes[ obj.userData[key] ] ) obj.material.blending = modes[ obj.userData[key] ]
                                         },10)
                                       }
                                       break;

      case "-three-material.sides":    if( obj.material ){
                                         const modes = {
                                           'THREE.FrontSide':  THREE.NoBlending,
                                           'THREE.BackSide':   THREE.NormalBlending,
                                           'THREE.DoubleSide': THREE.DoubleSide
                                         }
                                         setTimeout( () => { // not sure why this only works in setTimeout
                                           if( modes[ obj.userData[key] ] ) obj.material.sides = modes[ obj.userData[key] ]
                                         },10)
                                       }
                                       break;

      case "-janus-use_local_asset": room.use_local_asset = obj.userData[key]
                                     room.localasset = room.createObject('object', {
                                       id: room.use_local_asset,
                                       collision_id: room.use_local_asset + '_collision',
                                       collision_scale: V(1,1,1),
                                       collision_pos: V(0,0,0),
                                       col: room.col,
                                       //fwd: room.fwd,
                                       xdir: room.xdir,
                                       ydir: room.ydir,
                                       zdir: room.zdir,
                                       shadows: true
                                     });
                                     break;

      // DECLARATIVE entities
      case "-janus-tag":             let opts    = {}// rotation: '0 -180 0' }
                                     for( let i in obj.userData ){ 
                                       if( !i.match(/^-janus-/) ) continue
                                       opts[ i.replace(/-janus-/,'') ] = obj.userData[i]
                                     }

                                     // create asset
                                     if( obj.userData['-janus-tag'].match(/^asset/) ){
                                       if( opts.src && !opts.src.match(/(^\.|:\/)/) ) opts.src = room.baseurl + opts.src
                                       room.loadNewAsset( opts['tag'].replace(/^asset/,''), opts )
                                     }else{
                                       opts.js_id = opts.name = opts.jsid = String(`-janus-${obj.name}_${obj.userData['-janus-tag']}`).replace(/.*janus-/,'-janus-')
                                       // create room object
                                       const jo = room.createObject( opts.tag, opts )
                                       jo.objects['3d'].name = opts.js_id
                                       jo.visible = false
                                        
                                       // replace janusobject with nested THREE obj
                                       // we need setTimeout otherwise quaternion is not updated 
                                       // https://github.com/jbaicoianu/janusweb/issues/306
                                       obj.parent.add( jo.objects['3d'] )
                                       setTimeout( () => {
                                         jo.orientation.copy( obj.quaternion)
                                         jo.position.copy( obj.position )
                                         jo.visible = true
                                       },200)
                                       // mark previously generated geo/materials by janusweb export for deletion
                                       obj.traverse ( (o) => cleanup.push(o) )
                                       cleanup.push(obj)
                                     }
                                     break;
      // OBJECTS
      case "-janus-collision_id":    const collision_id = obj.userData[key]
                                     if( collision_id != obj.name ){
                                       console.warn(`xrfragment: ${obj.name}.collision_id can be '${obj.name}' only (for now)..skipping '${collision_id}'`)
                                     }else{
                                       const jo = toJanusObject(obj,{noreparent:true})
                                       jo.collidable = true
                                       jo.collision_id = collision_id
                                       jo.removeCollider();
                                       const collider = obj.clone()
                                       collider.position.set(0,0,0)
                                       collider.rotation.set(0,0,0)
                                       collider.scale.set(1,1,1)
                                       jo.collision_trigger = true
                                       jo.setCollider('mesh',{mesh: collider})
                                       jo.colliders.parent = obj
                                       //jo.objects.dynamics.mass = 1
                                       //jo.objects.dynamics.addForce('static', new THREE.Vector3(0, room.gravity, 0));
                                       //elation.events.add(jo.objects.dynamics, 'physics_collide', elation.bind(jo, jo.handleCollision));
                                       console.log(`xrfragment: setting collision_id = ${collision_id}`)
                                     }
                                     break;

      default:                      match = false                     
              
                                    // JANUS fallthrough
                                    if( key.match(/^-janus-/) ){
                                      // *TODO* more heuristics to determine scene
                                      if( obj.name == 'Scene' || obj?.parent?.name == '' || obj.userData['-janus-source']){ 
                                        room[realKey] = obj.userData[key];
                                      }else{
                                        toJanusObject(obj)[realKey] = obj.userData[key]
                                      }
                                      match = true
                                    }

                                    // THREE fallthrough
                                    if( key.match(/^-three-/) ){

                                      if( realKey.match('material.') ){ // clone shared materials
                                        obj.material = obj.material.clone()
                                        if( realKey.match('material.map') ) obj.material.map = obj.material.map.clone()
                                      }
                                      
                                      const setKeyVal     = (o, path, val       ) => new Function('o', 'v',     `o.${path}  = v               `)(o, val);
                                      if( scroller ){
                                        const setKeyValIncr = (o, path, val, delta) => new Function('o', 'speed', `o.${path} += ${delta} * speed`)(o, val);
                                        const myscroller    = function(path,val,delta){
                                          setKeyValIncr( this, path, val, delta) 
                                        }.bind(obj, realKey.replace(/[+]$/,''), obj.userData[key])
                                        scene.scrollers.push(myscroller)
                                      }else{
                                        try{ 
                                          setKeyVal( obj, realKey, obj.userData[key] ) 
                                        }catch(e){ console.error(e) }
                                      }
                                      match = true
                                    }
                                    break;
    }

    if( match ){
      console.log(`xrfragment: engine prefix '${key}:${realKey}' = '${obj.userData[key]}'`)
    }
  }

  room.gravity = 0 // new default unless specified otherwise
  let scene = elation.engine.instances.default.systems.world.scene['world-3d'] 
  // janus requires first initialzing of assets
  const isAsset = (obj) => String(obj.userData['-janus-tag']).match(/^asset/)
  applyPrefixes(scene,map, (o) => isAsset(o)  )
  applyPrefixes(scene,map, (o) => !isAsset(o) )
  applyCleanup(cleanup)
}


xrf_engines.toJanusObject = function(obj,opts){
  if( room.objects[ obj.name ] ) return room.objects[ obj.name ]
  opts = opts || {}
  opts.tag = opts.tag || 'object'
  const create = () => room.createObject( opts.tag,{ js_id: obj.name, ...opts })
  let jo = create()
  jo.objects['3d'] = obj
  return jo
}

xrf_engines.applyPrefixes = function(scene,map,criteria){
  criteria = criteria ? criteria : (obj) => true 
  scene.traverse( (obj) => {
    for( let field in obj.userData ){
      if( obj.userData[field] ){ 
        try{
          map(obj,field, field.replace(/^-(janus|three)-/,'') )
        }catch(e){ console.error(e) }
      }
    }
  })
}

xrf_engines.applyCleanup = function(cleanup){
  const clean = (o) => {
    if( o.geometry ) o.geometry.dispose()
    if( o.material ) o.material.dispose()
    o.removeFromParent()
  }
  cleanup.map(clean)
}


elation.events.add(null, 'room_load_complete', xrf_engines ) // future scenes
xrf_engines()                                                // current scene
