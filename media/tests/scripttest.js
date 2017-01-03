print('this is the test script!');
//print('the room url is', janus.currenturl());
room.poop = 1;
var selectedObject = false, selectedColor = [1,1,1];

room.onLoad = function() {
  print('the room loaded!: ' + uniqueId());
debugger;
  room.createObject('object', {js_id: 'box', id: 'cube', pos: Vector(0, 1, 7), scale: Vector(2, 2, 0.1), col: Vector(1, 0, 0)});
  room.createObject('text', {js_id: 'mytext', text: 'whazzup', pos: Vector(0, 1, 5), fwd: Vector(1,0,0), zdir: Vector(1,0,0), col: '#ff00ff'});
}
room.update = function() {
console.log('do shit in room 1');
  if (player.pos.x > 10) player.pos.x = 10;
  if (player.pos.x < -10) player.pos.x = -10;
  if (player.pos.z > 10) player.pos.z = 10;
  if (player.pos.z < -10) player.pos.z = -10;

  var obj = room.objects[player.cursor_object];
/*
  if (obj && obj !== selectedObject) {
    selectedColor = Vector(obj.col.x, obj.col.y, obj.col.z);
    selectedObject = obj;
    obj.col = Vector(0,0,1);
  } else if (selectedObject) {
    selectedObject.col = selectedColor;
    selectedObject = false;
    selectedColor = false;
  }
*/
}
room.onKeyDown = function(ev) {
  //print('KEY ME: "' + ev.keyCode + '"');
  if (ev.keyCode == 'I') {
    room.objects['mytext'].vel.y = 0.5;
  }
  if (ev.keyCode == 'K') {
    room.objects['mytext'].vel.y = -0.5;
  }
  if (ev.keyCode == 'J') {
    room.objects['mytext'].vel.x = -0.5;
  }
  if (ev.keyCode == 'L') {
    room.objects['mytext'].vel.x = 0.5;
  }
  if (ev.keyCode == 'U') {
    room.objects['mytext'].vel.z = -0.5;
  }
  if (ev.keyCode == 'O') {
    room.objects['mytext'].vel.z = 0.5;
  }
  //print('test');
}
room.onKeyUp = function(ev) {
  if (ev.keyCode == 'I') {
    room.objects['mytext'].vel.y = 0;
  }
  if (ev.keyCode == 'K') {
    room.objects['mytext'].vel.y = 0;
  }
  if (ev.keyCode == 'J') {
    room.objects['mytext'].vel.x = 0;
  }
  if (ev.keyCode == 'L') {
    room.objects['mytext'].vel.x = 0;
  }
  if (ev.keyCode == 'U') {
    room.objects['mytext'].vel.z = 0;
  }
  if (ev.keyCode == 'O') {
    room.objects['mytext'].vel.z = 0;
  }
}
room.onMouseDown = function(ev) {
  //print('MOUSE DOWN', player.cursor_object);
  var obj = room.objects[player.cursor_object];
  if (obj) {
    selectedColor = Vector(obj.col.r, obj.col.g, obj.col.b);
    selectedObject = obj;
    obj.col = Vector(0,1,0);
  }
}
room.onMouseUp = function(ev) {
  //print('MOUSE UP', ev);
  if (selectedObject && selectedColor) {
    selectedObject.col = selectedColor;
print('set color!', selectedColor);
    selectedObject = false;
    selectedColor = false;
  }
}
room.onClick = function(ev) {
  //print('CLICK', ev);
}
