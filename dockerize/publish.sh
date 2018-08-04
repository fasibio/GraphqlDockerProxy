#!/bin/bash
# $1 = version
docker login -u $dockerhubuser -p $CI_JOB_TOKEN
docker push fasibio/graphqldockerproxy:$1