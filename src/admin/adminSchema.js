import { makeExecutableSchema } from 'graphql-tools'
import { getBlacklist, clearAll } from '../finder/k8sFinder/blacklist'
import { getBuildNumber, getVersion, getPollingMs } from '../properties'
const typeDefs = `
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

  type Kubernetes{
    blacklist: [String]
    clearBlackList: Boolean
  }

  type Configuration{
    version: String
    buildNumber: String
    pollingTimeMS: Int
  }

  type Query{
    namespaces: [namespace]
    kubernetes: Kubernetes
    configuration: Configuration
  }

`
const mappingEndpoint = (endpoint) => {
  return endpoint.map(one => {
    let data = {
      url: one.url,
      created: one.__created,
      imageID: one.__imageID,
    }
    if (one.__loadbalance){
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
const resolvers = {
  Query: {
    configuration: () => {
      return {
        version: getVersion(),
        buildNumber: getBuildNumber(),
        pollingTimeMS: getPollingMs(),
      }
    },
    kubernetes: () => {
      return {
        blacklist: () => {
          return getBlacklist()
        },
        clearBlackList: () => {
          clearAll()
          return true
        },
      }
    },
    namespaces: (one, two, context) => {
      const result = []
      const endpoints = context.endpoints

      for (const one in endpoints){
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
