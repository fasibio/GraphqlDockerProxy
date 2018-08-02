#!/bin/bash

sonar-scanner -Dsonar.projectKey=graphqldockerproxy -Dsonar.sources=. -Dsonar.host.url=https://sonar.server2.fasibio.de -Dsonar.login=$sonarqubelogin -Dsonar.gitlab.commit_sha=$CI_COMMIT_SHA -Dsonar.gitlab.ref_name=$CI_COMMIT_REF_NAME -Dsonar.gitlab.project_id=$CI_PROJECT_ID