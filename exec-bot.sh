#!/usr/local/bin/bash
##!/usr/bin/env bash

echo "executing bot $(date)"

# crash/stop on errors
set -e

PROJECT_HOME=$(realpath "$( cd "${BASH_SOURCE[0]%/*}" && pwd )")
cd "$PROJECT_HOME"

# shellcheck disable=SC1090
source ./scripts/lib/shared.sh
echo "wut: $PROJECT_HOME"
exit 1

echo_env

ensure_nvm

namespace bot

###############
#
#echo "executing bot $(date)"
#
#echo "echo_announce"
echo_announce
#echo "\echo_announce"

DATE=$(date +%F-%S)
NETWORK=${1:-local}

exec_cmd() {
  COMMAND="$1"
  PROTOCOL="bot"
  FILENAME="${DATE}-${NETWORK}-${PROTOCOL}-${COMMAND}"
  FILEPATH="./transaction-history/$FILENAME"

  nudge() {
    F=$1
    yq -o json -P < "$F" > "${F}on" || true
    rm "$F" || true
  }

  ./exec-checkfunds.sh "$NETWORK" > "${FILEPATH}-before.js" ; nudge "${FILEPATH}-before.js"
#  npx hardhat "checkfunds" --network "$NETWORK" > "${FILEPATH}-before.js" ; nudge "${FILEPATH}-before.js"
  npx hardhat "$COMMAND" --network "$NETWORK" 2>&1 | tee "${FILEPATH}-exec.txt"
  npx hardhat "checkfunds" --network "$NETWORK" > "${FILEPATH}-finally.js" ; nudge "${FILEPATH}-finally.js"
#  npx hardhat "checkfunds" --network "$NETWORK" 2>&1 > "${FILEPATH}-finally.js" ; nudge "${FILEPATH}-finally.js"
}

echo 'exec_cmd grapeFlow05'
exec_cmd "grapeFlow05"
echo '\exec_cmd grapeFlow05'