import { getBlacklist, clearAll } from '../interpreter/finder/k8sFinder/blacklist'

export const typeDefs = `
type Kubernetes{
    blacklist: [String]
    clearBlackList: Boolean
  }
type Query{
    kubernetes: Kubernetes

  }
`

export const resolvers = {
  Query: {
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
  },

}
