#!/bin/sh
VERSION=$( $(which node) -pe "require('./package.json').version")

set -xe
docker build -t janusxr --build-arg JANUSXR_VERSION=$VERSION .

# push to registry
docker login codeberg.org
docker tag janusxr:latest codeberg.org/coderofsalvation/janusxr:$VERSION
docker push codeberg.org/coderofsalvation/janusxr:$VERSION 

