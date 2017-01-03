
room.onClick = function()
{
  //rain 10 cubes from the top
  for (var i=0; i<10; ++i) {
    room.createObject("Object", {id:"cube", collision_id:"cube", pos:Vector(Math.random()*10-5, 16.0, Math.random()*10-5), vel:Vector(Math.random()*.1-.05, Math.random()*.1-.05, Math.random()*.1-.05), col:Vector(Math.random(), Math.random(), Math.random()), scale:Vector(Math.random(), Math.random(), Math.random()), collision_static:"false"});   
  }

  //shoot a sphere from the face
  var p = new Vector();
  p.x = player.pos.x;
  p.y = player.pos.y + 1.5;
  p.z = player.pos.z;

  var v = new Vector();
  v.x = player.view_dir.x * 10.0;
  v.y = player.view_dir.y * 10.0;
  v.z = player.view_dir.z * 10.0;

  room.createObject("Object", {id:"sphere", collision_id:"sphere", pos:p, vel:v, scale:Vector(0.5,0.5,0.5), col:Vector(Math.random(), Math.random(), Math.random()), collision_static:"false"});  
}
