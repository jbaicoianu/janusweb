/* XR URI Fragments spec (https://xrfragment.org)
 *
 * level4 operators per the XR URI Fragments spec
 * 
 * https://xrfragment.org/#%F0%9F%93%9C%20level4%3A%20operators
 *
 * overlays: https://xrfragment.org/#%23!
 */

export default function init(elation,room){
    
  const defaultHints = 'vr ar portal embed hide collection'

  function xrf_install_xrhints(){
      
    let startXR        = janus.engine.client.startXR 
    let client         = janus.engine.client

    function getContext(){
      let context = this.className ? this.classList : ['vr']

      const render        = this.engine.systems.render
      const session       = janus.engine.client?.xrplayer?.session
      if( session && render?.renderer?.xr?.isPresenting ){
        context = []
        let mode = session.mode
        // WebXR Polyfill fallback for convenient debugging 
        if( !mode ){
          try {
              const symbols = Object.getOwnPropertySymbols(session);
              for (const sym of symbols) {
                  if (sym.toString().includes("@@webxr-polyfill/XRSession")) {
                      const internalState = session[sym];
                      if (internalState && internalState.mode) {
                          mode = internalState.mode;
                      }
                  }
              }
          } catch (e) {}
        }
        if( mode == 'immersive-ar' ) context = ['ar']
        if( this.nested ){
          const embedded = this.nested.url_pos || this.nested.url_scale || this.nested.url_rotation
          context.push( embedded ? 'embed' : 'portal')
        }
      }
      return context
    }

    // universal XR classes https://xrfragment.org/#%F0%9F%93%9Clevel8%3A%20XR%20classes
    function applyXRHints(children, state){
      if( applyXRHints.throttle ) return
      applyXRHints.throttle = setTimeout( () => applyXRHints.throttle = null, 200)
      // default https://xrfragment.org/#%F0%9F%93%9Clevel8%3A%20XR%20classes
      const classList      = defaultHints.split(' ')

      children = children || room.children
      state      = state || { visible: true, context: getContext.apply(room) }

      const hasOverlap    = (a,b) => a.filter( (className) => ~b.indexOf(className) ).length > 0
      for( let i in children){
        const child = children[i]
        if( child.classList && child.classList.length > 0 ){
          if( hasOverlap( child.classList, classList ) ){
            state.visible = hasOverlap( child.classList, state.context )
          }
        }
        if( child.visible && !state.visible ){ 
          child.visible = false // hidden in this context
        }
        if( Object.keys(child.children || {}).length > 0 ){
          applyXRHints.apply(room,[child.children,state])
        }
      }
    }
    if( elation?.engine?.instances?.default?.systems?.world?.scene ){
      let scene = elation.engine.instances.default.systems.world.scene['world-3d']
  //  // mark nested room (url_pos="0,0,0") for janus portals with URLs- containing #!
  //  scene.traverse( (o) => {
  //    if( o?.userData?.thing && o.userData.thing.componentname == 'engine.things.janusportal'){
  //      let portal = o.userData.thing
  //      if( portal.url.match(/#!/) ){
  //        if( !portal.url_pos ) portal.url_pos = V(0,0,0) // enforce rendering nestedroom
  //      }
  //    }
  //  })
    }

    applyXRHints.apply(room)

    if( !client.startXR.xrhints ){
     client.startXR = function(mode,opts){
        startXR.apply(client, [mode,opts])
        //setTimeout( () => applyXRHints.apply(room), 100 )
      }
    }


  }

  xrf_install_xrhints()
  elation.events.add(null, 'room_load_complete', xrf_install_xrhints )

}
