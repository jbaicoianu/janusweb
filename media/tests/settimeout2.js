var cubetimer = false;
var num = 0,
    rowsize = 20;

room.onLoad = function() {
  setInterval(function() { 
    room.playSound('bloop');
    spawnSingleObject('sphere'); 
  }, 2000);
}
room.update = function() {
}

room.onMouseDown = function() {
  spawnSingleObject('cube');
  if (cubetimer) {
    clearInterval(cubetimer);
  }
  cubetimer = setInterval(function() { 
    spawnSingleObject('cube'); 
  }, 100);
}
room.onMouseUp = function() {
  //spawnSingleObject('cylinder');
  if (cubetimer) {
    clearInterval(cubetimer);
  }
}

function spawnSingleObject(type) {
  var pos = num++ * 2;
  room.createObject('Object', {id: type, js_id: 'thing_' + num, pos: Vector(pos % rowsize, Math.floor(pos / rowsize), 5), color: '1 0 0'});
}
