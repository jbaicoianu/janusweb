#!/bin/sh

[ -e elation ] && rm -r elation
[ -e node_modules ] && rm -r node_modules
[ -d build ] && rm -r build
read -p "[?] bleeding-edge dependencies? (y/n) " ok
test "$ok" = y && rm package-lock.json
npm install
utils/build.sh
