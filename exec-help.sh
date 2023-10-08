#!/usr/local/bin/bash
##!/usr/bin/env bash

echo "executing $(date)"

# crash/stop on errors
#set -e

#SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd )"
#echo "$SCRIPTPATH: $SCRIPTPATH"

PROJECT_HOME=$(realpath "$( cd "${BASH_SOURCE[0]%/*}" && pwd )") && cd "$PROJECT_HOME" || exit 1
source "$PROJECT_HOME/scripts/lib/shared.sh"

namespace bot

echo_announce

# shellcheck disable=SC1090
#source ./scripts/lib/shared.sh
#echo "wut: $PROJECT_HOME"
#echo_env
#ensure_nvm

