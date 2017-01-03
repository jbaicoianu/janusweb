var num = 0;
var rowsize = 24;
var conetimer = false;
var cubetimer = false;

room.onLoad = function() {
  spawnSpheres();

  conetimer = setInterval(function() { 
    room.playSound('bloop');
    spawnSingleObject('cone'); 
  }, 5000);
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

room.update = function() {
}

function spawnSingleObject(type) {
  var pos = num++ * 2;
  room.createObject('Object', {id: type, js_id: 'thing_' + num, pos: Vector(pos % rowsize, Math.floor(pos / rowsize), 5), color: '1 0 0'});
}

function spawnSpheres() {
  room.playSound('bonk');
  spawnSingleObject('sphere');
  setTimeout(spawnSpheres, 1000);
}
