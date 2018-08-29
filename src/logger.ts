import * as winston from 'winston'
import { getLogLevel, getLogFormat, getEnableClustering } from'./properties'
import * as cluster from 'cluster'

let logFormat = winston.format.simple()
switch (getLogFormat()){
  case 'simple': {
    logFormat = winston.format.simple()
    break
  }
  case 'json': {
    logFormat = winston.format.json()
    break
  }

}

const maskIntospectionFormat = winston.format((info) => {
  if (info.__intospection) {
    info.__intospection = 'masked for better overview'
  }
  return info
})

const workingClusterFormat = winston.format((info) => {
  if (cluster.isMaster) {
    info.serverRole = 'master'
  } else {
    info.serverRole = 'slave: ' + cluster.worker.id
  }
  return info
})

let format = winston.format.combine(
  winston.format.timestamp(),
  logFormat,
)
if (getEnableClustering()) {
  format = winston.format.combine(
    maskIntospectionFormat(),
    workingClusterFormat(),
    winston.format.timestamp(),
    logFormat)

}

global.winston = winston.createLogger({
  format,
  level: getLogLevel(),

  // format: winston.format.simple(),

  transports: [
    new winston.transports.Console(),
  ],
})
