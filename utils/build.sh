#!/bin/bash

VERSION=$(node -pe "require('./package.json').version")
BUILDROOT=$(pwd)/build
BUILDBASE=${VERSION}
BUILDDIR=${BUILDROOT}/${BUILDBASE}
ZIPNAME=janusweb-${VERSION}


echo $BUILDROOT
echo $BUILDDIR
if [ ! -e "$BUILDDIR" ]; then
  mkdir -p "$BUILDDIR"
fi

if [ -e "$BUILDDIR/media" ]; then
  rm -r "$BUILDDIR/media"
fi

CFGNAME="$1"
if [ -z "$CFGNAME" ]; then
  CFGNAME="config"
fi

cp -al $(pwd)/media "$BUILDDIR/media"
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

cd $BUILDROOT
tar czf "$ZIPNAME.tar.gz" "$BUILDBASE" --transform=s/${BUILDBASE}/$ZIPNAME/ 

