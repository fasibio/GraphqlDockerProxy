import { makeExecutableSchema } from 'graphql-tools'
import { getBuildNumber, getVersion, getPollingMs } from '../properties'

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
    version: String
    buildNumber: String
    pollingTimeMS: Int
  }

  type Query{
    namespaces: [namespace]
    configuration: Configuration
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
  Query: {
    configuration: () => {
      return {
        version: getVersion(),
        buildNumber: getBuildNumber(),
        pollingTimeMS: getPollingMs(),
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
