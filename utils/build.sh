#!/bin/sh

BUILDDIR=$(pwd)/build
if [ ! -e "$BUILDDIR" ]; then
  mkdir "$BUILDDIR"
fi

if [ -e "$BUILDDIR/media" ]; then
  rm -r "$BUILDDIR/media"
fi

CFGNAME="$1"
if [ -z "$CFGNAME" ]; then
  CFGNAME="config"
fi

cp -r $(pwd)/media "$BUILDDIR/media"
mv "$BUILDDIR/media/index.html" "$BUILDDIR/index.html"
if [ -e elation ] && [ -e elation/components/janusweb ]; then
  echo 'Building from project-local elation directory'
  cd elation/
else
  echo 'Building from parent directory'
  cd ../../
fi
./elation component runjs utils.pack -config janusweb.$CFGNAME -bundle janusweb janusweb.client engine.assetworker
mv janusweb.css janusweb.js "$BUILDDIR"
echo Built new release in \"$BUILDDIR/\"
