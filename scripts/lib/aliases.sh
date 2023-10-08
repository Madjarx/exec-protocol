#!/usr/bin/env bash

# to use these, type "source aliases.sh"

#export EVO_ANSIBLE_APP_HOME=$(realpath $( cd "${BASH_SOURCE[0]%/*}" && cd .. && pwd ))
#export EVO_ANSIBLE_LIB_HOME=$(realpath $( cd "${BASH_SOURCE[0]%/*}" && pwd ))

#EVO_ANSIBLE_APP_SCRIPT=$(realpath "$EVO_ANSIBLE_LIB_HOME/evo.sh")
#EVO_ANSIBLE_LIB_TOOLKIT_HOME=$(realpath "$EVO_ANSIBLE_APP_HOME/toolkit")
#EVO_ANSIBLE_LIB_TOOLKIT_SCRIPT=$(realpath "$EVO_ANSIBLE_LIB_TOOLKIT_HOME/lib/toolkit.sh")

#function is_evo_home() {
#    [[ $(pwd) -ef "${EVO_ANSIBLE_APP_HOME}" ]]
#}

function pushd_or_popd() {
    # if the prev in the stack is our goal, then popd there instead of pushd.
    set -e

    local COUNT=$($(echo dirs -l -p) | grep -c ^)
    local PREV=$([[ ${COUNT} -gt 1 ]] && $(echo dirs -l -p +1) || echo "")
    local DEST=$(realpath "$1")

    # if not defined, then just push
    if [[ -z $PREV ]]; then
        pushd "${DEST}"
    fi

    if [[ $(realpath ${PREV}) == $(realpath ${DEST}) ]]; then
        popd
    else
        pushd ${DEST}
    fi

    set +e
}

#function pushd_toolkit_home() {
#    [[ $(pwd) -ef "${EVO_ANSIBLE_LIB_TOOLKIT_HOME}" ]] && ${EVO_ANSIBLE_LIB_TOOLKIT_SCRIPT} || { pushd_or_popd ${EVO_ANSIBLE_LIB_TOOLKIT_HOME} && ${EVO_ANSIBLE_LIB_TOOLKIT_SCRIPT}; }
#}
#
#function pushd_ansible_home() {
#    [[ $(pwd) -ef "${EVO_ANSIBLE_APP_HOME}" ]] && ${EVO_ANSIBLE_APP_SCRIPT} || {  pushd_or_popd ${EVO_ANSIBLE_APP_HOME} && ${EVO_ANSIBLE_LIB_HOME}/evo.sh; }
#}

#function play_helper() {
#    # usage: fancy_play check-pings.yml BOC
#    # usage: ansible-playbook check-pings.yml --extra-vars only=BOC
#
#    # usage: fancy_play check-pings.yml BOC second=var
#    # usage: ansible-playbook check-pings.yml --extra-vars "only=BOC second=var"
#
#    local COMMAND="ansible-playbook "
#
#    local PLAYBOOK_FILE=$1
#    local PARAM_ONLY=$2
#    local PARAM_EXTRA=$3
#
#    local EXTRA_VARS=""
#    local EXTRA_VARS_SECTION=""
#
#    if [[ ! -z ${PARAM_ONLY} ]]; then
#        EXTRA_VARS="only=$PARAM_ONLY"
#    fi
#
#    if [[ ! -z ${PARAM_EXTRA} ]]; then
#        EXTRA_VARS="$EXTRA_VARS $PARAM_EXTRA"
#    fi
#
#    #IFS="" # THIS IS FUCKING MAGIC
#
#    if [[ -z ${EXTRA_VARS} ]]; then
#        ansible-playbook ${PLAYBOOK_FILE}
#    else
#        ansible-playbook ${PLAYBOOK_FILE} --extra-vars "$EXTRA_VARS"
#    fi
#}

#alias evo="pushd_ansible_home"
#
#alias evo-hosts="$EVO_ANSIBLE_LIB_HOME/parse-host-groups.sh"
#alias evo-plays="ls -al -1 $EVO_ANSIBLE_APP_HOME/*-*.yml | xargs -n 1 basename"
#alias evo-toolkit="pushd_toolkit_home"
#alias evo-help="$EVO_ANSIBLE_LIB_HOME/evo-help.sh"
#
#alias play="play_helper "
#
#alias check-pings="play check-pings.yml "
#alias check-disks="play check-disks.yml "
#alias check-vpn-conns="play check-vpn-conns.yml "
#
#alias fetch-configs="play fetch-configs.yml "

# give them a nice intro msg
