#!/bin/sh

if [ ! -d elation ]; then
  git clone https://github.com/jbaicoianu/elation.git
  cd elation
  git clone https://github.com/jbaicoianu/elation-engine.git components/engine
  git clone https://github.com/jbaicoianu/cyclone-physics-js.git components/physics
  git clone https://github.com/jbaicoianu/elation-share.git components/share
  #git clone https://github.com/jbaicoianu/janusweb.git components/janusweb
  ln -s `pwd`/.. components/janusweb
  ./elation web init
  ./elation component enable engine physics share janusweb
fi
