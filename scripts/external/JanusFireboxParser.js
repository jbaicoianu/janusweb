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
  var objects = this.getAsArray(this.arrayget(room, '_children.object', [])); 
  var links = this.getAsArray(this.arrayget(room, '_children.link', [])); 
  var sounds = this.getAsArray(this.arrayget(room, '_children.sound', [])); 
  var images = this.getAsArray(this.arrayget(room, '_children.image', [])); 
  var image3ds = this.getAsArray(this.arrayget(room, '_children.image3d', [])); 
  var texts = this.getAsArray(this.arrayget(room, '_children.text', [])); 
  var paragraphs = this.getAsArray(this.arrayget(room, '_children.paragraph', [])); 
  var lights = this.getAsArray(this.arrayget(room, '_children.light', [])); 
  var videos = this.getAsArray(this.arrayget(room, '_children.video', [])); 
  var particles = this.getAsArray(this.arrayget(room, '_children.particle', [])); 
  var ghosts = this.getAsArray(this.arrayget(room, '_children.ghost', [])); 

  var orphanobjects = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.object')); 
  var orphanlinks = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.link')); 
  var orphansounds = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.sound')); 
  var orphanvideos = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.video')); 
  var orphanimages = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.image')); 
  var orphantexts = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.text')); 
  var orphanparagraphs = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.paragraph')); 
  var orphanparticles = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.particle')); 
  var orphanlights = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.light')); 
  var orphanghosts = this.getAsArray(this.arrayget(xml, 'fireboxroom._children.ghost')); 

  if (orphanobjects && orphanobjects[0]) objects.push.apply(objects, orphanobjects);
  if (links && orphanlinks[0]) links.push.apply(links, orphanlinks);
  if (images && orphanimages[0]) images.push.apply(images, orphanimages);
  if (videos && orphanvideos[0]) videos.push.apply(videos, orphanvideos);
  if (sounds && orphansounds[0]) sounds.push.apply(sounds, orphansounds);
  if (texts && orphantexts[0]) texts.push.apply(texts, orphantexts);
  if (paragraphs && orphanparagraphs[0]) paragraphs.push.apply(paragraphs, orphanparagraphs);
  if (lights && orphanlights[0]) lights.push.apply(lights, orphanlights);
  if (particles && orphanparticles[0]) particles.push.apply(particles, orphanparticles);
  if (ghosts && orphanghosts[0]) ghosts.push.apply(ghosts, orphanghosts);

  var parseNode = this.parseNode.bind(this);

  return {
    assets: assets,
    room: this.parseNode(room),
    objects: objects.map(parseNode),
    links: links.map(parseNode),
    sounds: sounds.map(parseNode),
    images: images.map(parseNode),
    image3ds: image3ds.map(parseNode),
    texts: texts.map(parseNode),
    paragraphs: paragraphs.map(parseNode),
    lights: lights.map(parseNode),
    videos: videos.map(parseNode),
    particles: particles.map(parseNode),
    ghosts: ghosts.map(parseNode),
  };
}
JanusFireboxParser.prototype.getAsArray = function(arr) {
  return (arr instanceof Array ? arr : [arr]);
}
JanusFireboxParser.prototype.parseAssets = function(xml, baseurl, datapath) {
  var assetxml = this.arrayget(xml, 'fireboxroom._children.assets', {}); 
  var objectassets = this.getAsArray(this.arrayget(assetxml, "_children.assetobject", [])); 
  var soundassets = this.getAsArray(this.arrayget(assetxml, "_children.assetsound", [])); 
  var imageassets = this.getAsArray(this.arrayget(assetxml, "_children.assetimage", [])); 
  var videoassets = this.getAsArray(this.arrayget(assetxml, "_children.assetvideo", [])); 
  var scriptassets = this.getAsArray(this.arrayget(assetxml, "_children.assetscript", [])); 
  var websurfaceassets = this.getAsArray(this.arrayget(assetxml, "_children.assetwebsurface", [])); 
  var assetlist = [];
  if (!datapath) {
    datapath = 'http://web.janusvr.com/media';
  }
  imageassets.forEach(function(n) { 
    var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
    assetlist.push({ assettype:'image', name:n.id, src: src, baseurl: baseurl }); 
  });
  videoassets.forEach(function(n) { 
    var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
    assetlist.push({ 
      assettype:'video', 
      name:n.id, 
      src: src, 
      loop: n.loop,
      sbs3d: n.sbs3d == 'true',  
      ou3d: n.ou3d == 'true',  
      auto_play: n.auto_play == 'true',  
      baseurl: baseurl
    }); 
  });
  soundassets.forEach(function(n) { 
    var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
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
    var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
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
      var src = (n.src.match(/^file:/) ? n.src.replace(/^file:/, datapath) : n.src);
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
    assetlist: assetlist
  };
  return assets;
}

JanusFireboxParser.prototype.parseNode = function(n) {
  var nodeinfo = {};
  var attrs = Object.keys(n);
  attrs.forEach(function(k) {
    nodeinfo[k] = (n[k] == 'false' ? false : n[k]);
  });

  nodeinfo.pos = (n.pos ? (n.pos instanceof Array ? n.pos : n.pos.split(' ')).map(parseFloat) : [0,0,0]);
  nodeinfo.scale = (n.scale ? (n.scale instanceof Array ? n.scale : (n.scale instanceof THREE.Vector3 ? n.scale.toArray() : n.scale.split(' '))).map(parseFloat) : [1,1,1]);
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
  if (xdir) xdir = new THREE.Vector3().fromArray(xdir.split(' ')).normalize();
  if (ydir) ydir = new THREE.Vector3().fromArray(ydir.split(' ')).normalize();
  if (zdir) zdir = new THREE.Vector3().fromArray(zdir.split(' ')).normalize();

  if (xdir && !ydir && !zdir) {
    ydir = new THREE.Vector3(0,1,0);
    zdir = new THREE.Vector3().crossVectors(xdir, ydir);
  }
  if (!xdir && !ydir && zdir) {
    ydir = new THREE.Vector3(0,1,0);
    xdir = new THREE.Vector3().crossVectors(ydir, zdir);
  }

  if (!xdir && ydir && zdir) {
    xdir = new THREE.Vector3().crossVectors(zdir, ydir);
  }
  if (xdir && !ydir && zdir) {
    ydir = new THREE.Vector3().crossVectors(xdir, zdir).multiplyScalar(-1);
  }
  if (xdir && ydir && !zdir) {
    zdir = new THREE.Vector3().crossVectors(xdir, ydir);
  }
  if (!xdir) xdir = new THREE.Vector3(1,0,0);
  if (!ydir) ydir = new THREE.Vector3(0,1,0);
  if (!zdir) zdir = new THREE.Vector3(0,0,1);

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
  var node, root, parent;
  if (imgxml.nodeName) {
    node = imgxml;
  } else {
    if (window.DOMParser) {
      var parser = new DOMParser();
      node = parser.parseFromString(imgxml,"application/xml").firstChild;
    } else {
      node = new ActiveXObject("Microsoft.XMLDOM");
      node.async = "false";
      node.loadXML(imgxml).firstChild; 
    }
  }
  root = {};
  if (!leaf) {
    var rootname = node.tagName;
    if (forceLower) rootname = rootname.toLowerCase();
    root[rootname] = {};
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
      if (node.getElementsByTagName(child.tagName).length > 1) {
        if (!parent._children) parent._children = {};
        if (!parent._children[nodename]) {
          parent._children[nodename] = [];
        }
        parent._children[nodename].push(this.parseXML(child, true, forceLower));
      } else if (child.nodeName) {
        if (child.nodeName == "#text" || child.nodeName == "#cdata-section") {
          // this gets confused if you have multiple text/cdata nodes...
          if (!child.nodeValue.match(/^[\s\n]*$/m)) {
            parent._content = child.nodeValue;
          }
        } else {
          if (!parent._children) parent._children = {};
          parent._children[nodename] = this.parseXML(child, true, forceLower);
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
