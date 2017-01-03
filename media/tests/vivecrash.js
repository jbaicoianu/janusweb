var cube, sphere;

var label1, label2, label3, hud;
var axis;

room.onLoad = function() {
  cube = room.createObject('Object', {
    id: 'cube',
    js_id: 'wtfd00d',
    pos: Vector(1,0,5),
    scale: Vector(0.1,0.1,0.1),
    col: Vector(1,0,0)
  });
  sphere = room.createObject('Object', {
    id: 'sphere',
    js_id: 'wtfd00d2',
    pos: Vector(-1,0,5),
    scale: Vector(0.1,0.1,0.1),
    col: Vector(1,0,0)
  });

  axis = room.createObject('Object', {
    id: 'cylinder',
    js_id: 'axisdir',
    scale: V(.1,1,.1),
    pos: V(0,0,0)
  });
  hud = room.createObject('Text', {
    js_id: 'hud',
    scale: V(1,1,1),
    pos: V(0,1,0)
  });

  label1 = room.createObject('Text', {
    js_id: 'label1',
    pos: V(0.5,0.1,0)
  });
  label2 = room.createObject('Text', {
    js_id: 'label2',
    pos: V(0.5,0.05,0)
  });
  label3 = room.createObject('Text', {
    js_id: 'label3',
    pos: V(0.5,0,0)
  });

  hud.appendChild(label1);
  hud.appendChild(label2);
  hud.appendChild(label3);
}

room.update = function() {
  label1.text = 'Player: ' + player.pos.x + ', ' + player.pos.y + ', ' + player.pos.z;
  label2.text = 'Head  : ' + player.head_pos.x + ', ' + player.head_pos.y + ', ' + player.head_pos.z;
  label3.text = 'Hand  : ' + player.hand0_pos.x + ', ' + player.hand0_pos.y + ', ' + player.hand0_pos.z;

  hud.pos = translate(player.pos, player.head_pos);
  hud.zdir = player.zdir;

  if (player.hand0_active) {
    cube.col = V(0,1,0);
    //cube.pos = translate(player.hand0_pos, player.pos);
    cube.pos = player.hand0_pos;
  } else {
    cube.col = V(1,0,0);
  }
  if (player.hand1_active) {
    sphere.col = V(0,1,0);
    sphere.pos = player.hand1_pos;
  } else {
    sphere.col = V(1,0,0);
  }
}
