#!/usr/bin/env bash

{
    ##
    # example: 'get_abs_path /folder/../path' -> /path
    # from: https://stackoverflow.com/a/6393490/726368
    ##
    function get_abs_path() {
         local PARENT_DIR=$(dirname "$1")
         cd "$PARENT_DIR"
         local ABS_PATH="$(pwd)"/"$(basename "$1")"
         cd - >/dev/null
         echo "$ABS_PATH"
    }

    function touch_ssh() {
        local file=$1
        local dest=$2

        ssh -o BatchMode=yes -o ConnectTimeout=5 -o IdentitiesOnly=yes -F /dev/null -i $1 -T $2 || SSH_GIT_EXIT_CODE=$?

        if [[ ${SSH_GIT_EXIT_CODE} -eq 1 ]]; then
            echo "true"
        else
            echo ${SSH_GIT_EXIT_CODE}
        fi
    }

    function touch_github() {
        local file=$1

        ssh -o BatchMode=yes -o ConnectTimeout=5 -o IdentitiesOnly=yes -F /dev/null -i $1 -T git@github.com || SSH_GIT_EXIT_CODE=$?

        if [[ ${SSH_GIT_EXIT_CODE} -eq 1 ]]; then
            echo "true"
        else
            echo ${SSH_GIT_EXIT_CODE}
        fi
    }

    # Check for dependencies
    function check_req {
      which $1 &> /dev/null
      if [[ "$?" -ne 0 ]]
      then
        echo "$1 is either not installed or is not in your path"
        exit 2
      else
        echo "$1 found"
      fi
    }

    # call via: getFolderName git@github.com:account/repo.git
    function parse_folder_name() {
        # https://linuxize.com/post/bash-functions/
        # https://stackoverflow.com/questions/918886/how-do-i-split-a-string-on-a-delimiter-in-bash

        local IN=$1
        arrIN=(${IN//\:/ })

        IN="${arrIN[1]}"
        arrIN=(${IN//\./ })

        IN="${arrIN[0]}"
        arrIN=(${IN//\// })

        echo ${arrIN[1]}
        exit 0;
    }

    function to_path_string() {
        local PATH_STRING=$1

        echo "\"$PATH_STRING\"";
    }

    function file_contains_string() {
        local FILE_PATH=$1;
        local STRING=$2;


        if [[ -f ${FILE_PATH} ]]; then
            cat "$FILE_PATH" | grep -q "$STRING" && echo "true" || echo "false"
        else
            echo "false"
        fi

    }

    function test_string_nonempty() {
        local STRING_VALUE=$1;

        if [[ -n ${STRING_VALUE} ]]; then
            echo "true";
        else
            echo "false";
        fi
    }

    function test_is_true() {
        local VALUE=$1

        if [[ $(test_string_nonempty $VALUE) = "true" ]]; then
            echo "true"
        else
            if [[ $VALUE -eq 0 ]]; then
                echo "true";
            elif [[ $VALUE -eq "0" ]]; then
                echo "true";
            else
                echo "false";
            fi
        fi
    }



    function with_prefix(){
        local prefix="$(UI.Color.DarkGray)$(UI.Powerline.Lightning) [ $1$(UI.Color.DarkGray) ]$(UI.Color.Default) $(UI.Powerline.Saxophone)"

          while read line; do
            echo "$prefix" "$line"
          done
    }

    function with_child_prefix() {
        local prefix="$(UI.Color.DarkGray)[ $1 ]$(UI.Color.Default)"

        while read line; do
            echo "$prefix" "$line"
        done
    }

    function with_branch_prefix() {
        local color=$1
        local projectName=$2
        local branchName=$3
        local prefix=$(project_colors "${color}" "${projectName}" "${branchName}")

        with_prefix "${prefix}"
    }

    function clone () {
        local FOLDER_NAME=$(parse_folder_name $1);
        local GIT_CLONE_ABSOLUTE_PATH="${DEVKIT_DEPLOY_ABSOLUTE_PATH}/${FOLDER_NAME}";

        echo "GIT_CLONE_ABSOLUTE_PATH: ${GIT_CLONE_ABSOLUTE_PATH}";

        if [[ ${PULL_FROM_GIT_ON_EVERY_RUN} = "true" ]]; then
            echo "PULL_FROM_GIT_ON_EVERY_RUN: true";

            if [[ -d ${GIT_CLONE_ABSOLUTE_PATH} ]]; then
                echo "FILE_EXISTS: true"
                echo "$(UI.Color.Bold)$(UI.Color.Red)DELETING: true$(UI.Color.Default) [ $GIT_CLONE_ABSOLUTE_PATH ]"

                rm -rf ${GIT_CLONE_ABSOLUTE_PATH}
            else
                echo "FILE_EXISTS: false"
                echo "DELETING: false"
            fi

            echo "CHECKOUT: true"

            echo ""
            echo "clone repo: pwd: $(pwd) | path: ${GIT_CLONE_ABSOLUTE_PATH}"
            git clone --progress $1 --branch $2 ${GIT_CLONE_ABSOLUTE_PATH} || RETURN_VALUE=$?

        else

            if [[ -d ${GIT_CLONE_ABSOLUTE_PATH} ]]; then
                echo "FILE_EXISTS: true"
                echo "CHECKOUT: false"
            else
                echo "FILE_EXISTS: false"
                echo "CHECKOUT: true"

                echo ""
                echo "clone repo: pwd: $(pwd) | path: ${GIT_CLONE_ABSOLUTE_PATH}"
                git clone --progress $1 --branch $2 ${GIT_CLONE_ABSOLUTE_PATH} || RETURN_VALUE=$?

            fi
        fi

        if [[ ${RETURN_VALUE} ]]; then

            if [[ ${RETURN_VALUE} -ne 0 ]]; then
                e="failed to clone repo" throw
            fi
        fi

            #git --exec-path="${GIT_CLONE_ABSOLUTE_PATH}" fetch
            #git --exec-path="${GIT_CLONE_ABSOLUTE_PATH}" pull

        echo ""
    }

    function clone_with_prefix() {
        local project_path=$1
        local branch_name=$2
        local project_name=$(parse_folder_name $1)

        clone ${project_path} ${branch_name} | with_branch_prefix $(UI.Color.Blink) "${project_name}" "${branch_name}"
    }

    # call: RESULT=$( deployPath relativePath )
    function get_deploy_path() {
        local VAR=$( get_abs_path ${DEVKIT_DEPLOY_ABSOLUTE_PATH}/$1 )

        echo ${VAR}
    }

    function relative_deploy_path() {
        local part=$1

        echo "$(UI.Color.Green)$DEVKIT_DEPLOY_RELATIVE_PATH/$part$(UI.Color.Default)"
    }

    function project_colors() {
        local color=$1
        local projectName=$2
        local branchName=$3

        echo "${color}${projectName}$(UI.Color.LightGray) # $(UI.Color.LightGreen)${branchName}"
    }

    ###########################################################################
    ###########################################################################

    function echo_code_block() {
        local MSG=$1

        echo "$(UI.Color.Red)${MSG}$(UI.Color.Default)"
    }

    function echo_keyvalue() {
        local key=$1
        local value=$2

        echo "$(UI.Color.Bold)$(UI.Color.White)${key}=$(UI.Color.Blue)${value}$(UI.Color.Default)"
    }

    function echo_block() {
        local color=$1
        local key=$2
        local block=$3

        echo "[ ${color}${key}$(UI.Color.Default) ] ${block}"
    }

    function echo_neutral() {
        local key=$1
        local block=$2
        local color=$(UI.Color.DarkGray)

        echo_block ${color} ${key} "${block}"
    }

    function echo_bad() {
        local key=$1
        local block=$2
        local color=$(UI.Color.Red)

        echo_block ${color} "${key}" "${block}"
    }

    function echo_good() {
        local key=$1
        local block=$2
        local color=$(UI.Color.Green)

        echo_block ${color} "${key}" "${block}"
    }

    ###########################################################################
    ###########################################################################

    HEADER_INDEX=0;

    function echo_header() {
        local is_skipped=$1
        local text=$2
        local runs_in_background=$3

        local x=!${runs_in_background}
        if [[ "${is_skipped}" == "true" ]]; then
            echo_skipped_header ${x} ${text}
            return;
        fi

        local banner_runs_in_background_text="( always running in background )"
        local banner_runs_in_background="$(UI.Color.Bold)$(UI.Color.LightGreen)${banner_runs_in_background_text}$(UI.Color.Default)"

        local banner_dormant_text="( not auto started )"
        local banner_dormant="$(UI.Color.Underline)$(UI.Color.DarkGray)${banner_dormant_text}$(UI.Color.Default)"
        local banner="$(test "${runs_in_background}" == "true" && echo "$banner_runs_in_background" || echo "$banner_dormant")"

        local color_if_background="$(UI.Color.Bold)$(UI.Color.Underline)$(UI.Color.Blue)"
        local color_if_dormant="$(UI.Color.Bold)$(UI.Color.Underline)$(UI.Color.Blue)"
        local color=$(test "${runs_in_background}" == "true" && echo "${color_if_background}" || echo "${color_if_dormant}")

        local prefix_if_background="$(UI.Color.Default)############################################"
        local prefix_if_dormant="$(UI.Color.Default)#############################################"
        local prefix="$(test "${runs_in_background}" == "true" && echo "${prefix_if_background}" || echo "${prefix_if_dormant}")"

        echo "$(UI.Color.Default)"
        echo "$(UI.Color.Default)${prefix} $(UI.Color.DarkGray)[ $((HEADER_INDEX=$HEADER_INDEX+1)) ] ${color}${text}$(UI.Color.Default) ${banner} #############################################$(UI.Color.Default)"
        echo "$(UI.Color.Default)"
    }

    function echo_skipping() {
        local block=$1

        echo_neutral "skipping" "$(UI.Color.DarkGray)${block}"
    }

    function echo_skipped_header() {
        local banner="[ SKIPPED ]"
        local runs_in_background=$1
        local text=$2

        local color_if_active="$(UI.Color.Bold)$(UI.Color.Underline)$(UI.Color.Blue)"
        local color_if_dormant=""
        local color="$(test "${runs_in_background}" == "true" && echo "${color_if_active}" || echo "${color_if_dormant}")"

        local prefix_if_active="#############################################$(UI.Color.DarkGray)"
        local prefix_if_dormant="$(UI.Color.DarkGray)#############################################"
        local prefix="$(test "${runs_in_background}" == "true" && echo "${prefix_if_active}" || echo "${prefix_if_dormant}")"

        echo "$(UI.Color.Default)"
        echo "$(UI.Color.Default)${prefix} [ $((HEADER_INDEX=$HEADER_INDEX+1)) ] ${color}${text} ${banner} #############################################$(UI.Color.Default)"
        echo "$(UI.Color.Default)"

    }

    function echo_step() {
        STEP_COUNT=$(($STEP_COUNT + 1))
        local text=$1

        echo ""
        echo "$(UI.Color.Bold)$(UI.Color.White)$(UI.Color.Invert) [ ${STEP_COUNT} ${text} ] $(UI.Color.Default)"
        echo ""
    }

#    # @param {String} text
#    # @see {https://stackoverflow.com/questions/31255699/double-parenthesis-with-and-without-dollar}
#    function echo_cmd_exec() {
#        local text=$1
#
#        DOES NOT WORK WITH "PAUSE ON ERROR"
#
#        echo_cmd_nonexec "${text}"
#        echo "$(UI.Color.Bold)$(eval ${text})$(UI.Color.Default)";
#    }

    # @param {String} text
    # @see {https://stackoverflow.com/questions/31255699/double-parenthesis-with-and-without-dollar}
    function echo_cmd_nonexec() {
        local text=$1

        echo "$(UI.Color.Invert)${text}$(UI.Color.Default)";
    }

    function echo_cp_cmd() {
#        local S=$(to_path_string $1);
#        local D=$(to_path_string $2);
        local S=$1
        local D=$2
        local DF=$($(cmp --silent ${S} ${D}) && "true" || echo "false")

        if [[ $(test_is_true "$DF") == "false" ]]; then
            echo "DIFFERENCE IS FALSE"
            return;
        fi

        if [[ -f ${D} ]]; then
            echo "REMOVE ${D}"
            rm ${D}
        fi

        echo_keyvalue "SOURCE" $S
        echo_keyvalue "DESTINATION" $D

        echo_cmd_nonexec "cp  $S $D";
        cp ${S} ${D}; # not sure why this is crashing, added || true
    }

    ###########################################################################
    ###########################################################################

    function get_docker_image_ids() {
        local IMAGE_ALIAS=$1
        local EXISTING_IMAGE_IDS=$(docker image ls -q -a -f reference="${IMAGE_ALIAS}")

        echo "$EXISTING_IMAGE_IDS"
    }

    function safely_clear_docker_image_cache() {
        local IMAGE_ALIAS=$1;
        local HAS_ARGS=$( test_string_nonempty ${IMAGE_ALIAS} );
        local IS_EXISTING=$( is_docker_image_existing ${IMAGE_ALIAS} );

        local block="docker image rm --force ${IMAGE_ALIAS}"

        if [[ "$IS_EXISTING" == "true" ]]; then
            echo_good "removing" "${block}"
            docker image rm --force $( get_docker_image_ids ${IMAGE_ALIAS} );
        else
            echo_skipping "${block}"
        fi
    }

    function get_docker_image_alias() {
        local name=$1;
        local tag=$2;

        if [[ -z ${tag} ]]; then
            echo "$name";
        else
            echo "$name:$tag";
        fi
    }

    function safely_stop_docker_container() {
        local CONTAINER_NAME=$1;
        local HAS_ARGS=$( test_string_nonempty ${CONTAINER_NAME} );
        local IS_RUNNING=$( is_docker_container_running ${CONTAINER_NAME} );

        local block="docker container stop ${CONTAINER_NAME}"

        if [[ "$IS_RUNNING" == "true" ]]; then
            echo_good "stopping" "${block}"
            docker container stop ${CONTAINER_NAME};
        else
            echo_skipping "${block}"
        fi
    }

    function safely_remove_docker_container() {
        local CONTAINER_NAME=$1;
        local HAS_ARGS=$( test_string_nonempty ${CONTAINER_NAME} );
        local IS_EXISTING=$( is_docker_container_existing ${CONTAINER_NAME} );

        safely_stop_docker_container ${CONTAINER_NAME}

        if [[ "$IS_EXISTING" == "true" ]]; then
            docker container rm --force ${CONTAINER_NAME};
#            docker container rm --force $( get_docker_image_ids ${IMAGE_ALIAS} );
        fi
    }

    function optionally_clear_docker_image_cache() {
        if [[ "${WIPE_DOCKER_CACHE_ON_EVERY_RUN}" == "false" ]]; then
            return;
        fi

        local IMAGE_ALIAS=$1

        safely_clear_docker_image_cache ${IMAGE_ALIAS}
    }

    function get_existing_docker_container_ids() {
        local CONTAINER_NAME=$1

        echo "$( docker ps -q -a -f name=${CONTAINER_NAME} )"
    }

    function get_running_docker_container_ids() {
        local CONTAINER_NAME=$1

        echo "$( docker ps -q -f name=${CONTAINER_NAME} )"
    }

    function is_docker_image_existing() {
        local IMAGE_ALIAS=$1;
        local IMAGE_IDS=$(get_docker_image_ids ${IMAGE_ALIAS})

        test_string_nonempty ${IMAGE_IDS}
    }

    function is_docker_container_existing() {
        local CONTAINER_NAME=$1;
        local CONTAINER_IDS=$(get_existing_docker_container_ids ${CONTAINER_NAME})

        test_string_nonempty ${CONTAINER_IDS}
    }

    function is_docker_container_running() {
        local CONTAINER_NAME=$1;
        local CONTAINER_IDS=$(get_running_docker_container_ids ${CONTAINER_NAME})

        test_string_nonempty ${CONTAINER_IDS}
    }


} #region functions
