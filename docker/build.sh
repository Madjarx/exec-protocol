#!/usr/bin/env bash

set -e

DIR=$(realpath "$( cd "${BASH_SOURCE[0]%/*}" && pwd )") && cd "$DIR" && source ./vars.sh

./build-deps.sh
./build-app.sh
