#!/bin/sh
set -e

VERSION=$(find build -type d -mindepth 1 -maxdepth 1)

test -f "$VERSION/index.html" || { echo "[x] could not find $VERSION/index.html (run 'npm run build' first)"; exit 1;}

download(){
  url="https://redbean.dev/redbean-3.0.0.com"
  checksum="382f1288bb96ace4bab5145e7df236846c33cc4f1be69233710682a9e71e7467  $VERSION/janusweb.com"
  verify(){
    echo "$checksum" > /tmp/checksum
    sha256sum -c /tmp/checksum || { echo "psuedosecurity checksum failed"; exit 1; }
    chmod +x $VERSION/janusweb.com
  }
  test -f $VERSION/janusweb.com || {
    wget "$url" -O $VERSION/janusweb.com
    verify
  }
}

configure(){
  lua='
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
  '
  cd $VERSION
  args="-D\n." # default args (-i /zip/janusweb.lua -D .)
  echo -e "$args" > .args
  echo -e "$lua"  > .init.lua
  ln -fs media/images/icons/janusweb-256x256.ico favicon.ico
  zip -r janusweb.com .args .init.lua *
}

download
configure
