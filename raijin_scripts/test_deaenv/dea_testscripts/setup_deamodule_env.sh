#!/usr/bin/env bash

LANG=en_AU.UTF-8

if [ "$#" -eq 2 ]
then
   DC_CONFIG_PATH="$2"
else
  echo "       Usage: $(basename "$0") [--help] [DEA_MODULE_TO_TEST] [DATACUBE_CONFIG_FILE]
                 where:
                       DEA_MODULE_TO_TEST  Module under test (ex. dea/20180503 or dea-env or dea)
                       DATACUBE_CONFIG_FILE  Datacube Config file path"
  echo
  exit 0
fi

module use /g/data/v10/public/modules/modulefiles
if [[ -n "$(module avail git 2>&1)" ]]; then
    module load git
fi

module load "$1"
module load udunits

export DATACUBE_CONFIG_PATH="$DC_CONFIG_PATH"
