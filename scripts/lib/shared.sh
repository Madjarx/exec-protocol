#!/usr/bin/env bash

# make it so you can run from any directory: https://stackoverflow.com/a/16349776/726368
SHARED_HOME=$(cd "`dirname "${BASH_SOURCE[0]}"`" > /dev/null && pwd)
PROJECT_HOME=$(realpath "$SHARED_HOME/../../")

## BOOTSTRAP ##
source "${SHARED_HOME}/bash-oo-framework/lib/oo-bootstrap.sh"

##import util/exception
#import util/exception
import util/

#### ADD OUTPUT OF "namespace" TO DELEGATE STDERR
Log::AddOutput default DEBUG

Log::AddOutput debug DEBUG
Log::AddOutput error ERROR

Log::AddOutput bstreet DEBUG
Log::AddOutput bot DEBUG
#Log::AddOutput setup DEBUG

namespace bstreet
subject=bstreet Log "$(UI.Color.DarkGray) shared.sh"

source "$SHARED_HOME/./functions.sh"

echo_env() {
  echo "$PROJECT_HOME"
  env
  pwd
  ls -lh
}

ensure_nvm() {
  echo "source ./src-nvm.sh"
  source ./src-nvm.sh
  echo "nvm use v14"
  nvm use v14
}

function echo_announce() {
echo "
 _               _                 _        _           _ _     _
| |             | |               | |      | |         (_) |   | |
| |__        ___| |_ _ __ ___  ___| |_     | |__  _   _ _| | __| |
| '_ \  __  / __| __| '__/ _ \/ _ \ __|    | '_ \| | | | | |/ _| |
| |_) |     \__ \ |_| | |  __/  __/ |_     | |_) | |_| | | | (_| |
|_.__/      |___/\__|_|  \___|\___|\__| (_)| _._/\_,_|_|_|_|\____|

$(UI.Color.DarkGray)# $(UI.Color.Green) ██╗   ██╗██╗███████╗██╗     ██████╗ $(UI.Color.DarkGray)██████   ██████  ████████
# $(UI.Color.Green) ╚██╗ ██╔╝██║██╔════╝██║     ██╔══██╗$(UI.Color.DarkGray)██   ██ ██    ██    ██
# $(UI.Color.Green)  ╚████╔╝ ██║█████╗  ██║     ██║  ██║$(UI.Color.DarkGray)██████  ██    ██    ██
# $(UI.Color.Green)   ╚██╔╝  ██║██╔══╝  ██║     ██║  ██║$(UI.Color.DarkGray)██   ██ ██    ██    ██
# $(UI.Color.Green)    ██║   ██║███████╗███████╗██████╔╝$(UI.Color.DarkGray)██████   ██████     ██
# $(UI.Color.Green)    ╚═╝   ╚═╝╚══════╝╚══════╝╚═════╝ $(UI.Color.DarkGray)        $(UI.Color.Default)
"

#    subject=bot Log "$(UI.Color.DarkGray)# @author  dan, msmyers"
#    subject=bot Log "$(UI.Color.DarkGray)# @since   01.01/22"
#    subject=bot Log "$(UI.Color.DarkGray)# @desc    $(UI.Color.Green)We help people$(UI.Color.DarkGray) make lots of $(UI.Color.Green)$(UI.Color.Bold)gainz.$(UI.Color.Default)"
#    subject=bot Log "$(UI.Color.DarkGray)# @url     b-street.build"
#    subject=bot Log "$(UI.Color.DarkGray)#"
#    subject=bot Log "$(UI.Color.DarkGray)#####$(UI.Color.Default)"
}

function has() {
    local words=$1

    echo "> $(UI.Color.DarkGray)${words} ;$(UI.Color.Default)"
}

function with_color() {
    echo "$1$2$(UI.Color.Default)"
}

function with_vars() {
    local color=$(UI.Color.DarkGray);

#    if [[ -z $2 ]]; then
        with_color "$color" "$1"
#    else
#        with_color $(UI.Color.Blue) "$1=$(UI.Color.DarkGray)$2"
#    fi
}

function with_host() {
    with_color $(UI.Color.Yellow) "$1"
}

function with_file() {
    with_color $(UI.Color.Blue) "$1"
}

function has_cmd() {
    with_color $(UI.Color.Magenta) "$1"
}

function category() {
    with_color $(UI.Color.Default) "$1:"
}

function comment() {
    with_color $(UI.Color.DarkGray) "# $1"
}

#exit 0