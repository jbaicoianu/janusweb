#!/bin/bash

echo "Creating directory tree..."
DEPENDENCYPATHS=$(npm ls -parseable)

declare -A dependencies

for DEP in $DEPENDENCYPATHS; do
  DEPNAME=$(basename $DEP)
  dependencies[$DEPNAME]=$DEP
done

if [ ! -d elation ]; then
  ln -s ${dependencies["elation"]}

  cd elation/components
  ln -s ${dependencies["elation-engine"]} engine
  ln -s ${dependencies["elation-share"]} share
  ln -s ${dependencies["cyclone-physics"]} physics
  ln -s ${dependencies["janusweb"]} janusweb

  cd ..
  ./elation web init
  ./elation component enable engine physics share janusweb
fi
echo "done"
