#!/bin/bash

sonar-scanner -Dsonar.projectKey=graphqldockerproxy -Dsonar.sources=. -Dsonar.host.url=https://sonar.server2.fasibio.de -Dsonar.login=$sonarqubelogin -Dsonar.genericcoverage.unitTestReportPaths=reports/test-reporter.xml
