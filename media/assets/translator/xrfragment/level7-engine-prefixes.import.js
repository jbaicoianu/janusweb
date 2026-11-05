// https://xrfragment.org/#%F0%9F%93%9Clevel7%3A%20engine%20prefixes
// There are cases where the 3D scene file might want to hint the 
// specific features to the viewer-engine (JANUSWEB, THREE.js, AFRAME, Godot e.g.). 

export default function init(elation,room){

  var xrf_engines = function(){

    const {toJanusObjectOrAsset,applyPrefixes,applyCleanup} = xrf_engines
    let cleanup = []

    const map = (obj,key,realKey) => {
      room          = room || window.room // sometimes we're losing scope?
      let match     = true 

      // compatibility workaround: some 3D editors omit false booleans in export :/
      // therefore we support boolean strings
      if( obj.userData[key] == 'false' ) obj.userData[key] = false
      if( obj.userData[key] == 'true'  ) obj.userData[key] = true

      // increment/decrement
      let scroller = key.match(/[+]$/) 
      if( scroller && !scene.scrollers ){
        if( typeof obj.userData[key] != 'number' ) obj.userData[key] = parseFloat(obj.userData[key])
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
                                            'THREE.FrontSide':  THREE.FrontSide,
                                            'THREE.BackSide':   THREE.BackSide,
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

                                       opts.name = String(`-janus-${obj.name}_${obj.userData['-janus-tag']}`).replace(/.*janus-/,'-janus-')
                                       opts.js_id = opts.js_id || opts.name
                                       opts.id    = !opts.url && opts.id ? opts.id : opts.name || null

                                       // create asset or object
                                       if( obj.userData['-janus-tag'].match(/^asset/) ){
                                         if( opts.src && !opts.src.match(/(^\.|:\/)/) ) opts.src = room.baseurl + opts.src
                                       }
                                       const jo = toJanusObjectOrAsset(obj,opts)

                                       if( jo.objects && jo.objects['3d']){
                                         // create room object
                                         jo.objects['3d'].name = opts.js_id
                                         jo.visible = false
                                          
                                         // replace janusobject with nested THREE obj
                                         obj.parent.add( jo.objects['3d'] )

                                         // fix unclickable objects (since obj might be nested in the scene-tree)
                                         if( jo.colliders && !obj.userData['-janus-websurface_id'] ){
                                           jo.removeCollider()
                                           jo.colliders.parent.children.push( jo.objects['3d'] )
                                         }

                                         // we need setTimeout otherwise quaternion is not updated 
                                         // https://github.com/jbaicoianu/janusweb/issues/306
                                         setTimeout( () => {
                                           jo.orientation.copy( obj.quaternion)
                                           //jo.scale.copy( obj.scale )
                                           jo.visible = true
                                         },200)
                                         // mark previously generated geo/materials by janusweb export for deletion
                                         obj.traverse ( (o) => cleanup.push(o) )
                                         cleanup.push(obj)
                                       }
                                       break;
        //// OBJECTS
        //case "-janus-collision_id":    const collision_id = obj.userData[key]
        //                               if( collision_id != obj.name ){
        //                                 console.warn(`xrfragment: ${obj.name}.collision_id can be '${obj.name}' only (for now)..skipping '${collision_id}'`)
        //                               }else{
        //                                 const jo = toJanusObjectOrAsset(obj,{noreparent:true})
        //                                 jo.collidable = true
        //                                 debugger
        //                                 jo.collision_id = collision_id
        //                                 jo.removeCollider();
        //                                 const collider = obj.clone()
        //                                 collider.position.set(0,0,0)
        //                                 collider.rotation.set(0,0,0)
        //                                 collider.scale.set(1,1,1)
        //                                 jo.collision_trigger = true
        //                                 jo.setCollider('mesh',{mesh: collider})
        //                                 jo.colliders.parent = obj
        //                                 //jo.objects.dynamics.mass = 1
        //                                 //jo.objects.dynamics.addForce('static', new THREE.Vector3(0, room.gravity, 0));
        //                                 //elation.events.add(jo.objects.dynamics, 'physics_collide', elation.bind(jo, jo.handleCollision));
        //                                 console.log(`xrfragment: setting collision_id = ${collision_id}`)
        //                               }
        //                               break;

        default:                      match = false                     
                
                                      // JANUS property fallthrough
                                      if( key.match(/^-janus-/) && !key.match("-janus-tag") ){
                                        // *TODO* more heuristics to determine scene
                                        if( obj.name == 'Scene' || obj?.parent?.name == '' || obj.userData['-janus-source']){ 
                                          room[realKey] = obj.userData[key];
                                        }else{
                                          toJanusObjectOrAsset(obj)[realKey] = obj.userData[key]
                                          if( key == '-janus-cull_face' ){ 
                                            toJanusObjectOrAsset(obj).collidable = false // bugfix!
                                          }
                                        }
                                        match = true
                                      }

                                      // THREE fallthrough
                                      if( key.match(/^-three-/) ){

                                        if( realKey.match('material.') && obj.material ){ // clone shared materials
                                          obj.material = obj.material.clone()
                                          if( realKey.match('material.map') ) obj.material.map = obj.material.map.clone()
                                        }
                                        const setKeyVal     = (o, path, val       ) => new Function('o', 'v',     `o.${path}  = v               `)(o, val);
                                        if( scroller ){
                                          const setKeyValIncr = (o, path, val, delta) => new Function('o', 'speed', `o.${path} += ${delta} * speed`)(o, val);
                                          try{ 
                                            const myscroller    = function(path,val,delta){
                                              setKeyValIncr( this, path, val, delta) 
                                            }.bind(obj, realKey.replace(/[+]$/,''), obj.userData[key])
                                            myscroller(0.000001)              // see if it triggers error
                                            scene.scrollers.push(myscroller)  // otherwise add frame-function
                                          }catch(e){ 
                                            console.error(`could not apply engine prefix: ${obj.name} => ${key} (tip: dont use them on <paragraph> objects)`) 
                                          }
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
        //console.log(`xrfragment: engine prefix '${key}:${realKey}' = '${obj.userData[key]}'`)
      }
    }

    room.gravity = 0 // new default unless specified otherwise
    let scene = elation.engine.instances.default.systems.world.scene['world-3d'] 
    const isAsset    = (obj) => String(obj.userData['-janus-tag']).match(/^asset/)
    const isJanusTag = (obj) => String(obj.userData['-janus-tag']) && !isAsset(obj)
    applyPrefixes(scene,map, (o) => isAsset(o)                    ) // janus requires first initialzing of assets
    applyPrefixes(scene,map, (o) => isJanusTag(o)                 ) // then regular janus tags
    applyPrefixes(scene,map, (o) => !isJanusTag(o) && !isAsset(o) ) // then set properties on the rest
    applyCleanup(cleanup)
  }


  xrf_engines.toJanusObjectOrAsset = function(obj,opts){
    if( room.objects[ obj.name ] ) return room.objects[ obj.name ]
    if( obj.userData.thing       ) return obj.userData.thing
    opts = opts || {}
    opts.tag = obj.userData['-janus-tag'] || opts.tag || 'object'
    if( opts.tag.match(/^asset/) ){
      const type = opts.tag.replace(/^asset/,'')
      room.loadNewAsset( type, opts )
      let jo = room.roomassets[type][ opts.id ]
      if( jo && obj.userData && !obj.userData.thing ){ 
        obj.userData.thing = jo 
        return obj.userData.thing
      }
      throw 'could not create asset'
    }else{
      const create = () => room.createObject( opts.tag,{ js_id: obj.name, ...opts })
      let jo = create()
      jo.objects['3d'] = obj
      if( jo && obj.userData && !obj.userData.thing ){ 
        obj.userData.thing = jo 
        obj.getWorldPosition( jo.position )
      }
      return obj.userData.thing
    }
  }

  xrf_engines.applyPrefixes = function(scene,map,criteria){
    criteria = criteria ? criteria : (obj) => true 
    scene.traverse( (obj) => {
      if( criteria(obj) ){

        const process = (field) => map(obj,field, field.replace(/^-(janus|three)-/,'') )
        if( obj.userData['-janus-tag'] ){ // always first janustag first
          try{ process('-janus-tag') }catch(e){ console.error(e) }
        }
        for( let field in obj.userData ){
          if( obj.userData[field] ){ 
            try{ process(field) }catch(e){ console.error(e) }
          }
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
  if( room.loaded ) xrf_engines()                              // current scene
}
