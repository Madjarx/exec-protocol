#!/usr/bin/env bash

set -e

DIR=$(realpath "$( cd "${BASH_SOURCE[0]%/*}" && pwd )") && cd "$DIR" && source ./vars.sh

TAG="$PROJECT_TAG-app:$PROJECT_VERSION"
FILE=./Dockerfile
CTX=../

DOCKER_BUILDKIT=${DOCKER_BUILDKIT} docker build "$DOCKER_BUILDARG" -t "$TAG" -f "$FILE" "$CTX"
#DOCKER_BUILDKIT=1 docker build -t "$TAG" -f "$FILE" "$CTX"