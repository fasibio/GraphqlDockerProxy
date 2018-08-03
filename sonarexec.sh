#!/bin/bash

sonar-scanner -Dsonar.projectKey=graphqldockerproxy -Dsonar.sources=. -Dsonar.host.url=https://sonar.server2.fasibio.de -Dsonar.login=$sonarqubelogin -Dsonar.testExecutionReportPaths=reports/test-reporter.xml -Dsonar.test.exclusions=**.test.js
