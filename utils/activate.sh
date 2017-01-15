#!/bin/bash

TARGET=$1

if [ -z "$TARGET" ]; then
  TARGET=$(node -pe "require('./package.json').version")
fi

cd build/
if [ -e $TARGET ]; then
  for FILE in $TARGET/*; do
    FNAME=$(basename $FILE)
    [ -e $FNAME ] && rm $FNAME
    ln -s $FILE $FNAME
  done
else
  echo Target \"$TARGET\" does not exist
fi

