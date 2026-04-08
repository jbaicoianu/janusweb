xrf_export = {

  node(e){
    const {userData,n} = e.data
    for( let k in userData ){
      if( k.match(/^-(three)-/) || k == 'href' ){ // keep hrefs + `-three-*` engine prefixes
        n.userData[k] = userData[k]               // but ditch `-janus-*` (we'll regenerate them)
      }
      if( k == 'thing' && String(userData[k].componentname).match('engine.things.janus') ){
        const thing       = userData[k]
        switch( thing.componentname ){
          case "engine.things.janusparagraph":
          case "engine.things.janustext":
          case "engine.things.janusportal":
          case "engine.things.januswebsurface":
          case "engine.things.janusroom":

            if( thing.componentname != 'engine.things.janusroom' ){
              n.name = String(`-janus-${thing.js_id}`).replace(/.*janus-/,'-janus-')
              n.userData['-janus-tag'] = thing.componentname 
                                              .replace('janusportal','januslink')
                                              .replace('engine.things.janus','')
            }
            if( thing.componentname.match(/engine\.things\.janus(portal|link)/) && n.children[0] ){
              // convert portal to XRF href
              n.children[0].userData['href'] = thing.url
            }
            // write XRF `-janus-*` engine prefixes
            const attrs = xrf_export.getAttributes(thing)
            for( let i in attrs ){ 
              if( !i.match(/^-janus-(use_local_asset)/) ){
                n.userData[`-janus-${i}`] = attrs[i]
              }
            }
            break;
        }
      }
    }
  },
  scene(e){
    // https://xrfragment.org/#%F0%9F%93%9Clevel7%3A%20engine%20prefixes
    e.data.scene.userData['-janus-source'] = room.getRoomSource()
  },
  getAttributes(thing){
    if( !thing ) return {}
    let proxy     = thing.getProxyObject(),
        propdefs  = thing._thingdef.properties,
        proxydefs = proxy._proxydefs,
        attrs     = {};

    // this code is almost a duplicate of elation's .summarizeXML() but with inversed (glTF) position
    for (let k in proxydefs) {
      let proxydef = proxydefs[k],
        propdef = elation.utils.arrayget(propdefs, proxydef[1]);
      if ( k != 'room' && k != 'tagName' && k != 'classList' && proxydef[0] == 'property' && propdef) {
        let val = elation.utils.arrayget(thing.properties, proxydef[1]);
        let defaultval = propdef.default;
        if (val instanceof THREE.Vector2) {
          if (defaultval instanceof THREE.Vector2) defaultval = defaultval.toArray();
          if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1]))) {
            attrs[k] = val.toArray().map(n => Math.round(n * 10000) / 10000).join(' ');
          }
        } else if (val instanceof THREE.Vector3) {
          if (defaultval instanceof THREE.Vector3) defaultval = defaultval.toArray();
          if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1] && val.z == defaultval[2]))) {
            attrs[k] = val.toArray().map(n => Math.round(n * -10000) / 10000).join(' ');
          }
        } else if (val instanceof THREE.Color) {
          if (defaultval instanceof THREE.Color) defaultval = defaultval.toArray();
          if (!('default' in propdef) || defaultval === null || ('default' in propdef && !(val.r == defaultval[0] && val.g == defaultval[1] && val.b == defaultval[2]))) {
            attrs[k] = val.toArray().map(n => Math.round(n * 10000) / 10000).join(' ');
          }
        } else if (val instanceof THREE.Euler) {
          if (defaultval instanceof THREE.Euler) defaultval = defaultval.toArray();
          if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1] && val.z == defaultval[2]))) {
            attrs[k] = val.toArray().slice(0, 3).map(n => Math.round(n * 10000) / 10000).join(' ');
          }
        } else if (val instanceof THREE.Quaternion) {
          if (defaultval instanceof THREE.Quaternion) defaultval = defaultval.toArray();
          if (!('default' in propdef) || ('default' in propdef && !(val.x == defaultval[0] && val.y == defaultval[1] && val.z == defaultval[2] && val.w == defaultval[3]))) {
            attrs[k] = val.toArray().map(n => Math.round(n * 10000) / 10000).join(' ');
          }
        } else if (val !== propdef.default && val !== null && val !== '') {
          attrs[k] = val;
        }
      }
    }            
    return attrs;
  }
}

elation.events.add(null, 'webui_editor_export_node', xrf_export.node )
elation.events.add(null, 'webui_editor_export',      xrf_export.scene )
