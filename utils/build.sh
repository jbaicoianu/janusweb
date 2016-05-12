#!/bin/sh

if [ ! -e build ]; then
  mkdir build
fi

if [ -e build/media ]; then
  rm -r build/media
fi

cp -r `pwd`/media build/media
mv build/media/index.html build/index.html
cd ../../
./elation component runjs utils.pack -config janusweb.config -bundle janusweb ui.themes.dark janusweb.client engine.assetworker
mv janusweb.css janusweb.js components/janusweb/build
echo 'Built new release in ./build/'

