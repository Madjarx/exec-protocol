#!/usr/bin/env bash

set -e

wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
chmod a+x /usr/local/bin/yq
yq --version

apt update && apt upgrade -y && apt install -y tree

echo '{test:true}' | yq -P