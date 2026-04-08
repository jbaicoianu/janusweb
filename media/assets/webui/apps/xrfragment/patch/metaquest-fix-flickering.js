// Meta Quest 2 results in rapid flickering when loading a new room
// therefore we show the shroud while loading
setActiveRoom = room.janus.setActiveRoom.bind(room.janus)
room.janus.setActiveRoom = function(url,referer,skipURL){
  if( url.replace(/#.*/,'') != room.url ){
    room.fadeAudioOut()
    setTimeout( function(){ 
      setActiveRoom.apply(room.janus, [url, referer, skipURL])
    }, 500)
  }else{ 
    room.urlhash = url.match('#') ? url.replace(/.*#/,'') : 'spawn'
    room.setPlayerPosition()
    // ignore same-room setActiveRoom-calls (it restarts audio when clicking internal hyperlinks)
  }
}
