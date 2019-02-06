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
ORIGINALROOT=$(pwd)
BUILDROOT=$(pwd)/build
BUILDDIR=${BUILDROOT}/${VERSION}
PREPACKBUILDDIR=$BUILDROOT/osx-$VERSION

cp $(pwd)/scripts/electron/janusElectron.js $BUILDDIR/app.js
cp $(pwd)/scripts/electron/package.json $BUILDDIR/package.json

cd ${BUILDDIR}

npm install
electron-builder \"${BUILDDIR}\" --platform=osx
cp ${BUILDDIR}/dist ${PREPACKBUILDDIR}
rm -rf ${BUILDDIR}/dist