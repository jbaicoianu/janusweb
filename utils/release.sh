#!/bin/bash

# Process:
#  - increment version number
#  - update package.json
#  - run build script
#  - create zip
#  - publish to npm
#  - git tag
#  - update latest version aliases
#  - push to s3
#  - publish release notes


# The build will be stored by version, and then aliased out to its parent version numbers.  
# For example, if we just released 0.9.8, the following files would all be the same:
#
#   build/v0.9.8/janusweb.js
#   build/v0.9/janusweb.js
#   build/v0/janusweb.js
#   build/janusweb.js
#
# This allows us to keep all previous versions around, and website authors can choose which
# version they link to.  Users are encouraged to link to the latest minor version so they 
# receive bugfixes and 
# they are they can just link to a more specific that was known to work

RELTYPE=$1
# RELTYPE can be:
# - major
# - minor
# - patch
# - set

VERSIONFILE=VERSION
PACKAGEFILE=package.json

function get_current_version() {
  cat $VERSIONFILE
}
function join_by { local IFS="$1"; shift; echo "$*"; }
function get_next_version() {
  RELTYPE=$1
  CURVER=$(get_current_version)
  IFS='.' read -ra VERSIONS <<< "$CURVER"

  #echo "version $CURVER"
  #echo "Reltype $RELTYPE"

  case $RELTYPE in
    "major")
      NUM=${VERSIONS[0]}
      VERSIONS[0]=$((NUM + 1))
      VERSIONS[1]=0
      VERSIONS[2]=0
      ;;
    "minor")
      NUM=${VERSIONS[1]}
      VERSIONS[1]=$((NUM + 1))
      VERSIONS[2]=0
      ;;
    "patch")
      NUM=${VERSIONS[2]}
      VERSIONS[2]=$((NUM + 1))
      ;;
    "set")
      IFS='.' read -ra VERSIONS <<< "$2"
      ;;
  esac
 
  join_by . "${VERSIONS[@]}"
}
function update_version {
  NEWVERSION=$1
  echo $NEWVERSION >$VERSIONFILE
  npm 
  
}

NEWVER=$(get_next_version "$RELTYPE")
echo $NEWVER



