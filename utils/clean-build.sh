#!/bin/sh
# this script is basically you'd tell people to run to ensure a clean build.
# since utils/build.sh will not copy new assets/webui apps in /media
[ -e elation ] && rm -r elation
[ -e node_modules ] && rm -r node_modules
[ -d build ] && rm -r build
npm install
utils/build.sh
