#!/usr/bin/env bash
# Manage local npm links for janusweb's elation-family dependencies.
#
# Default workflow: `npm install` pulls published versions of these
# packages into node_modules. Use this script to swap any of them for
# a local checkout while developing, and swap back when done.
#
# Usage:
#   utils/dev-link.sh link    <pkg> <path>   point node_modules/<pkg> at <path>
#   utils/dev-link.sh unlink  <pkg>          remove the link and reinstall <pkg>
#   utils/dev-link.sh status                 show link state for tracked packages

set -e

# Packages this script knows about, for the `status` listing. Linking
# isn't restricted to these — `link <name> <path>` works for any name.
TRACKED=(elation elation-engine cyclone-physics elation-share)

JANUSWEB_DIR="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \?//'
  exit 1
}

cmd_link() {
  local name="$1" path="$2"
  if [ -z "$name" ] || [ -z "$path" ]; then
    echo "link requires <pkg> and <path>" >&2; usage
  fi
  if [ ! -d "$path" ]; then
    echo "Source path not found: $path" >&2; exit 1
  fi
  path="$(cd "$path" && pwd)"
  echo "==> Linking $name from $path"
  (cd "$path" && npm link >/dev/null)
  (cd "$JANUSWEB_DIR" && npm link "$name" >/dev/null)
}

cmd_unlink() {
  local name="$1"
  if [ -z "$name" ]; then
    echo "unlink requires <pkg>" >&2; usage
  fi
  local target="$JANUSWEB_DIR/node_modules/$name"
  if [ ! -L "$target" ]; then
    echo "$name is not linked"; exit 0
  fi
  echo "==> Unlinking $name and reinstalling from registry"
  (cd "$JANUSWEB_DIR" && npm unlink "$name" --no-save >/dev/null) || true
  (cd "$JANUSWEB_DIR" && npm install "$name" --no-save >/dev/null)
}

cmd_status() {
  for name in "${TRACKED[@]}"; do
    local target="$JANUSWEB_DIR/node_modules/$name"
    if [ -L "$target" ]; then
      printf "  %-22s linked  -> %s\n" "$name" "$(readlink "$target")"
    elif [ -d "$target" ]; then
      local v
      v=$(node -p "require('$target/package.json').version" 2>/dev/null || echo "?")
      printf "  %-22s installed (%s)\n" "$name" "$v"
    else
      printf "  %-22s not installed\n" "$name"
    fi
  done
}

case "${1:-}" in
  link)   shift; cmd_link   "$@" ;;
  unlink) shift; cmd_unlink "$@" ;;
  status) cmd_status ;;
  -h|--help|help|'') usage ;;
  *) echo "Unknown command: $1" >&2; echo; usage ;;
esac
