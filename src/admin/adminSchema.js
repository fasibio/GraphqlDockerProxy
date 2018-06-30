import { makeExecutableSchema } from 'graphql-tools'

const typeDefs = `
  type namespace{
    name: String
    endpoints:[endpoint]
  }

  type endpoint{
    url: String
    created: Float
    imageID: String
    loadBalance: loadBalance
  }

  type loadBalance{
    count: Int
    endpoints: [endpoint]
  }

  type Query{
    namespaces: [namespace]
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

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

export default schema
