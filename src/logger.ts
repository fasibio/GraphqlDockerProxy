import * as winston from 'winston'
import { getEnableClustering } from'./properties'
import * as cluster from 'cluster'
import { Endpoints } from './interpreter/endpoints'
import * as cloner from 'cloner'

type loadLoggerParam = {
  logFormat: string,
  loglevel: string,
}
export const loadLogger = (param: loadLoggerParam) => {
  let logFormat = winston.format.simple()
  switch (param.logFormat){
    case 'simple': {
      logFormat = winston.format.simple()
      break
    }
    case 'json': {
      logFormat = winston.format.json()
      break
    }

  }

  const maskIntrospectionFormat = winston.format((info) => {
    const result = cloner.deep.copy(info)
    if (result.endpoints) {
      const endpoints: Endpoints = result.endpoints
      for (const one in endpoints) {
        const oneEndpoint = endpoints[one]
        for (let i = 0; i < oneEndpoint.length; i = i + 1) {
          const oneConnection = oneEndpoint[i]
          delete oneConnection.__introspection
          delete oneConnection.__loadbalance
        }

      }
    }
    return result
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
  maskIntrospectionFormat(),
  logFormat,
)
  if (getEnableClustering()) {
    format = winston.format.combine(
    workingClusterFormat(),
    winston.format.timestamp(),
    logFormat)

  }

  global.winston = winston.createLogger({
    format,
    level: param.loglevel,

  // format: winston.format.simple(),

    transports: [
      new winston.transports.Console(),
    ],
  })

}
