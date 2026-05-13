#!/bin/sh
set -e

VERSION=$( $(which node) -pe "require('./package.json').version")
BUILD=build/$VERSION

test -f "$BUILD/index.html" || { echo "[x] could not find $BUILD/index.html (run 'npm run build' first)"; exit 1;}

download(){
  rm $BUILD/*.com || true # delete old
  url="https://redbean.dev/redbean-3.0.0.com"
  checksum="382f1288bb96ace4bab5145e7df236846c33cc4f1be69233710682a9e71e7467  $BUILD/janusxr.com"
  verify(){
    echo "$checksum" > /tmp/checksum
    sha256sum -c /tmp/checksum || { echo "psuedosecurity checksum failed"; exit 1; }
    chmod +x $BUILD/janusxr.com
  }
  test -f $BUILD/janusxr.com || {
    wget "$url" -O $BUILD/janusxr.com
    verify
  }
}

configure(){
  cd $BUILD
  ln -fs media/images/icons/janusweb-256x256.ico favicon.ico
  sed -i 's|<janus-viewer src.*|<janus-viewer src="./index.html"></janus-viewer>|g' index.html
  zip -r janusxr.com * -x janusweb.min.js
  set -e
  set -x
  cd ../../janusxr.com
  zip -r ../$BUILD/janusxr.com .args .init.lua *
}

download
configure
