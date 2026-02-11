HidePath("/usr/share/zoneinfo/")
HidePath("/usr/share/ssl/")
homepage = false
homepath = false
home = arg[-1]:gsub(".*/","")
              :gsub(".com","")
ext = { "txt", "xml", "html", "pdf", "mp3", "yaml", "json", "xlsx", "png", "jpg", "glb", "gltf", "dae", "obj"}
for k,v in pairs(ext) do
  file = string.format("%s.%s", home, v)
  if( path.exists( file ) ) then homepath = "/" .. file; end
end

if( homepath ) then 
  print("✅ detected " .. homepath .. " (setting as spatial home)")
  homepage = Slurp("/zip/index.html"):gsub("<janus%-viewer .-</janus%-viewer>","<janus-viewer src=\"" .. homepath .. "\"></janus-viewer>")

  function OnHttpRequest()
    path = GetPath()
    if( homepage and path == "/" ) then
      SetStatus(200)
      SetHeader("Content-Type", "text/html; charset=utf-8")
      SetHeader("Access-Control-Allow-Origin", "*")
      Write(homepage)
    else
      Route()
    end
  end
end
LaunchBrowser()

