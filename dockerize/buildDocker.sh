#!/bin/bash
# $1 = version

docker build --build-arg version=$1 --build-arg buildNumber=$CI_PIPELINE_IID -t fasibio/graphqldockerproxy:$1 .