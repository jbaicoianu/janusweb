#!/bin/bash

# Usage: promote.sh <from> <to>

VERSION=$1
TO=$2

function join_by { local IFS="$1"; shift; echo "$*"; }
if [ -z "$TO" ]; then
  IFS='.' read -ra parts <<< "$VERSION"
  unset 'parts[${#parts[@]}-1]'  
  TO=$(join_by . ${parts[@]})
fi


echo "$VERSION => $TO"
cd build/

if [ -L $TO ]; then 
  rm $TO
fi
ln -sf $VERSION $TO
