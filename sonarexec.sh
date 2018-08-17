#!/bin/bash

sonar-scanner -Dsonar.projectKey=graphqldockerproxy_$CI_COMMIT_REF_NAME -Dsonar.sources=. -Dsonar.host.url=https://sonar.server2.fasibio.de -Dsonar.login=$sonarqubelogin
