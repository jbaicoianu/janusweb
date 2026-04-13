// ignore same-room setActiveRoom-calls (it restarts audio when clicking internal hyperlinks)
setActiveRoom = room.janus.setActiveRoom.bind(room.janus)
room.janus.setActiveRoom = function(url,referer,skipURL){
  if( String(url).replace(/#.*/,'') != room.url ){
    room.fadeAudioOut()
    setTimeout( function(){ 
      setActiveRoom.apply(room.janus, [url, referer, skipURL])
    }, 500)
  }else{ 
    room.urlhash = String(url).match('#') ? String(url).replace(/.*#/,'') : 'spawn'
    room.setPlayerPosition()
    // ignore same-room setActiveRoom-calls (it restarts audio when clicking internal hyperlinks)
  }
}
