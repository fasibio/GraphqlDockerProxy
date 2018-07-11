#!/bin/bash
# $1 = version
sudo docker login -u $dockerhubuser -p $dockerhubpassword
docker push fasibio/graphqldockerproxy:$1