#!/bin/sh
set -e

VERSION=$(find build -type d -mindepth 1 -maxdepth 1)

test -f "$VERSION/index.html" || { echo "[x] could not find $VERSION/index.html (run 'npm run build' first)"; exit 1;}

download(){
  url="https://redbean.dev/redbean-3.0.0.com"
  checksum="382f1288bb96ace4bab5145e7df236846c33cc4f1be69233710682a9e71e7467  $VERSION/janusxr.com"
  verify(){
    echo "$checksum" > /tmp/checksum
    sha256sum -c /tmp/checksum || { echo "psuedosecurity checksum failed"; exit 1; }
    chmod +x $VERSION/janusxr.com
  }
  test -f $VERSION/janusxr.com || {
    wget "$url" -O $VERSION/janusxr.com
    verify
  }
}

configure(){
  cd $VERSION
  ln -fs media/images/icons/janusweb-256x256.ico favicon.ico
  zip -r janusxr.com *
  set -x
  cd ../../janusxr.com
  zip -r ../$VERSION/janusxr.com .* *
}

download
configure
