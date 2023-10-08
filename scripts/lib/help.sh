#!/usr/bin/env bash

LIB_HOME=$(realpath $( cd "${BASH_SOURCE[0]%/*}" && pwd ))
PROJECT_HOME=$(realpath $( cd "${BASH_SOURCE[0]%/*}" && cd .. && pwd ))

source $(realpath "$LIB_HOME/shared.sh")

#echo_announce

echo ""
echo "    $(UI.Color.Red)$(UI.Color.Bold)$(UI.Color.Underline)COMMANDS$(UI.Color.Default):"

#        $(has "$(has_cmd 'play') $(with_file 'FILE') $(with_host 'HOST') $(with_vars "OPTS")")

echo """
        $(has "$(has_cmd 'check-balances') $(with_host 'HOST') $(with_vars "OPTS")")

        $(comment 'cat ybot.yml')
        $(has "$(has_cmd 'show-config')")

        $(comment 'root@vpn.evoeco.com:/etc/openvpn/openvpn-status.log')
        $(has "$(has_cmd 'list-tasks') $(with_host 'HOST') $(with_vars "OPTS")")

        $(comment 'ls -lh ./transaction-history/')
        $(has "$(has_cmd 'list-history')")

        $(has "$(has_cmd "$(UI.Color.Bold)ybot")")
"""

