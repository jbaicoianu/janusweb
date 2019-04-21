#!/bin/bash

NODEJS=`which nodejs`
if [ -z "$NODEJS" ]; then
  NODEJS=`which node`
fi
if [ -z "$NODEJS" ]; then
  echo "ERROR - Can't find 'nodejs' or 'node' binary in path, exiting"
  exit
fi


VERSION=$("$NODEJS" -pe "require('./package.json').version")
BUILDROOT=$(pwd)/build
BUILDBASE=${VERSION}
BUILDDIR=${BUILDROOT}/${BUILDBASE}
ZIPNAME=janusweb-${VERSION}


echo $BUILDROOT
echo $BUILDDIR
echo -n 'nodejs: $NODEJS '
$NODEJS --version

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
mv "$BUILDDIR/media/index.html" "$BUILDDIR/media/manifest.json" "$BUILDDIR/"
if [ -e elation ] && [ -e elation/components/janusweb ]; then
  echo 'Building from project-local elation directory'
  cd elation/
else
  echo 'Building from parent directory'
  cd ../../
fi
./elation component runjs utils.pack -config janusweb.$CFGNAME -bundle janusweb janusweb.client
./elation component runjs utils.pack -config janusweb.$CFGNAME -bundle janusweb.assetworker engine.assetworker
mv janusweb.css janusweb.js janusweb.assetworker.js "$BUILDDIR"
echo -n 'Minifying'
cat "$BUILDDIR/janusweb.js" |uglifyjs >"$BUILDDIR/janusweb.min.js" && echo -n '.'
cat "$BUILDDIR/janusweb.assetworker.js" |uglifyjs >"$BUILDDIR/janusweb.assetworker.min.js" && echo -n '.'
echo 'done'
rm janusweb.assetworker.css
echo Built new release in \"$BUILDDIR/\"

cd $BUILDROOT
tar czf "$ZIPNAME.tar.gz" "$BUILDBASE" --transform=s/${BUILDBASE}/$ZIPNAME/ 

