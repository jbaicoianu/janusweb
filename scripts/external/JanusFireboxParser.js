JanusFireboxParser = function() {
}

JanusFireboxParser.prototype.parse = function(source, baseurl, datapath) {
  var xml = this.parseXML(source, false, true); 
  var rooms = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.room', {})); 
  var room = {_children: {}};
  for (var i = 0; i < rooms.length; i++) {
    var attrs = Object.keys(rooms[i]).filter(function(k) { return (k[0] != '_'); });
    attrs.forEach(function(k) {
      room[k] = rooms[i][k];
    });
    if (rooms[i]._children) {
      Object.keys(rooms[i]._children).forEach(function(k) {
        room._children[k] = rooms[i]._children[k];
      });
    }
  }
  var roomdata = this.getRoomData(xml, room, baseurl, datapath);
  roomdata.source = source;
  return roomdata;
}
JanusFireboxParser.prototype.getRoomData = function(xml, room, baseurl, datapath) {
  var assets = this.parseAssets(xml, baseurl, datapath);

  var parseNode = this.parseNode.bind(this);

  var roomdata = {
    assets: assets,
    room: this.parseNode(room)
  };
  for (var k in room._children) {
    var objects = this.getAsArray(room._children[k]);
    roomdata[k] = objects.map(parseNode);
  }

  // TODO - some rooms have orphan objects, outside of the <Room> tag. 
  // We should parse these too, but I don't have any examples to test with
/*
  var orphantypes = ['link', 'image', 'image3d', 'video', 'sound', 'text', 'paragraph', 'light', 'particle', 'ghost'];
  for (var i = 0; i < orphantypes.length; i++) {
    var type = orphantypes[i],
        orphans = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.' + type));
    if (orphans && orphans.length > 0) {
      if (!roomdata[type]) roomdata[type] = [];
      roomdata[type].push.apply(roomdata[type], orphans);
    }
  };
*/
  return roomdata;
}
JanusFireboxParser.prototype.getAsArray = function(arr) {
  return (arr instanceof Array ? arr : [arr]);
}
JanusFireboxParser.prototype.parseAssets = function(xml, baseurl, datapath) {
  var assetxml = this.arrayget(xml, 'fireboxroom._children.assets.0', {}); 
  var objectassets = this.getAsArray(this.arrayget(assetxml, "_children.assetobject", [])); 
  var soundassets = this.getAsArray(this.arrayget(assetxml, "_children.assetsound", [])); 
  var imageassets = this.getAsArray(this.arrayget(assetxml, "_children.assetimage", [])); 
  var videoassets = this.getAsArray(this.arrayget(assetxml, "_children.assetvideo", [])); 
  var scriptassets = this.getAsArray(this.arrayget(assetxml, "_children.assetscript", [])); 
  var ghostassets = this.getAsArray(this.arrayget(assetxml, "_children.assetghost", [])); 
  var websurfaceassets = this.getAsArray(this.arrayget(assetxml, "_children.assetwebsurface", [])); 
  var assetlist = [];
  if (!datapath) {
    datapath = 'http://web.janusvr.com/media';
  }
  var fixURLEncoding = this.fixURLEncoding.bind(this);
  imageassets.forEach(function(n) { 
    var src = fixURLEncoding(n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
    assetlist.push({ assettype:'image', name:n.id, src: src, baseurl: baseurl, hasalpha: n.hasalpha, proxy: n.proxy });
  });
  videoassets.forEach(function(n) { 
    var src = fixURLEncoding(n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
    assetlist.push({ 
      assettype:'video', 
      name:n.id, 
      src: src, 
      loop: n.loop,
      sbs3d: n.sbs3d == 'true',  
      ou3d: n.ou3d == 'true',  
      auto_play: n.auto_play == 'true',  
      baseurl: baseurl,
      proxy: n.proxy && n.proxy != 'false'
    }); 
  });
  soundassets.forEach(function(n) { 
    var src = fixURLEncoding(n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
    assetlist.push({ 
      assettype:'sound', 
      name:n.id, 
      src: src,
      baseurl: baseurl
    }); 
  });
  var websurfaces = {};
  websurfaceassets.forEach(function(n) { websurfaces[n.id] = n; });
  scriptassets.forEach(function(n) { 
    var src = fixURLEncoding(n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
    assetlist.push({ 
      assettype:'script', 
      name: src,
      src: src,
      baseurl: baseurl
    }); 
  });

  var objlist = []; 
  objectassets.forEach(function(n) { 
    if (n.src) {
      var src = fixURLEncoding(n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
      var mtlsrc = (n.mtl && n.mtl.match(/^file:/) ? n.mtl.replace(/^file:/, datapath) : n.mtl);
      if (mtlsrc && !mtlsrc.match(/^(https?:)?\/\//)) mtlsrc = baseurl + mtlsrc;
      var srcparts = src.split(' ');
      src = srcparts[0];
      assetlist.push({assettype: 'model', name: n.id, src: src, mtl: mtlsrc, tex_linear: n.tex_linear, tex0: n.tex || n.tex0 || srcparts[1], tex1: n.tex1 || srcparts[2], tex2: n.tex2 || srcparts[3], tex3: n.tex3 || srcparts[4]}); 
    }
  }); 
  var assets = {
    object: objectassets,
    image: imageassets,
    sound: soundassets,
    video: videoassets,
    websurfaces: websurfaces,
    scripts: scriptassets,
    ghosts: ghostassets,
    assetlist: assetlist
  };
  return assets;
}

JanusFireboxParser.prototype.getVectorValue = function(vector, defaultvalue) {
  if (typeof defaultvalue == 'undefined') {
    defaultvalue = null;//[0,0,0];
  }
  if (typeof vector == 'string') {
    return vector.split(' ').map(parseFloat);
  } else if (vector instanceof THREE.Vector3) {
    return vector.toArray();
  } else if (typeof vector == 'undefined') {
    return defaultvalue;
  }
  return vector;
}
JanusFireboxParser.prototype.parseNode = function(n) {
  var nodeinfo = {};
  var attrs = Object.keys(n);
  attrs.forEach(function(k) {
    nodeinfo[k] = (n[k] == 'false' ? false : n[k]);
  });

  
  nodeinfo.pos = this.getVectorValue(n.pos);
  nodeinfo.scale = this.getVectorValue(n.scale, [1,1,1]);
  nodeinfo.orientation = this.getOrientation(n.xdir, n.ydir || n.up, n.zdir || n.fwd);
  nodeinfo.col = (n.col ? (n.col[0] == '#' ? [parseInt(n.col.substr(1,2), 16)/255, parseInt(n.col.substr(3, 2), 16)/255, parseInt(n.col.substr(5, 2), 16)/255] : n.col) : null);
  
  var minscale = 1e-6;
/*
  nodeinfo.scale[0] = Math.max(minscale, nodeinfo.scale[0]);
  nodeinfo.scale[1] = Math.max(minscale, nodeinfo.scale[1]);
  nodeinfo.scale[2] = Math.max(minscale, nodeinfo.scale[2]);
*/
  if (nodeinfo.scale[0] < minscale && nodeinfo.scale[0] > -minscale) nodeinfo.scale[0] = minscale;
  if (nodeinfo.scale[1] < minscale && nodeinfo.scale[1] > -minscale) nodeinfo.scale[1] = minscale;
  if (nodeinfo.scale[2] < minscale && nodeinfo.scale[2] > -minscale) nodeinfo.scale[2] = minscale;

  return nodeinfo;
}

JanusFireboxParser.prototype.getOrientation = function(xdir, ydir, zdir) {
  if (xdir) {
    xdir = (xdir instanceof THREE.Vector3 ? xdir : new THREE.Vector3().fromArray(xdir.split(' '))).normalize();
  } else {
    xdir = new THREE.Vector3(1,0,0);
  }
  if (ydir) {
    ydir = (ydir instanceof THREE.Vector3 ? ydir : new THREE.Vector3().fromArray(ydir.split(' '))).normalize();
  } else {
    ydir = new THREE.Vector3(0,1,0);
  }
  if (zdir) {
    zdir = (zdir instanceof THREE.Vector3 ? zdir : new THREE.Vector3().fromArray(zdir.split(' '))).normalize();
  } else {
    zdir = new THREE.Vector3(0,0,1);
  }

  var newydir = ydir.clone().sub(zdir).multiplyScalar(ydir.dot(zdir)).normalize();
  xdir.crossVectors(ydir, zdir).normalize();

  var mat4 = new THREE.Matrix4().makeBasis(xdir, ydir, zdir);
  var quat = new THREE.Quaternion();
  var pos = new THREE.Vector3();
  var scale = new THREE.Vector3();
  //quat.setFromRotationMatrix(mat4);
  mat4.decompose(pos, quat, scale);
  quat.normalize();
  //quat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)));
  return quat;
}
JanusFireboxParser.prototype.parseXML = function(imgxml, leaf, forceLower) {
  var node, root, parent, xmldoc;
  if (imgxml.nodeName) {
    xmldoc = node = imgxml;
  } else {
    try {
      if (window.DOMParser) {
        var parser = new DOMParser();
        xmldoc = parser.parseFromString(imgxml,"application/xml");
        node = xmldoc.firstChild;
      } else {
        node = new ActiveXObject("Microsoft.XMLDOM");
        node.async = "false";
        node.loadXML(imgxml).firstChild;
      }

      // Chrome doesn't throw an exception for malformed XML, so we look for a <parsererror> xml tag
      var parsererrors = node.getElementsByTagName("parsererror");
      if (parsererrors.length > 0) {
        // Extract the message from the first div child of the <parsererror> element
        var errorel = parsererrors[0].getElementsByTagName('div')[0] || parsererrors[0];
        throw new JanusFireboxParserException(errorel.innerHTML);
      }
    } catch (e) {
      throw new JanusFireboxParserException(e.message);
    }
  }
  root = {};
  if (!leaf) {
    var rootname = node.tagName;
    if (forceLower) rootname = rootname.toLowerCase();
    if (!root[rootname]) root[rootname] = {};
    parent = root[rootname];
    //node = parent[node.tagName];
  } else {
    parent = root;
  }
  if (node.attributes) {
    for (var i = 0; i < node.attributes.length; i++) {
      var name = node.attributes[i].nodeName;
      if (forceLower) name = name.toLowerCase();
      var value = node.attributes[i].nodeValue;
      parent[name] = value;
    }
  }
  if (node.childNodes) {
    for (var j = 0; j < node.childNodes.length; j++) {
      var child = node.childNodes[j];
      var nodename = child.nodeName;
      if (forceLower) nodename = nodename.toLowerCase();
      if (!parent._children) parent._children = {};
      if (!parent._children[nodename]) {
        parent._children[nodename] = [];
      } else if (parent._children[nodename].constructor !== Array) {
        parent._children[nodename] = [parent._children[nodename]];
      }
      if (node.getElementsByTagName(child.tagName).length > 0) {
        parent._children[nodename].push(this.parseXML(child, true, forceLower));
      } else if (child.nodeName) {
        if (child.nodeName == "#text" || child.nodeName == "#cdata-section") {
          // this gets confused if you have multiple text/cdata nodes...
          if (!child.nodeValue.match(/^[\s\n]*$/m)) {
            parent._content = child.nodeValue;
          }
        } else {
          parent._children[nodename] = parent._children[nodename].concat(this.parseXML(child, true, forceLower));
        }
      }
    }
  }
  return root;
};

/**
 * Retrieves specified dot-separated value from a multilevel object element 
 *
 * @function JanusFireboxParser.arrayget
 * @param {object} obj
 * @param {string} name
 * @param {object|number|string} [defval] default value if none found
*/
JanusFireboxParser.prototype.arrayget = function(obj, name, defval) {
  var ptr = obj;
  var x = name.split(".");
  for (var i = 0; i < x.length; i++) {
    if (ptr==null || (!(ptr[x[i]] instanceof Array) && !(ptr[x[i]] instanceof Object) && i != x.length-1)) {
      ptr = null;
      break;
    }
    ptr = ptr[x[i]];
  }
  if (typeof ptr == "undefined" || ptr === null) {
    return (typeof defval == "undefined" ? null : defval);
  }
  return ptr;
};

/**
 * Fixes encoding of URL strings if they weren't properly encoded
 *
 * @function JanusFireboxParser.fixURLEncoding
 * @param {string} url
 * @returns {string} encoded URL
*/
JanusFireboxParser.prototype.fixURLEncoding = function(url) {
  var fixed = url;
  if (url.indexOf(' ') != -1) {
    fixed = encodeURI(url);
  }
  return fixed;
};

/**
 * Exception class for XML parse errors
 */
function JanusFireboxParserException(msg) {
  this.message = msg;
}
