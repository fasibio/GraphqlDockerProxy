import { makeExecutableSchema } from 'graphql-tools'
import { getBuildNumber, getVersion, getPollingMs, runtime, getBodyParserLimit, network, getLogFormat, getLogLevel } from '../properties'
import { loadLogger } from '../logger'
import { Interpreter } from '../interpreter/Interpreter'
export const typeDefs = `
  type namespace{
    name: String
    endpoints:[endpoint]
  }

  type endpoint{
    url: String
    created: String
    imageID: String
    loadBalance: loadBalance
  }

  type loadBalance{
    count: Int
    endpoints: [endpoint]
  }



  type Configuration{
    runtime: String
    version: String
    buildNumber: String
    pollingTimeMS: Int
    bodyParserLimit: String
    dockerNetwork: String
    logging: Logging
  }

  type Logging {
    format: String
    level: String

  }

  type Query{
    namespaces: [namespace]
    configuration: Configuration
  }

  enum logFormat {
    simple
    json
  }

  enum logLevel {
    debug
    info
    error
    warn
  }
  type Mutation{
    updateLogger(logFormat: logFormat, logLevel: logLevel ): Boolean
    resetEndpointFinderWatcher: Boolean
  }


`
const mappingEndpoint = (endpoint) => {
  return endpoint.map((one) => {
    let data = {
      url: one.url,
      created: one.__created,
      imageID: one.__imageID,
    }
    if (one.__loadbalance) {
      data = Object.assign({}, data, {
        loadBalance: {
          count: one.__loadbalance.count,
          endpoints: mappingEndpoint(one.__loadbalance.endpoints),
        },

      })
    }
    return data
  })
}
export const resolvers = {
  Mutation: {
    resetEndpointFinder: (root, args, context) => {
      const interpreter : Interpreter = context.interpreter
      winston.info('Reset Watching from K8S endpoints manual')
      interpreter.resetConnection()
      return true
    },

    updateLogger: (root, args) => {
      loadLogger({
        logFormat: args.logFormat,
        loglevel: args.logLevel,
      })
      winston.info('update loggerconfig temporary', args)
      return true
    },
  },
  Query: {
    configuration: () => {
      return {
        runtime,
        version: getVersion,
        buildNumber: getBuildNumber,
        pollingTimeMS: getPollingMs,
        bodyParserLimit: getBodyParserLimit,
        dockerNetwork: network,
        logging: {
          format: getLogFormat,
          level: getLogLevel,

        },

      }
    },

    namespaces: (one, two, context) => {
      const result = []
      const endpoints = context.endpoints

      for (const one in endpoints) {
        const oneEndpoint = endpoints[one]
        const oneValue = {
          name: one,
          endpoints: mappingEndpoint(oneEndpoint),
        }
        result.push(oneValue)
      }
      return result
    },
  },
}

const adminschema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

export default adminschema
