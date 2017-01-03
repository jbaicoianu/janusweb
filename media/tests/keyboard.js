room.onKeyDown = function(ev) {
  console.log('key down!', ev);
  room.objects['keystatus'].text = 'Pressed: ' + ev.keyCode;
}
room.onKeyUp = function(ev) {
  console.log('key up!', ev);
  room.objects['keystatus'].text = 'Released: ' + ev.keyCode;
}
