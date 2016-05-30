#!/bin/sh

if [ ! -e build ]; then
  mkdir build
fi

if [ -e build/media ]; then
  rm -r build/media
fi

CFGNAME="$1"
if [ -z "$CFGNAME" ]; then
  CFGNAME="config"
fi

cp -r `pwd`/media build/media
mv build/media/index.html build/index.html
if [ -e elation ] && [ -e elation/components/janusweb ]; then
  echo 'Building from project-local elation directory'
  cd elation/
else
  echo 'Building from parent directory'
  cd ../../
fi
./elation component runjs utils.pack -config janusweb.$CFGNAME -bundle janusweb janusweb.client engine.assetworker
mv janusweb.css janusweb.js components/janusweb/build
echo 'Built new release in ./build/'

grep "=== BEGIN" components/janusweb/build/janusweb.js

